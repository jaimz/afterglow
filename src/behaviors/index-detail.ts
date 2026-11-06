import { getMotionOptions, type MotionSpeed } from "./motion";

export interface IndexDetailOptions {
  /** Optional visibility toggle; the application owns its click handler. */
  trigger?: HTMLElement;
  /** Entry speed; exit uses the next faster speed. Defaults to slow. */
  speed?: MotionSpeed;
}

export interface IndexDetailController {
  update(options?: IndexDetailOptions): void;
  /** Requested visibility, including during an animation. */
  readonly inspectorOpen: boolean;
  /** Resolves when this transition finishes or is superseded. */
  setInspectorOpen(open: boolean): Promise<void>;
  /** Finish pending motion and reconcile responsive layout immediately. */
  refresh(): void;
  /** Release listeners and temporary styles, retaining requested visibility. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, IndexDetailController>();

/** Animate the Inspector's grid track so the panel slides without squeezing its content. */
export function enhanceIndexDetail(
  root: HTMLElement,
  options: IndexDetailOptions = {}
): IndexDetailController {
  const existing = controllers.get(root);
  if (existing) {
    existing.update(options);
    return existing;
  }
  options = { ...options };
  if (
    options.speed &&
    !["fast", "medium", "slow", "very-slow"].includes(options.speed)
  )
    throw new Error("Unknown motion speed.");
  const inspector = root.querySelector<HTMLElement>(
    ":scope > .ag-index-detail__inspector"
  );
  if (!inspector)
    throw new Error("Index-Detail motion requires a direct Inspector pane.");
  const panel = inspector;
  const win = root.ownerDocument.defaultView!;
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
  const originalInert = panel.inert;
  const originalAriaHidden = panel.getAttribute("aria-hidden");
  const originalExpanded =
    options.trigger?.getAttribute("aria-expanded") ?? null;
  let open = !panel.hidden;
  let animation: Animation | undefined;
  let pending = Promise.resolve();
  let restoreSize: (() => void) | undefined;
  let destroyed = false;

  const restoreAccessibility = () => {
    panel.inert = originalInert;
    if (originalAriaHidden === null) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", originalAriaHidden);
  };
  const clearAnimation = () => {
    animation?.cancel();
    animation = undefined;
    restoreSize?.();
    restoreSize = undefined;
    root.removeAttribute("data-inspector-motion");
  };
  const settle = () => {
    clearAnimation();
    panel.hidden = !open;
    restoreAccessibility();
    options.trigger?.setAttribute("aria-expanded", String(open));
  };

  const setInspectorOpen = (next: boolean): Promise<void> => {
    if (destroyed || next === open) return pending;
    const vertical =
      win
        .getComputedStyle(panel)
        .getPropertyValue("--ag-index-detail-inspector-axis")
        .trim() === "block";
    const property = vertical ? "gridTemplateRows" : "gridTemplateColumns";
    // Capture the current animated grid before cancellation for smooth reversals.
    const tracks = () => {
      const values = win.getComputedStyle(root)[property].split(" ");
      while (values.length < 3) values.push("0px");
      return values.join(" ");
    };
    const from = tracks();
    clearAnimation();
    open = next;
    options.trigger?.setAttribute("aria-expanded", String(open));
    if (!open && panel.contains(root.ownerDocument.activeElement)) {
      const destination =
        options.trigger ||
        root.querySelector<HTMLElement>(".ag-index-detail__detail");
      if (destination) {
        const tabindex = destination.getAttribute("tabindex");
        if (tabindex === null) destination.tabIndex = -1;
        destination.focus({ preventScroll: true });
        if (tabindex === null) destination.removeAttribute("tabindex");
      }
    }
    restoreAccessibility();
    panel.hidden = false;
    const fullSize =
      panel.getBoundingClientRect()[vertical ? "height" : "width"];
    panel.hidden = !open;
    const to = tracks();
    const timing = getMotionOptions(
      root,
      open ? "entry" : "exit",
      options.speed || "slow"
    );
    if (
      !root.isConnected ||
      !fullSize ||
      timing.duration === 0 ||
      !root.animate
    ) {
      settle();
      return (pending = Promise.resolve());
    }
    panel.hidden = false;
    if (!open) {
      panel.inert = true;
      panel.setAttribute("aria-hidden", "true");
    }
    const sizeProperty = vertical ? "block-size" : "inline-size";
    const value = panel.style.getPropertyValue(sizeProperty);
    const priority = panel.style.getPropertyPriority(sizeProperty);
    panel.style.setProperty(sizeProperty, `${fullSize}px`);
    restoreSize = () => {
      if (value) panel.style.setProperty(sizeProperty, value, priority);
      else panel.style.removeProperty(sizeProperty);
    };
    root.setAttribute("data-inspector-motion", open ? "entry" : "exit");
    const active = root.animate([{ [property]: from }, { [property]: to }], {
      ...timing,
      fill: "both",
    });
    animation = active;
    pending = active.finished
      .catch(() => undefined)
      .then(() => {
        if (animation === active) settle();
      });
    return pending;
  };

  // Width/orientation changes switch between inline and block motion. Settle
  // rather than carrying stale pixel tracks into a different responsive layout.
  let width = root.getBoundingClientRect().width;
  const resize = new ResizeObserver(() => {
    const currentWidth = root.getBoundingClientRect().width;
    if (currentWidth !== width) {
      width = currentWidth;
      settle();
    }
  });
  resize.observe(root);
  const attributes = new MutationObserver(() => settle());
  attributes.observe(root, {
    attributes: true,
    attributeFilter: ["dir", "data-orientation"],
  });
  const reduceMotion = () => {
    if (reduced.matches) settle();
  };
  reduced.addEventListener("change", reduceMotion);

  const controller: IndexDetailController = {
    update(next = {}) {
      if (destroyed) return;
      if ("trigger" in next && next.trigger !== options.trigger)
        throw new Error("Destroy Index-Detail before changing its trigger.");
      if (
        next.speed &&
        !["fast", "medium", "slow", "very-slow"].includes(next.speed)
      )
        throw new Error("Unknown motion speed.");
      Object.assign(options, next);
      settle();
    },
    get inspectorOpen() {
      return open;
    },
    setInspectorOpen,
    refresh() {
      if (!destroyed) settle();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resize.disconnect();
      attributes.disconnect();
      reduced.removeEventListener("change", reduceMotion);
      settle();
      if (options.trigger) {
        if (originalExpanded === null)
          options.trigger.removeAttribute("aria-expanded");
        else options.trigger.setAttribute("aria-expanded", originalExpanded);
      }
      controllers.delete(root);
    },
  };
  options.trigger?.setAttribute("aria-expanded", String(open));
  controllers.set(root, controller);
  return controller;
}
