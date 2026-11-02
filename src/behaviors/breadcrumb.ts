export interface BreadcrumbController {
  /** Refresh labels immediately after changing the path. */
  refresh(): void;
  /** Restore full labels and stop observing the path. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, BreadcrumbController>();

/** Keep full accessible names while displaying at most 24 grapheme clusters. */
export function enhanceBreadcrumb(root: HTMLElement): BreadcrumbController {
  const existing = controllers.get(root);
  if (existing) return existing;

  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const entries = new Map<HTMLElement, { full: HTMLElement; title: string | null }>();
  const originalTabIndex = root.getAttribute("tabindex");
  let destroyed = false;

  const restore = (label: HTMLElement) => {
    const entry = entries.get(label);
    if (!entry) return;
    if (entry.full.parentElement === label) label.textContent = entry.full.textContent;
    if (entry.title === null) label.removeAttribute("title");
    else label.setAttribute("title", entry.title);
    entries.delete(label);
  };

  const updateScrollFocus = () => {
    if (destroyed || originalTabIndex !== null) return;
    if (root.scrollWidth > root.clientWidth + 1) root.tabIndex = 0;
    else root.removeAttribute("tabindex");
  };

  const observer = new MutationObserver(() => refresh());
  const refresh = () => {
    if (destroyed) return;
    observer.disconnect();
    const labels = new Set(root.querySelectorAll<HTMLElement>(".ag-breadcrumb__label"));
    for (const label of entries.keys()) if (!labels.has(label)) restore(label);
    for (const label of labels) {
      restore(label);
      const text = label.textContent || "";
      const characters = Array.from(segmenter.segment(text), ({ segment }) => segment);
      if (characters.length <= 24) continue;
      const full = root.ownerDocument.createElement("span");
      full.className = "ag-breadcrumb__full-label";
      full.textContent = text;
      const visible = root.ownerDocument.createElement("span");
      visible.setAttribute("aria-hidden", "true");
      visible.textContent = characters.slice(0, 12).join("") + "…" + characters.slice(-11).join("");
      entries.set(label, { full, title: label.getAttribute("title") });
      label.title = text;
      label.replaceChildren(full, visible);
    }
    updateScrollFocus();
    observer.observe(root, { childList: true, characterData: true, subtree: true });
  };
  const resizeObserver = new ResizeObserver(updateScrollFocus);
  resizeObserver.observe(root);
  const controller: BreadcrumbController = {
    refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      resizeObserver.disconnect();
      for (const label of entries.keys()) restore(label);
      if (originalTabIndex === null) root.removeAttribute("tabindex");
      else root.setAttribute("tabindex", originalTabIndex);
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  refresh();
  return controller;
}
