/**
 * Enhance an .ag-popup-menu containing native .ag-menu-item buttons or links.
 * Connect one button with popovertarget, then pass it as options.trigger.
 * Native popovers own visibility, light dismissal and Escape. This helper adds
 * menu keyboard navigation, selection events, focus and positioning fallback.
 *
 * Place submenu popovers inside their parent menu, beside their trigger item,
 * and enhance each separately with placement: "inline-end", openOnHover: true.
 * Panel children stay mounted. Call refresh() after replacing menu items and
 * destroy() when disposing the view. Ordinary actions use native click handlers
 * or the bubbling, cancelable ag-menu-select event (detail.item).
 */
export interface PopupMenuOptions {
  trigger: HTMLButtonElement;
  /** Alignment relative to the trigger; defaults to bottom-start. */
  placement?: "bottom-start" | "bottom-end" | "inline-end";
  /** Close the menu chain after an action; defaults to true. */
  closeOnSelect?: boolean;
  /** Opt-in pointer hover opening, primarily for submenu triggers. */
  openOnHover?: boolean;
}

export interface PopupMenuController {
  readonly isOpen: boolean;
  /** Open and focus the first/last item, or preserve focus with "none". */
  show(focus?: "first" | "last" | "none"): void;
  /** Close; returns focus to the trigger by default. */
  hide(options?: { restoreFocus?: boolean }): void;
  /** Reconcile item roles and reposition after application DOM changes. */
  refresh(): void;
  /** Close, release listeners/observers and restore managed attributes/styles. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, PopupMenuController>();
let nextId = 0;

/** Enhance one popover and invoker; repeated calls retain the original options. */
export function enhancePopupMenu(
  menu: HTMLElement,
  options: PopupMenuOptions
): PopupMenuController {
  const existing = controllers.get(menu);
  if (existing) return existing;
  if (typeof menu.showPopover !== "function")
    throw new Error("Popup Menu requires the browser Popover API.");
  const { trigger, placement = "bottom-start", closeOnSelect = true } = options;
  if (trigger.ownerDocument !== menu.ownerDocument || menu.contains(trigger))
    throw new Error(
      "The menu trigger must be outside its own menu in the same document."
    );
  if (!["bottom-start", "bottom-end", "inline-end"].includes(placement))
    throw new Error("Unknown popup menu placement.");

  const doc = menu.ownerDocument;
  const win = doc.defaultView!;
  const attributes = new Map<HTMLElement, Map<string, string | null>>();
  const styles = new Map<HTMLElement, Map<string, [string, string]>>();
  let destroyed = false;
  let wasOpen = false;
  let pendingFocus: "first" | "last" | "none" = "first";
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let search = "";
  let searchedAt = 0;
  let frame = 0;

  const write = (el: HTMLElement, name: string, value: string) => {
    let snapshot = attributes.get(el);
    if (!snapshot) attributes.set(el, (snapshot = new Map()));
    if (!snapshot.has(name)) snapshot.set(name, el.getAttribute(name));
    el.setAttribute(name, value);
  };
  const style = (el: HTMLElement, name: string, value: string) => {
    let snapshot = styles.get(el);
    if (!snapshot) styles.set(el, (snapshot = new Map()));
    if (!snapshot.has(name))
      snapshot.set(name, [
        el.style.getPropertyValue(name),
        el.style.getPropertyPriority(name),
      ]);
    el.style.setProperty(name, value);
  };
  const restore = (el: HTMLElement) => {
    for (const [name, value] of attributes.get(el) ?? []) {
      if (value === null) el.removeAttribute(name);
      else el.setAttribute(name, value);
    }
    attributes.delete(el);
  };
  const id = () => {
    let value: string;
    do {
      value = `ag-popup-${++nextId}`;
    } while (doc.getElementById(value));
    return value;
  };
  if (!menu.id) write(menu, "id", id());
  if (!trigger.id) write(trigger, "id", id());
  write(menu, "popover", "auto");
  write(menu, "role", "menu");
  write(menu, "tabindex", "-1");
  write(menu, "data-placement", placement);
  if (!menu.hasAttribute("aria-label") && !menu.hasAttribute("aria-labelledby"))
    write(menu, "aria-labelledby", trigger.id);
  write(trigger, "type", "button");
  write(trigger, "popovertarget", menu.id);
  write(trigger, "popovertargetaction", "toggle");
  write(trigger, "aria-haspopup", "menu");
  write(trigger, "aria-controls", menu.id);
  write(trigger, "aria-expanded", "false");

  const anchor = `--ag-popup-anchor-${++nextId}`;
  const previousAnchor =
    getComputedStyle(trigger).getPropertyValue("anchor-name");
  style(
    trigger,
    "anchor-name",
    previousAnchor && previousAnchor !== "none"
      ? `${previousAnchor}, ${anchor}`
      : anchor
  );
  style(menu, "position-anchor", anchor);
  const nativePosition =
    CSS.supports("position-area", "block-end span-inline-end") &&
    CSS.supports("position-try-fallbacks", "flip-block");
  if (!nativePosition) write(menu, "data-position-fallback", "");

  const isOpen = () => menu.matches(":popover-open");
  const items = () =>
    Array.from(
      menu.querySelectorAll<HTMLElement>(
        "button.ag-menu-item, a.ag-menu-item[href]"
      )
    ).filter((item) => item.closest(".ag-popup-menu") === menu);
  const enabled = (item: HTMLElement) =>
    !item.matches(':disabled, [aria-disabled="true"]');
  const navigable = () =>
    items().filter(
      (item) =>
        !item.matches(":disabled") &&
        !!item.getClientRects().length &&
        getComputedStyle(item).visibility !== "hidden"
    );
  const parent = () => trigger.closest<HTMLElement>(".ag-popup-menu");
  const child = (item: HTMLElement) =>
    item instanceof HTMLButtonElement &&
    item.popoverTargetElement instanceof HTMLElement
      ? controllers.get(item.popoverTargetElement)
      : undefined;

  /** The fallback measures only when CSS anchors are unavailable; it flips and clamps. */
  const position = () => {
    if (nativePosition || !isOpen() || destroyed) return;
    const rect = trigger.getBoundingClientRect();
    const gap =
      parseFloat(getComputedStyle(menu).getPropertyValue("--popup-menu-gap")) ||
      8;
    const viewport = win.visualViewport;
    const left = (viewport?.offsetLeft ?? 0) + 8;
    const top = (viewport?.offsetTop ?? 0) + 8;
    const right = left + (viewport?.width ?? win.innerWidth) - 16;
    const bottom = top + (viewport?.height ?? win.innerHeight) - 16;
    const rtl = getComputedStyle(trigger).direction === "rtl";
    const width = menu.getBoundingClientRect().width;
    const naturalHeight = menu.scrollHeight + 2;
    let x =
      (placement === "bottom-end") !== rtl ? rect.right - width : rect.left;
    let y: number;
    let maxHeight: number;
    if (placement === "inline-end") {
      x = rtl ? rect.left - width - gap : rect.right + gap;
      if (x < left || x + width > right)
        x = rtl ? rect.right + gap : rect.left - width - gap;
      maxHeight = bottom - top;
      y = Math.min(rect.top, bottom - Math.min(naturalHeight, maxHeight));
    } else {
      const below = bottom - rect.bottom - gap;
      const above = rect.top - top - gap;
      const up = naturalHeight > below && above > below;
      maxHeight = Math.max(0, up ? above : below);
      y = up
        ? rect.top - gap - Math.min(naturalHeight, maxHeight)
        : rect.bottom + gap;
    }
    style(
      menu,
      "--ag-popup-left",
      `${Math.max(left, Math.min(x, right - width))}px`
    );
    style(menu, "--ag-popup-top", `${Math.max(top, y)}px`);
    style(menu, "--ag-popup-max-height", `${Math.max(0, maxHeight)}px`);
  };
  const schedulePosition = () => {
    if (!nativePosition && !frame && isOpen())
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        position();
      });
  };
  const resize = new ResizeObserver(schedulePosition);

  /** Assign roles only to this menu's items; nested menus manage their own children. */
  const refresh = () => {
    if (destroyed) return;
    const current = items();
    for (const el of attributes.keys())
      if (el !== menu && el !== trigger && !current.includes(el)) restore(el);
    for (const item of current) {
      if (!/^menuitem(checkbox|radio)?$/.test(item.getAttribute("role") ?? ""))
        write(item, "role", "menuitem");
      write(item, "tabindex", "-1");
      if (item instanceof HTMLButtonElement) write(item, "type", "button");
    }
    position();
  };
  const focusItem = (which: "first" | "last" | "none") => {
    if (which === "none") return;
    const list = navigable();
    (which === "last"
      ? list[list.length - 1] ?? menu
      : list[0] ?? menu
    ).focus();
  };

  /** Observe native toggles as well as show()/hide(); no synthetic outside-click handler. */
  const sync = () => {
    if (destroyed) return;
    const open = isOpen();
    write(trigger, "aria-expanded", String(open));
    if (open && !wasOpen) {
      wasOpen = true;
      refresh();
      if (!nativePosition) {
        resize.observe(trigger);
        resize.observe(menu);
        win.addEventListener("resize", schedulePosition);
        doc.addEventListener("scroll", schedulePosition, true);
        win.visualViewport?.addEventListener("resize", schedulePosition);
        win.visualViewport?.addEventListener("scroll", schedulePosition);
      }
      focusItem(pendingFocus);
      pendingFocus = "first";
    } else if (!open) {
      wasOpen = false;
      search = "";
      clearTimeout(hoverTimer);
      resize.disconnect();
      win.removeEventListener("resize", schedulePosition);
      doc.removeEventListener("scroll", schedulePosition, true);
      win.visualViewport?.removeEventListener("resize", schedulePosition);
      win.visualViewport?.removeEventListener("scroll", schedulePosition);
    }
  };

  const show = (focus: "first" | "last" | "none" = "first") => {
    if (
      destroyed ||
      trigger.disabled ||
      trigger.getAttribute("aria-disabled") === "true" ||
      !menu.isConnected
    )
      return;
    clearTimeout(hoverTimer);
    if (isOpen()) {
      focusItem(focus);
      return;
    }
    pendingFocus = focus;
    // Older browsers ignore source; explicit CSS anchors still position correctly.
    (menu.showPopover as (options: { source: HTMLElement }) => void)({
      source: trigger,
    });
    sync();
  };
  const hide = ({ restoreFocus = true } = {}) => {
    clearTimeout(hoverTimer);
    if (destroyed || !isOpen()) return;
    menu.hidePopover();
    sync();
    if (restoreFocus && trigger.isConnected) trigger.focus();
  };
  const rootMenu = () => {
    let root = menu;
    let ancestor = parent();
    while (ancestor) {
      root = ancestor;
      const invoker = doc.querySelector<HTMLButtonElement>(
        `button[popovertarget="${CSS.escape(root.id)}"]`
      );
      ancestor = invoker?.closest<HTMLElement>(".ag-popup-menu") ?? null;
    }
    return root;
  };
  const eventItem = (event: Event) =>
    event.target instanceof Element
      ? items().find((item) => item.contains(event.target as Node))
      : undefined;

  // ARIA-disabled items remain discoverable by keyboard but never fire actions.
  const blockDisabled = (event: MouseEvent) => {
    const item = event.currentTarget === trigger ? trigger : eventItem(event);
    if (item && !enabled(item)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const onClick = (event: MouseEvent) => {
    const item = eventItem(event);
    if (!item) return;
    if (!enabled(item)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (item instanceof HTMLButtonElement && item.hasAttribute("popovertarget"))
      return;
    const accepted = menu.dispatchEvent(
      new CustomEvent("ag-menu-select", {
        bubbles: true,
        cancelable: true,
        detail: { item },
      })
    );
    if (accepted && closeOnSelect) {
      const root = rootMenu();
      // An action may have moved focus into a dialog; do not steal it back.
      const restoreFocus =
        root.contains(doc.activeElement) || doc.activeElement === doc.body;
      (controllers.get(root) ?? controller).hide({ restoreFocus });
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      !isOpen() ||
      (event.target as Element).closest(".ag-popup-menu") !== menu ||
      event.defaultPrevented
    )
      return;
    const item = eventItem(event);
    const list = navigable();
    const index = item ? list.indexOf(item) : -1;
    const rtl = getComputedStyle(menu).direction === "rtl";
    if (event.key === "Tab") {
      // Let native sequential navigation continue from the root invoker.
      controllers.get(rootMenu())?.hide();
      return;
    }
    if (event.key === (rtl ? "ArrowRight" : "ArrowLeft") && parent()) {
      event.preventDefault();
      event.stopPropagation();
      hide();
      return;
    }
    if (
      event.key === (rtl ? "ArrowLeft" : "ArrowRight") &&
      item &&
      enabled(item) &&
      child(item)
    ) {
      event.preventDefault();
      event.stopPropagation();
      child(item)!.show();
      return;
    }
    let target: HTMLElement | undefined;
    if (event.key === "ArrowDown") target = list[(index + 1) % list.length];
    else if (event.key === "ArrowUp")
      target =
        list[
          index < 0 ? list.length - 1 : (index - 1 + list.length) % list.length
        ];
    else if (event.key === "Home") target = list[0];
    else if (event.key === "End") target = list[list.length - 1];
    else if (event.key === " " && item instanceof HTMLAnchorElement) {
      event.preventDefault();
      item.click();
      return;
    } else if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now();
      search = now - searchedAt > 700 ? event.key : search + event.key;
      searchedAt = now;
      const term = /^(.)\1+$/.test(search) ? search[0] : search;
      target = [...list.slice(index + 1), ...list.slice(0, index + 1)].find(
        (candidate) =>
          (
            candidate.getAttribute("aria-label") ||
            candidate.querySelector(".ag-menu-item__label")?.textContent ||
            candidate.textContent ||
            ""
          )
            .trim()
            .toLocaleLowerCase()
            .startsWith(term.toLocaleLowerCase())
      );
    }
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      target.focus();
    }
  };
  const triggerKey = (event: KeyboardEvent) => {
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !parent()) {
      event.preventDefault();
      show(event.key === "ArrowUp" ? "last" : "first");
    }
  };
  const enter = (event: PointerEvent) => {
    clearTimeout(hoverTimer);
    if (
      options.openOnHover &&
      event.pointerType === "mouse" &&
      event.currentTarget === trigger
    )
      show("none");
  };
  const leave = (event: PointerEvent) => {
    if (!options.openOnHover || event.pointerType !== "mouse") return;
    hoverTimer = setTimeout(() => {
      // Keep keyboard focus in a submenu intact when the pointer moves away.
      if (!menu.contains(doc.activeElement)) hide({ restoreFocus: false });
    }, 250);
  };

  const controller: PopupMenuController = {
    get isOpen() {
      return isOpen();
    },
    show,
    hide,
    refresh,
    destroy() {
      if (destroyed) return;
      hide({ restoreFocus: menu.contains(doc.activeElement) });
      destroyed = true;
      clearTimeout(hoverTimer);
      win.cancelAnimationFrame(frame);
      resize.disconnect();
      menu.removeEventListener("toggle", sync);
      menu.removeEventListener("click", onClick);
      menu.removeEventListener("keydown", onKeyDown);
      trigger.removeEventListener("keydown", triggerKey);
      trigger.removeEventListener("click", blockDisabled, true);
      menu.removeEventListener("click", blockDisabled, true);
      for (const el of [menu, trigger]) {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      }
      for (const el of attributes.keys()) restore(el);
      for (const [el, values] of styles)
        for (const [name, [value, priority]] of values) {
          if (value) el.style.setProperty(name, value, priority);
          else el.style.removeProperty(name);
        }
      controllers.delete(menu);
    },
  };
  refresh();
  menu.addEventListener("toggle", sync);
  menu.addEventListener("click", onClick);
  menu.addEventListener("keydown", onKeyDown);
  trigger.addEventListener("keydown", triggerKey);
  trigger.addEventListener("click", blockDisabled, true);
  menu.addEventListener("click", blockDisabled, true);
  for (const el of [menu, trigger]) {
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
  }
  controllers.set(menu, controller);
  sync();
  return controller;
}
