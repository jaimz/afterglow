import { getMotionOptions } from "./motion";

/**
 * Adds placement, stacking, animation, announcements and optional automatic
 * dismissal to a native notification popover. Load the Afterglow styles and
 * mount an .ag-notification with an .ag-notification__message element and a
 * native button.ag-notification__close. The helper sets popover="manual".
 *
 * Call show() when there is a message to display. Position and other options
 * passed to show() apply to that opening; later calls use the original defaults.
 * A positive timeout starts after entry and pauses while hovered, focused, or
 * in a hidden document. Zero keeps the notification open until dismissed.
 * Place dialog-related notifications inside that dialog. Notifications outside
 * the active modal (or inside inert/closed content) wait until their scope is
 * available; their timeout starts after they are shown again.
 *
 * Listen for close events and read event.detail.reason to learn why it closed.
 * Call destroy() when disposing the view to release timers, listeners and the
 * live region. See Usage.md for full markup and positioning within a container.
 *
 * @example
 * import { enhanceNotification } from "ag";
 *
 * const element = document.querySelector<HTMLElement>("#saved-notification")!;
 * const notification = enhanceNotification(element, { timeout: 5000 });
 * await notification.show({ position: "bottom-right" });
 *
 * // When removing the notification from the page:
 * notification.destroy();
 */

/** Six physical edge positions, relative to the viewport or configured container. */
export type NotificationPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface NotificationOptions {
  /** Placement; defaults to data-position on the element, or top-right if absent. */
  position?: NotificationPosition;

  /** Milliseconds visible before closing; zero (the default) requires dismissal. */
  timeout?: number;

  /** Position within this view's visible bounds; null uses the viewport. */
  container?: HTMLElement | null;

  /** Live-region priority for message text; defaults to polite. */
  announcement?: "polite" | "assertive" | "off";
}

/** Reported as event.detail.reason on the bubbling close completion event. */
export type NotificationCloseReason =
  | "close-button"
  | "timeout"
  | "programmatic"
  | "native";

export interface NotificationController {
  update(options?: NotificationOptions): void;
  refresh(): void;
  /** Native popover visibility, including while the exit animation runs. */
  readonly open: boolean;

  /** Await entry, or queue while the owning scope is inert. Re-showing restarts timeout. */
  show(options?: NotificationOptions): Promise<void>;

  /** Await animated closing and emit close with the reason (programmatic by default). */
  hide(reason?: NotificationCloseReason): Promise<void>;

  /** Close immediately, release helper resources, and restore saved attributes/styles. */
  destroy(): void;
}

type Settings = Required<NotificationOptions>;
type ActiveNotification = { element: HTMLElement; settings: Settings };

const controllers = new WeakMap<HTMLElement, NotificationController>();
const active = new Set<ActiveNotification>();

const positions = new Set<NotificationPosition>([
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
]);

const viewProperties = ["top", "right", "bottom", "left"].map(
  (side) => `--ag-notification-view-${side}`
);
const stackProperty = "--ag-notification-stack-offset";

/** Stack visible notifications by document, container and position, oldest first. */
function restack() {
  const groups: Array<{ entry: ActiveNotification; offset: number }> = [];

  for (const entry of active) {
    let group = groups.find(
      ({ entry: other }) =>
        other.element.ownerDocument === entry.element.ownerDocument &&
        other.settings.container === entry.settings.container &&
        other.settings.position === entry.settings.position
    );
    if (!group) groups.push((group = { entry, offset: 0 }));

    entry.element.style.setProperty(stackProperty, `${group.offset}px`);
    group.offset +=
      entry.element.getBoundingClientRect().height +
      (parseFloat(getComputedStyle(entry.element).rowGap) || 0);
  }
}

/**
 * Enhance a notification, or return its existing controller if already set up.
 * Requires native Popover support, a message and a close button. Defaults are
 * updated by repeated enhancement/update(options); show(options) overrides one opening.
 */
export function enhanceNotification(
  element: HTMLElement,
  options: NotificationOptions = {}
): NotificationController {
  const existing = controllers.get(element);
  if (existing) {
    existing.update(options);
    return existing;
  }

  const closeButton = element.querySelector<HTMLButtonElement>(
    "button.ag-notification__close"
  );
  const message = element.querySelector<HTMLElement>(
    ".ag-notification__message"
  );

  if (!closeButton || !message)
    throw new Error(
      "A notification requires a message and a native close button."
    );
  if (typeof element.showPopover !== "function")
    throw new Error("Afterglow notifications require the native Popover API.");

  const doc = element.ownerDocument;
  const win = doc.defaultView!;

  /** Merge options while distinguishing an omitted container from explicit null. */
  const settings = (
    overrides: NotificationOptions,
    base: Settings
  ): Settings => {
    const next = {
      position: overrides.position ?? base.position,
      timeout: overrides.timeout ?? base.timeout,
      container:
        overrides.container === undefined
          ? base.container
          : overrides.container,
      announcement: overrides.announcement ?? base.announcement,
    };

    if (!positions.has(next.position))
      throw new RangeError("Unknown notification position.");
    if (
      !Number.isFinite(next.timeout) ||
      next.timeout < 0 ||
      next.timeout > 2_147_483_647
    )
      throw new RangeError(
        "Notification timeout must be a non-negative number of milliseconds."
      );
    if (!["polite", "assertive", "off"].includes(next.announcement))
      throw new RangeError("Unknown notification announcement mode.");
    if (
      next.container &&
      (next.container.ownerDocument !== doc || element.contains(next.container))
    )
      throw new Error(
        "The notification container must be another element in the same document."
      );

    return next;
  };

  let defaults = settings(options, {
    position: (element.dataset.position || "top-right") as NotificationPosition,
    timeout: 0,
    container: null,
    announcement: "polite",
  });

  // Restore caller-owned attributes and positioning styles on destruction.
  const originalPopover = element.getAttribute("popover");
  const originalPosition = element.getAttribute("data-position");
  const originalStyles = [...viewProperties, stackProperty].map((name) => ({
    name,
    value: element.style.getPropertyValue(name),
    priority: element.style.getPropertyPriority(name),
  }));

  const entry: ActiveNotification = { element, settings: defaults };
  let visible = element.matches(":popover-open");
  let destroyed = false;
  let closing = false;
  let closingReason: NotificationCloseReason = "programmatic";
  let entering = false;

  // A newer show/hide invalidates the completion of an earlier animation.
  let generation = 0;
  let animation: Animation | undefined;
  let timer: number | undefined;
  let remaining = 0;
  let started = 0;
  let announcementFrame = 0;
  let resumeFrame = 0;
  let previousFocus: HTMLElement | null = null;
  let pending: Settings | null = null;
  let modalOrder: HTMLDialogElement[] = [];

  // Focus identifies the active modal, including siblings opened out of DOM order.
  // Retain that ordering while focus is transiently on the document during close.
  const currentModal = () => {
    const modals = [...doc.querySelectorAll<HTMLDialogElement>("dialog:modal")];
    modalOrder = modalOrder.filter((modal) => modals.includes(modal));
    for (const modal of modals)
      if (!modalOrder.includes(modal)) modalOrder.push(modal);
    const focused =
      doc.activeElement?.closest<HTMLDialogElement>("dialog:modal");
    if (focused)
      modalOrder = [...modalOrder.filter((m) => m !== focused), focused];
    return modalOrder.at(-1);
  };
  const available = (next = entry.settings) => {
    const modal = currentModal();
    const inert = element.closest("[inert]");
    return (
      element.isConnected &&
      (!next.container || next.container.isConnected) &&
      // showModal() escapes inert ancestors, but not inert descendants or an
      // explicitly inert modal itself.
      (!inert || (modal && !modal.contains(inert))) &&
      !element.closest("dialog:not([open])") &&
      (!modal || modal.contains(element))
    );
  };

  // A persistent live region is established before its text changes. The close
  // button remains outside the announcement, and showing a toast never focuses it.
  const announcer = doc.createElement("div");
  announcer.className = "ag-notification-announcer";
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  doc.body.append(announcer);
  element.popover = "manual";

  const clearTimer = () => {
    if (timer !== undefined) win.clearTimeout(timer);
    timer = undefined;
  };

  /** Preserve the unelapsed portion of the timeout when interaction pauses it. */
  const pause = () => {
    if (timer !== undefined)
      remaining = Math.max(0, remaining - performance.now() + started);
    clearTimer();
  };

  /** Resume the remaining timeout only while the notification can be left unattended. */
  const resume = () => {
    if (
      !visible ||
      entering ||
      closing ||
      destroyed ||
      !entry.settings.timeout ||
      timer !== undefined
    )
      return;

    if (
      doc.hidden ||
      element.matches(":hover") ||
      element.contains(doc.activeElement)
    )
      return;

    started = performance.now();
    timer = win.setTimeout(() => {
      timer = undefined;
      void controller.hide("timeout");
    }, remaining);
  };

  /** Map a container's visible bounds to viewport offsets without moving the popover. */
  const updateView = () => {
    const container = entry.settings.container;
    if (container) {
      const bounds = container.getBoundingClientRect();
      const clamp = (value: number, max: number) =>
        Math.min(max, Math.max(0, value));
      const gaps = [
        clamp(bounds.top, win.innerHeight),
        win.innerWidth - clamp(bounds.right, win.innerWidth),
        win.innerHeight - clamp(bounds.bottom, win.innerHeight),
        clamp(bounds.left, win.innerWidth),
      ];

      viewProperties.forEach((name, index) =>
        element.style.setProperty(name, `${gaps[index]}px`)
      );
    } else viewProperties.forEach((name) => element.style.removeProperty(name));
  };

  const observer = new ResizeObserver(() => {
    updateView();
    restack();
  });

  /** Apply one opening's settings and observe its notification/container geometry. */
  const configure = (next: Settings) => {
    entry.settings = next;
    element.dataset.position = next.position;
    observer.disconnect();
    observer.observe(element);
    if (next.container) observer.observe(next.container);

    updateView();
    restack();
  };

  const stopAnimation = () => {
    animation?.cancel();
    animation = undefined;
  };

  /** Animate from the chosen edge using theme motion tokens and reduced-motion settings. */
  const animate = (exit: boolean) => {
    const push =
      getComputedStyle(element).getPropertyValue("--motion-push").trim() ||
      "16px";
    const direction = entry.settings.position.startsWith("top") ? "-1" : "1";
    const frames = [
      { opacity: 0, transform: `translateY(calc(${direction} * ${push}))` },
      { opacity: 1, transform: "none" },
    ];

    animation = element.animate(exit ? frames.reverse() : frames, {
      ...getMotionOptions(element, exit ? "exit" : "entry", "slow"),
      fill: "both",
    });

    return animation.finished.catch(() => undefined);
  };

  /** Announce message text after establishing the live region, without moving focus. */
  const announce = () => {
    win.cancelAnimationFrame(announcementFrame);
    announcer.textContent = "";

    // A body-level region is inert during showModal(), even for a toast inside it.
    const scope = currentModal() ?? doc.body;
    if (announcer.parentElement !== scope) scope.append(announcer);

    const mode = entry.settings.announcement;
    announcer.setAttribute("role", mode === "assertive" ? "alert" : "status");
    announcer.setAttribute("aria-live", mode);
    if (mode === "off") return;

    // Separate clearing from repopulating so a repeated message is announced again.
    announcementFrame = win.requestAnimationFrame(() => {
      announcementFrame = win.requestAnimationFrame(() => {
        if (visible && !destroyed && available())
          announcer.textContent = message.textContent;
      });
    });
  };

  /** Finalise a close, update the stack, and restore focus when dismissal removed it. */
  const didClose = (reason: NotificationCloseReason, restoreFocus: boolean) => {
    visible = false;
    closing = false;
    entering = false;

    clearTimer();
    stopAnimation();
    win.cancelAnimationFrame(announcementFrame);
    announcer.textContent = "";
    active.delete(entry);
    restack();

    if (restoreFocus && previousFocus?.isConnected)
      previousFocus.focus({ preventScroll: true });

    element.dispatchEvent(
      new CustomEvent("close", { bubbles: true, detail: { reason } })
    );
  };

  const click = (event: MouseEvent) => {
    if (!event.composedPath().includes(closeButton)) return;

    event.preventDefault();
    void controller.hide("close-button");
  };

  // Wait until focus has reached its next target before deciding to resume.
  const focusout = () => queueMicrotask(resume);

  // Firefox updates :hover after pointerleave, including its microtasks.
  const pointerleave = () => {
    win.cancelAnimationFrame(resumeFrame);
    resumeFrame = win.requestAnimationFrame(resume);
  };

  const visibility = () => (doc.hidden ? pause() : resume());

  /** Suspend without reporting dismissal: the message has not been dealt with. */
  const defer = (next: Settings) => {
    // A dismissal already in progress is final, even if a modal covers its exit.
    if (closing) {
      pending = null;
      ++generation;
      if (element.matches(":popover-open")) element.hidePopover();
      didClose(closingReason, false);
      return;
    }
    pending = next;
    ++generation;
    pause();
    stopAnimation();
    win.cancelAnimationFrame(announcementFrame);
    announcer.textContent = "";
    visible = false;
    closing = false;
    entering = false;
    if (element.matches(":popover-open")) element.hidePopover();
    active.delete(entry);
    restack();
  };
  const syncContext = () => {
    if (destroyed) return;
    if (visible && !available()) defer(entry.settings);
    else if (pending && available(pending)) {
      const next = pending;
      pending = null;
      void controller.show(next);
    }
  };
  const contextFocus = () => queueMicrotask(syncContext);
  const contextObserver = new MutationObserver(syncContext);

  const beforetoggle = (event: Event) => {
    if ((event as ToggleEvent).newState === "open" && !available()) {
      event.preventDefault();
      pending ??= defaults;
      return;
    }
    if ((event as ToggleEvent).newState === "open" && !visible)
      previousFocus =
        doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
  };

  /** Follow native popover invokers and direct showPopover()/hidePopover() calls. */
  const toggle = () => {
    if (destroyed) return;

    if (element.matches(":popover-open")) {
      if (visible) return;

      visible = true;
      closing = false;
      entering = true;
      const current = ++generation;
      configure(defaults);
      active.add(entry);
      restack();
      announce();

      void animate(false).then(() => {
        if (current !== generation || destroyed || !visible) return;

        stopAnimation();
        entering = false;
        remaining = defaults.timeout;
        resume();
      });
    } else if (visible) {
      ++generation;
      didClose("native", false);
    }
  };

  const controller: NotificationController = {
    refresh() {
      if (!destroyed) {
        syncContext();
        updateView();
        restack();
      }
    },
    update(next = {}) {
      if (destroyed) return;
      defaults = settings(next, defaults);
      configure(defaults);
      if (pending) pending = defaults;
      syncContext();
      if (visible) {
        clearTimer();
        remaining = defaults.timeout;
        resume();
        restack();
      }
    },
    get open() {
      return element.matches(":popover-open");
    },

    async show(overrides = {}) {
      if (destroyed) return;

      const next = settings(overrides, defaults);
      if (
        !element.isConnected ||
        (next.container && !next.container.isConnected)
      )
        throw new Error(
          "Mount the notification and its container before showing it."
        );

      const current = ++generation;
      clearTimer();
      stopAnimation();
      closing = false;

      const opening = !element.matches(":popover-open");
      entering = opening;
      if (opening)
        previousFocus =
          doc.activeElement instanceof HTMLElement ? doc.activeElement : null;

      configure(next);
      if (!available(next)) {
        defer(next);
        return;
      }
      pending = null;
      element.showPopover();
      if (!element.matches(":popover-open")) return; // A consumer cancelled beforetoggle.

      visible = true;
      active.add(entry);
      restack();
      announce();

      if (opening) await animate(false);
      if (current !== generation || destroyed || !visible) return;

      // Time only the fully visible state, including when re-showing an open toast.
      entering = false;
      stopAnimation();
      remaining = next.timeout;
      resume();
    },

    async hide(reason = "programmatic") {
      if (!destroyed && pending) {
        pending = null;
        didClose(reason, false);
        return;
      }
      if (destroyed || !element.matches(":popover-open")) return;

      const current = ++generation;
      closing = true;
      closingReason = reason;
      entering = false;
      clearTimer();
      stopAnimation();

      await animate(true);
      if (current !== generation || destroyed) return;

      // Return focus only if closing would remove the currently focused control.
      const restoreFocus = element.contains(doc.activeElement);
      element.hidePopover();
      didClose(reason, restoreFocus);
    },

    destroy() {
      if (destroyed) return;

      destroyed = true;
      pending = null;
      ++generation;
      clearTimer();
      stopAnimation();
      win.cancelAnimationFrame(announcementFrame);
      win.cancelAnimationFrame(resumeFrame);
      observer.disconnect();
      contextObserver.disconnect();
      doc.removeEventListener("focusin", contextFocus);

      element.removeEventListener("click", click);
      element.removeEventListener("pointerenter", pause);
      element.removeEventListener("pointerleave", pointerleave);
      element.removeEventListener("focusin", pause);
      element.removeEventListener("focusout", focusout);
      element.removeEventListener("toggle", toggle);
      element.removeEventListener("beforetoggle", beforetoggle);
      doc.removeEventListener("visibilitychange", visibility);
      doc.removeEventListener("scroll", updateView, true);
      win.removeEventListener("resize", updateView);

      if (element.matches(":popover-open")) element.hidePopover();
      active.delete(entry);
      restack();
      announcer.remove();

      if (originalPopover === null) element.removeAttribute("popover");
      else element.setAttribute("popover", originalPopover);
      if (originalPosition === null) element.removeAttribute("data-position");
      else element.setAttribute("data-position", originalPosition);
      originalStyles.forEach(({ name, value, priority }) => {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      });

      controllers.delete(element);
    },
  };

  configure(defaults);

  element.addEventListener("click", click);
  element.addEventListener("pointerenter", pause);
  element.addEventListener("pointerleave", pointerleave);
  element.addEventListener("focusin", pause);
  element.addEventListener("focusout", focusout);
  element.addEventListener("toggle", toggle);
  element.addEventListener("beforetoggle", beforetoggle);

  doc.addEventListener("visibilitychange", visibility);
  doc.addEventListener("focusin", contextFocus);
  contextObserver.observe(doc, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open", "inert"],
  });
  doc.addEventListener("scroll", updateView, true);
  win.addEventListener("resize", updateView);

  controllers.set(element, controller);

  // Adopt an already-open native popover as well as ones opened through show().
  if (visible) {
    active.add(entry);
    restack();
    remaining = defaults.timeout;
    announce();
    resume();
  }

  syncContext();

  return controller;
}
