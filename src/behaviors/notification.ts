export type NotificationPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface NotificationOptions {
  position?: NotificationPosition;
  /** Milliseconds visible before closing; zero (the default) requires dismissal. */
  timeout?: number;
  /** Position within this view's visible bounds; null uses the viewport. */
  container?: HTMLElement | null;
  announcement?: "polite" | "assertive" | "off";
}

export type NotificationCloseReason =
  | "close-button"
  | "timeout"
  | "programmatic"
  | "native";

export interface NotificationController {
  readonly open: boolean;
  show(options?: NotificationOptions): Promise<void>;
  hide(reason?: NotificationCloseReason): Promise<void>;
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

/** Enhance a native manual popover without moving its markup or stealing focus. */
export function enhanceNotification(
  element: HTMLElement,
  options: NotificationOptions = {}
): NotificationController {
  const existing = controllers.get(element);
  if (existing) return existing;
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
  const defaults = settings(options, {
    position: (element.dataset.position || "top-right") as NotificationPosition,
    timeout: 0,
    container: null,
    announcement: "polite",
  });
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
  let entering = false;
  let generation = 0;
  let animation: Animation | undefined;
  let timer: number | undefined;
  let remaining = 0;
  let started = 0;
  let announcementFrame = 0;
  let resumeFrame = 0;
  let previousFocus: HTMLElement | null = null;

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
  const pause = () => {
    if (timer !== undefined)
      remaining = Math.max(0, remaining - performance.now() + started);
    clearTimer();
  };
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
  const animate = (exit: boolean) => {
    const css = getComputedStyle(element);
    const speed =
      css.getPropertyValue("--motionSlowDuration").trim() || "250ms";
    const duration = parseFloat(speed) * (speed.endsWith("ms") ? 1 : 1000);
    const push = css.getPropertyValue("--motionPush").trim() || "16px";
    const direction = entry.settings.position.startsWith("top") ? "-1" : "1";
    const frames = [
      { opacity: 0, transform: `translateY(calc(${direction} * ${push}))` },
      { opacity: 1, transform: "none" },
    ];
    animation = element.animate(exit ? frames.reverse() : frames, {
      duration: win.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : Number.isFinite(duration)
        ? duration
        : 250,
      easing:
        css
          .getPropertyValue(exit ? "--motionExitCurve" : "--motionEntryCurve")
          .trim() || "ease",
      fill: "both",
    });
    return animation.finished.catch(() => undefined);
  };
  const announce = () => {
    win.cancelAnimationFrame(announcementFrame);
    announcer.textContent = "";
    const mode = entry.settings.announcement;
    announcer.setAttribute("role", mode === "assertive" ? "alert" : "status");
    announcer.setAttribute("aria-live", mode);
    if (mode === "off") return;
    announcementFrame = win.requestAnimationFrame(() => {
      announcementFrame = win.requestAnimationFrame(() => {
        if (visible && !destroyed) announcer.textContent = message.textContent;
      });
    });
  };
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
  const focusout = () => queueMicrotask(resume);
  // Firefox updates :hover after pointerleave, including its microtasks.
  const pointerleave = () => {
    win.cancelAnimationFrame(resumeFrame);
    resumeFrame = win.requestAnimationFrame(resume);
  };
  const visibility = () => (doc.hidden ? pause() : resume());
  const beforetoggle = (event: Event) => {
    if ((event as ToggleEvent).newState === "open" && !visible)
      previousFocus =
        doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
  };
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
      element.showPopover();
      if (!element.matches(":popover-open")) return; // A consumer cancelled beforetoggle.
      visible = true;
      active.add(entry);
      restack();
      announce();
      if (opening) await animate(false);
      if (current !== generation || destroyed || !visible) return;
      entering = false;
      stopAnimation();
      remaining = next.timeout;
      resume();
    },
    async hide(reason = "programmatic") {
      if (destroyed || !element.matches(":popover-open")) return;
      const current = ++generation;
      closing = true;
      entering = false;
      clearTimer();
      stopAnimation();
      await animate(true);
      if (current !== generation || destroyed) return;
      const restoreFocus = element.contains(doc.activeElement);
      element.hidePopover();
      didClose(reason, restoreFocus);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      ++generation;
      clearTimer();
      stopAnimation();
      win.cancelAnimationFrame(announcementFrame);
      win.cancelAnimationFrame(resumeFrame);
      observer.disconnect();
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
  doc.addEventListener("scroll", updateView, true);
  win.addEventListener("resize", updateView);
  controllers.set(element, controller);
  if (visible) {
    active.add(entry);
    restack();
    remaining = defaults.timeout;
    announce();
    resume();
  }
  return controller;
}
