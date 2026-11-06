import { resolveCSSLength } from "./css-length";

export type PopoverPlacement = "top" | "bottom" | "inline-start" | "inline-end";

export interface PopoverOptions {
  trigger: HTMLButtonElement;
  /** Preferred side; flips when space is limited. Defaults to bottom. */
  placement?: PopoverPlacement;
  /** Alignment along the trigger; defaults to center. Start/end respect RTL. */
  align?: "start" | "center" | "end";
}

export interface PopoverController {
  update(options?: Partial<PopoverOptions>): void;
  readonly isOpen: boolean;
  /** Focus an authored autofocus target, or the panel itself. */
  show(options?: { focus?: boolean }): void;
  hide(options?: { restoreFocus?: boolean }): void;
  refresh(): void;
  destroy(): void;
}

type Side = "top" | "bottom" | "left" | "right";
const controllers = new WeakMap<HTMLElement, PopoverController>();
let nextId = 0;

/** An anchored, nonmodal dialog. Native popovers own Escape and light dismissal. */
export function enhancePopover(
  panel: HTMLElement,
  options: PopoverOptions
): PopoverController {
  const existing = controllers.get(panel);
  if (existing) {
    existing.update(options);
    return existing;
  }
  const { trigger } = options;
  let { placement = "bottom", align = "center" } = options;
  if (typeof panel.showPopover !== "function")
    throw new Error("Popover requires the browser Popover API.");
  if (trigger.ownerDocument !== panel.ownerDocument || panel.contains(trigger))
    throw new Error(
      "The popover trigger must be outside its panel in the same document."
    );
  if (
    !["top", "bottom", "inline-start", "inline-end"].includes(placement) ||
    !["start", "center", "end"].includes(align)
  )
    throw new Error("Unknown popover placement or alignment.");

  const doc = panel.ownerDocument;
  const win = doc.defaultView!;
  const attributes = new Map<HTMLElement, Map<string, string | null>>();
  const styles = new Map<string, [string, string]>();
  let destroyed = false;
  let wasOpen = false;
  let focusOnOpen = true;
  let frame = 0;
  const isOpen = () => panel.matches(":popover-open");
  const write = (el: HTMLElement, name: string, value: string) => {
    let saved = attributes.get(el);
    if (!saved) attributes.set(el, (saved = new Map()));
    if (!saved.has(name)) saved.set(name, el.getAttribute(name));
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  };
  const style = (name: string, value: string) => {
    if (!styles.has(name))
      styles.set(name, [
        panel.style.getPropertyValue(name),
        panel.style.getPropertyPriority(name),
      ]);
    if (panel.style.getPropertyValue(name) !== value)
      panel.style.setProperty(name, value);
  };
  const id = () => {
    let value: string;
    do {
      value = `ag-popover-${++nextId}`;
    } while (doc.getElementById(value));
    return value;
  };
  if (!panel.id) write(panel, "id", id());
  write(panel, "popover", "auto");
  write(panel, "role", "dialog");
  write(panel, "tabindex", "-1");
  const title = panel.querySelector<HTMLElement>(".ag-popover__title");
  if (
    title &&
    !panel.hasAttribute("aria-labelledby") &&
    !panel.hasAttribute("aria-label")
  ) {
    if (!title.id) write(title, "id", id());
    write(panel, "aria-labelledby", title.id);
  }
  write(trigger, "type", "button");
  write(trigger, "popovertarget", panel.id);
  write(trigger, "popovertargetaction", "toggle");
  write(trigger, "aria-haspopup", "dialog");
  write(trigger, "aria-controls", panel.id);
  write(trigger, "aria-expanded", "false");

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, max));
  const position = () => {
    if (destroyed || !isOpen()) return;
    const viewport = win.visualViewport;
    const left = (viewport?.offsetLeft ?? 0) + 12;
    const top = (viewport?.offsetTop ?? 0) + 12;
    const right = left + (viewport?.width ?? win.innerWidth) - 24;
    const bottom = top + (viewport?.height ?? win.innerHeight) - 24;
    const anchor = trigger.getBoundingClientRect();
    if (
      !trigger.isConnected ||
      !trigger.getClientRects().length ||
      anchor.bottom < top ||
      anchor.top > bottom ||
      anchor.right < left ||
      anchor.left > right
    ) {
      controller.hide({ restoreFocus: false });
      return;
    }
    const rtl = win.getComputedStyle(trigger).direction === "rtl";
    const gap = Math.max(8, resolveCSSLength(panel, "--popover-gap", 12));
    // Measure without the previous side's constraints. offset sizes exclude entry transforms.
    style("--ag-popover-max-width", `${Math.max(0, right - left)}px`);
    style("--ag-popover-max-height", `${Math.max(0, bottom - top)}px`);
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const preferred: Side =
      placement === "inline-start"
        ? rtl
          ? "right"
          : "left"
        : placement === "inline-end"
        ? rtl
          ? "left"
          : "right"
        : placement;
    const opposite: Record<Side, Side> = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left",
    };
    const space: Record<Side, number> = {
      top: anchor.top - top - gap,
      bottom: bottom - anchor.bottom - gap,
      left: anchor.left - left - gap,
      right: right - anchor.right - gap,
    };
    const vertical = (side: Side) => side === "top" || side === "bottom";
    const candidates: Side[] = [
      preferred,
      opposite[preferred],
      ...((vertical(preferred)
        ? ["right", "left"]
        : ["bottom", "top"]) as Side[]),
    ];
    const side =
      candidates.find(
        (side) => space[side] >= (vertical(side) ? height : width)
      ) ??
      candidates.reduce((best, side) =>
        space[side] / (vertical(side) ? height : width) >
        space[best] / (vertical(best) ? height : width)
          ? side
          : best
      );
    if (vertical(side))
      style("--ag-popover-max-height", `${Math.max(0, space[side])}px`);
    else style("--ag-popover-max-width", `${Math.max(0, space[side])}px`);
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const centerX = anchor.left + anchor.width / 2;
    const centerY = anchor.top + anchor.height / 2;
    let x = centerX - w / 2;
    let y = centerY - h / 2;
    if (vertical(side)) {
      if (align !== "center")
        x = (align === "start") !== rtl ? anchor.left : anchor.right - w;
      y = side === "bottom" ? anchor.bottom + gap : anchor.top - gap - h;
    } else {
      if (align !== "center")
        y = align === "start" ? anchor.top : anchor.bottom - h;
      x = side === "right" ? anchor.right + gap : anchor.left - gap - w;
    }
    x = clamp(x, left, right - w);
    y = clamp(y, top, bottom - h);
    write(panel, "data-side", side);
    style("--ag-popover-x", `${x}px`);
    style("--ag-popover-y", `${y}px`);
    style("--ag-popover-arrow-x", `${clamp(centerX - x, 20, w - 20)}px`);
    style("--ag-popover-arrow-y", `${clamp(centerY - y, 20, h - 20)}px`);
  };
  const schedule = () => {
    if (frame || destroyed || !isOpen()) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      position();
    });
  };
  const observer = new ResizeObserver(schedule);
  const watch = (on: boolean) => {
    if (on) {
      observer.observe(panel);
      observer.observe(trigger);
    } else {
      observer.disconnect();
      win.cancelAnimationFrame(frame);
      frame = 0;
    }
    const method = on ? "addEventListener" : "removeEventListener";
    win[method]("resize", schedule);
    doc[method]("scroll", schedule, true);
    win.visualViewport?.[method]("resize", schedule);
    win.visualViewport?.[method]("scroll", schedule);
  };
  const sync = () => {
    if (destroyed) return;
    const open = isOpen();
    write(trigger, "aria-expanded", String(open));
    if (open === wasOpen) return;
    wasOpen = open;
    watch(open);
    if (open) {
      position();
      if (isOpen() && focusOnOpen) {
        const target = panel.querySelector<HTMLElement>(
          "[autofocus]:not(:disabled):not([hidden])"
        );
        (target ?? panel).focus({ preventScroll: true });
        if (!panel.contains(doc.activeElement))
          panel.focus({ preventScroll: true });
      }
    }
    focusOnOpen = true;
  };
  // beforetoggle also catches native invokers/light dismissal before the queued toggle event.
  const beforeToggle = () => queueMicrotask(sync);
  const clickTrigger = (event: MouseEvent) => {
    event.preventDefault();
    if (trigger.disabled || trigger.getAttribute("aria-disabled") === "true")
      return;
    if (isOpen()) controller.hide();
    else controller.show();
  };
  const clickPanel = (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLElement>(
      "[data-popover-close]"
    );
    if (button && button.closest(".ag-popover") === panel) {
      event.preventDefault();
      controller.hide();
    }
  };
  const focusOutside = () =>
    queueMicrotask(() => {
      if (
        !destroyed &&
        isOpen() &&
        !panel.contains(doc.activeElement) &&
        doc.activeElement !== trigger
      )
        controller.hide({ restoreFocus: false });
    });
  const controller: PopoverController = {
    update(next = {}) {
      if (destroyed) return;
      if (next.trigger && next.trigger !== trigger)
        throw new Error("Destroy the popover before changing its trigger.");
      const side = next.placement ?? placement,
        alignment = next.align ?? align;
      if (
        !["top", "bottom", "inline-start", "inline-end"].includes(side) ||
        !["start", "center", "end"].includes(alignment)
      )
        throw new Error("Unknown popover placement or alignment.");
      placement = side;
      align = alignment;
      position();
    },
    get isOpen() {
      return !destroyed && isOpen();
    },
    show({ focus = true } = {}) {
      if (
        destroyed ||
        isOpen() ||
        !panel.isConnected ||
        !trigger.isConnected ||
        trigger.disabled ||
        trigger.getAttribute("aria-disabled") === "true"
      )
        return;
      focusOnOpen = focus;
      // Native showPopover also processes autofocus, even when helper focus is suppressed.
      const autofocus = focus
        ? []
        : [panel, ...panel.querySelectorAll<HTMLElement>("[autofocus]")]
            .filter((el) => el.hasAttribute("autofocus"))
            .map((el) => [el, el.getAttribute("autofocus")!] as const);
      autofocus.forEach(([el]) => el.removeAttribute("autofocus"));
      try {
        (panel.showPopover as (options?: { source: HTMLElement }) => void)({
          source: trigger,
        });
      } finally {
        autofocus.forEach(([el, value]) => el.setAttribute("autofocus", value));
      }
      sync();
    },
    hide({ restoreFocus = true } = {}) {
      if (destroyed || !isOpen()) return;
      const ownedFocus = panel.contains(doc.activeElement);
      panel.hidePopover();
      sync();
      if (restoreFocus && ownedFocus && trigger.isConnected)
        trigger.focus({ preventScroll: true });
    },
    refresh() {
      position();
    },
    destroy() {
      if (destroyed) return;
      controller.hide();
      destroyed = true;
      watch(false);
      panel.getAnimations().forEach((animation) => animation.cancel());
      trigger.removeEventListener("click", clickTrigger);
      panel.removeEventListener("click", clickPanel);
      panel.removeEventListener("beforetoggle", beforeToggle);
      panel.removeEventListener("toggle", sync);
      doc.removeEventListener("focusin", focusOutside);
      for (const [el, saved] of attributes)
        for (const [name, value] of saved) {
          if (value === null) el.removeAttribute(name);
          else el.setAttribute(name, value);
        }
      for (const [name, [value, priority]] of styles) {
        if (value) panel.style.setProperty(name, value, priority);
        else panel.style.removeProperty(name);
      }
      controllers.delete(panel);
    },
  };
  trigger.addEventListener("click", clickTrigger);
  panel.addEventListener("click", clickPanel);
  panel.addEventListener("beforetoggle", beforeToggle);
  panel.addEventListener("toggle", sync);
  doc.addEventListener("focusin", focusOutside);
  controllers.set(panel, controller);
  sync();
  return controller;
}
