/**
 * Connect native .ag-tab buttons to direct .ag-tabbed-view__panel children.
 * Each button's aria-controls names its panel ID. Put the buttons in one direct
 * .ag-tab-strip with an accessible label, then call enhanceTabbedView(root).
 * Panels remain mounted: switching changes hidden and ARIA state, not their DOM.
 *
 * Arrow keys/Home/End move between enabled tabs (respecting RTL). Automatic
 * activation is the default; manual activation waits for Enter/Space or click.
 * Call refresh() after adding/removing tabs or changing availability. destroy()
 * removes listeners and restores authored attributes without resetting content.
 *
 * const view = enhanceTabbedView(document.querySelector("#details")!);
 * view.select("settings-panel");
 * view.destroy();
 */

export interface TabbedViewOptions {
  /** Panel ID to select initially; otherwise use aria-selected or the first tab. */
  selectedPanelId?: string;
  /** Automatic switches on arrow-key focus; manual waits for activation. */
  activation?: "automatic" | "manual";
}

export interface TabbedViewController {
  /** Current panel ID, or null when there are no available tabs. */
  readonly selectedPanelId: string | null;
  /** Select an enabled panel; optionally focus its tab. Returns false if unavailable. */
  select(panelId: string, options?: { focus?: boolean }): boolean;
  /** Reconcile DOM changes and disabled/hidden tabs; retain the selection if possible. */
  refresh(): void;
  /** Restore authored attributes and remove listeners, preserving all panel content. */
  destroy(): void;
}

interface Entry {
  tab: HTMLButtonElement;
  panel: HTMLElement;
}
const controllers = new WeakMap<HTMLElement, TabbedViewController>();
let nextTabId = 0;

/** Enhance one view. Repeated calls return its existing controller and options. */
export function enhanceTabbedView(
  root: HTMLElement,
  options: TabbedViewOptions = {}
): TabbedViewController {
  const existing = controllers.get(root);
  if (existing) return existing;

  const strip = root.querySelector<HTMLElement>(":scope > .ag-tab-strip");
  if (!strip)
    throw new Error("Tabbed View requires a direct .ag-tab-strip child.");
  const activation = options.activation ?? "automatic";
  if (activation !== "automatic" && activation !== "manual")
    throw new Error("Unknown tab activation mode.");

  const snapshots = new Map<HTMLElement, Map<string, string | null>>();
  let entries: Entry[] = [];
  let selected: Entry | undefined;
  let destroyed = false;

  /** Capture an attribute once so disposal restores the consumer's markup. */
  const write = (element: HTMLElement, name: string, value: string | null) => {
    let attrs = snapshots.get(element);
    if (!attrs) snapshots.set(element, (attrs = new Map()));
    if (!attrs.has(name)) attrs.set(name, element.getAttribute(name));
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  };

  const restore = (element: HTMLElement) => {
    for (const [name, value] of snapshots.get(element) ?? []) {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
    snapshots.delete(element);
  };

  const available = ({ tab }: Entry) =>
    !tab.disabled &&
    !tab.hidden &&
    tab.getAttribute("aria-disabled") !== "true";

  /** Update selection atomically before announcing a change to the application. */
  const activate = (
    entry: Entry | undefined,
    notify: boolean,
    focus = false
  ) => {
    const previous = selected;
    const focusWasInPanel = previous?.panel.contains(
      root.ownerDocument.activeElement
    );
    selected = entry;
    for (const item of entries) {
      const active = item === selected;
      write(item.tab, "aria-selected", String(active));
      write(item.tab, "tabindex", active ? "0" : "-1");
      write(item.panel, "hidden", active ? null : "");
    }
    if (
      entry &&
      (focus ||
        (previous !== entry &&
          (focusWasInPanel ||
            previous?.tab === root.ownerDocument.activeElement)))
    )
      entry.tab.focus();
    if (notify && previous !== entry) {
      root.dispatchEvent(
        new CustomEvent("ag-tab-change", {
          bubbles: true,
          detail: {
            panelId: entry?.panel.id ?? null,
            previousPanelId: previous?.panel.id ?? null,
          },
        })
      );
    }
  };

  /** Validate all relationships before changing attributes; nested views are excluded. */
  const reconcile = (initial = false) => {
    if (destroyed) return;
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>(":scope > .ag-tabbed-view__panel")
    );
    const tabs = Array.from(
      strip.querySelectorAll<HTMLButtonElement>(":scope > button.ag-tab")
    );
    const used = new Set<HTMLElement>();
    const next = tabs.map((tab) => {
      const id = tab.getAttribute("aria-controls");
      const matches = panels.filter((panel) => !!id && panel.id === id);
      if (matches.length !== 1 || used.has(matches[0]))
        throw new Error(
          "Each tab must control one unique direct panel via aria-controls."
        );
      used.add(matches[0]);
      return { tab, panel: matches[0] };
    });
    if (used.size !== panels.length)
      throw new Error("Every direct tab panel needs one tab button.");

    const requested =
      initial && options.selectedPanelId !== undefined
        ? next.find(
            (entry) =>
              entry.panel.id === options.selectedPanelId && available(entry)
          )
        : undefined;
    if (initial && options.selectedPanelId !== undefined && !requested)
      throw new Error("The initial tab panel is missing or unavailable.");
    const active =
      requested ??
      next.find(
        (entry) =>
          entry.tab === selected?.tab &&
          entry.panel === selected?.panel &&
          available(entry)
      ) ??
      (initial
        ? next.find(
            (entry) =>
              entry.tab.getAttribute("aria-selected") === "true" &&
              available(entry)
          )
        : undefined) ??
      next.find(available);

    const currentElements = new Set<HTMLElement>([
      root,
      strip,
      ...next.flatMap((entry) => [entry.tab, entry.panel]),
    ]);
    for (const element of snapshots.keys())
      if (!currentElements.has(element)) restore(element);
    // Preserve object identity so refresh without changes emits no change event.
    entries = next.map(
      (entry) =>
        entries.find(
          (old) => old.tab === entry.tab && old.panel === entry.panel
        ) ?? entry
    );
    for (const { tab, panel } of entries) {
      if (!tab.id) {
        let id: string;
        do {
          id = `ag-tab-${++nextTabId}`;
        } while (
          root.ownerDocument.getElementById(id) ||
          root.querySelector(`[id="${id}"]`)
        );
        write(tab, "id", id);
      }
      write(tab, "type", "button");
      write(tab, "role", "tab");
      write(panel, "role", "tabpanel");
      write(panel, "aria-labelledby", tab.id);
      if (!panel.hasAttribute("tabindex")) write(panel, "tabindex", "0");
    }
    write(strip, "role", "tablist");
    write(strip, "aria-orientation", "horizontal");
    if (
      !strip.hasAttribute("aria-label") &&
      !strip.hasAttribute("aria-labelledby")
    )
      write(strip, "aria-label", "Related views");
    write(root, "data-enhanced", "");
    activate(
      entries.find((entry) => entry.tab === active?.tab),
      !initial
    );
  };

  const select = (
    panelId: string,
    { focus = false }: { focus?: boolean } = {}
  ) => {
    if (destroyed) return false;
    const entry = entries.find(
      (item) => item.panel.id === panelId && available(item)
    );
    if (!entry) return false;
    activate(entry, true, focus);
    return true;
  };

  /** Locate only a tab belonging to this strip, never a nested view's button. */
  const eventEntry = (event: Event) =>
    entries.find(
      (entry) =>
        event.target instanceof Node && entry.tab.contains(event.target)
    );
  const onClick = (event: MouseEvent) => {
    const entry = eventEntry(event);
    if (!entry) return;
    event.preventDefault();
    if (available(entry)) activate(entry, true);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const current = eventEntry(event);
    if (
      !current ||
      !available(current) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const enabled = entries.filter(available);
    const index = enabled.indexOf(current);
    const rtl = getComputedStyle(strip).direction === "rtl";
    let next: Entry | undefined;
    if (event.key === "Home") next = enabled[0];
    else if (event.key === "End") next = enabled[enabled.length - 1];
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const step = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
      next = enabled[(index + step + enabled.length) % enabled.length];
    }
    if (!next) return;
    event.preventDefault();
    if (activation === "automatic") activate(next, true, true);
    else {
      for (const entry of entries)
        write(entry.tab, "tabindex", entry === next ? "0" : "-1");
      next.tab.focus();
    }
  };

  reconcile(true);
  strip.addEventListener("click", onClick);
  strip.addEventListener("keydown", onKeyDown);
  const controller: TabbedViewController = {
    get selectedPanelId() {
      return selected?.panel.id ?? null;
    },
    select,
    refresh: () => reconcile(),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      strip.removeEventListener("click", onClick);
      strip.removeEventListener("keydown", onKeyDown);
      for (const element of snapshots.keys()) restore(element);
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  return controller;
}
