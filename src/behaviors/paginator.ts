export interface PaginatorOptions {
  /** Total number of pages. Zero represents an empty result set. */
  pageCount: number;
  /** One-based current page, clamped to the available range. */
  page?: number;
  variant?: "default" | "prev-next";
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number) => string;
  statusLabel?: (page: number, pageCount: number) => string;
}

export interface PaginatorController {
  /** Reconcile current DOM state immediately. */
  refresh(): void;
  /** One-based page, or zero when no pages are available. */
  readonly page: number;
  readonly pageCount: number;
  /** Update state silently; applications own loading and rendering page content. */
  update(options?: Partial<PaginatorOptions>): void;
  /** Remove generated controls and restore authored content and attributes. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, PaginatorController>();

/** First/last pages, two neighbours each side, and noninteractive gaps. */
function pageWindow(page: number, count: number): Array<number | "gap"> {
  if (!count) return [];
  const pages = new Set([1, count]);
  if (count <= 9) {
    for (let n = 1; n <= count; n++) pages.add(n);
  } else {
    for (let n = Math.max(1, page - 2); n <= Math.min(count, page + 2); n++)
      pages.add(n);
  }
  const result: Array<number | "gap"> = [];
  let previous = 0;
  for (const n of [...pages].sort((a, b) => a - b)) {
    if (n - previous === 2) result.push(previous + 1);
    else if (n - previous > 2) result.push("gap");
    result.push(n);
    previous = n;
  }
  return result;
}

/** A native pagination landmark. User activation emits ag-page-change. */
export function enhancePaginator(
  root: HTMLElement,
  options: PaginatorOptions
): PaginatorController {
  const existing = controllers.get(root);
  if (existing) {
    existing.update(options);
    return existing;
  }
  let settings: PaginatorOptions;
  let destroyed = false;
  const validate = (next: PaginatorOptions) => {
    if (!Number.isSafeInteger(next.pageCount) || next.pageCount < 0)
      throw new RangeError(
        "Paginator pageCount must be a non-negative safe integer."
      );
    if (!Number.isSafeInteger(next.page ?? 1))
      throw new RangeError("Paginator page must be a safe integer.");
    if (
      next.variant !== undefined &&
      !["default", "prev-next"].includes(next.variant)
    )
      throw new Error("Unknown paginator variant.");
    return {
      ...next,
      page: next.pageCount
        ? Math.max(1, Math.min(next.page ?? 1, next.pageCount))
        : 0,
    };
  };
  settings = validate(options);
  const document = root.ownerDocument;
  const originalNodes = [...root.childNodes];
  const attributes = new Map(
    ["role", "aria-label", "data-variant"].map((name) => [
      name,
      root.getAttribute(name),
    ])
  );
  if (root.tagName !== "NAV") root.setAttribute("role", "navigation");
  if (!root.hasAttribute("aria-label") && !root.hasAttribute("aria-labelledby"))
    root.setAttribute("aria-label", "Pagination");
  const list = document.createElement("ol");
  list.className = "ag-paginator__list";
  list.setAttribute("role", "list");
  const status = document.createElement("span");
  status.className = "ag-paginator__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-atomic", "true");
  root.replaceChildren(list, status);

  const render = () => {
    const active = document.activeElement;
    const focusKey =
      active instanceof HTMLElement && list.contains(active)
        ? active.dataset.paginatorKey
        : undefined;
    const nodes: HTMLElement[] = [];
    const addButton = (
      text: string,
      page: number,
      key: string,
      disabled = false
    ) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ag-paginator__item";
      button.textContent = text;
      button.dataset.page = String(page);
      button.dataset.paginatorKey = key;
      button.disabled = disabled;
      if (key === "previous")
        button.setAttribute(
          "aria-label",
          settings.previousLabel ?? "Previous page"
        );
      if (key === "next")
        button.setAttribute("aria-label", settings.nextLabel ?? "Next page");
      if (key.startsWith("page-")) {
        button.setAttribute(
          "aria-label",
          settings.pageLabel?.(page) ?? `Page ${page}`
        );
        if (page === settings.page) {
          button.setAttribute("aria-current", "page");
          // Keep larger page numbers inside the reference's compact circle.
          if (text.length > 2)
            button.style.fontSize = `calc(var(--paginator-text-size) * ${
              2 / text.length
            })`;
        }
      }
      li.append(button);
      nodes.push(li);
    };
    if (settings.variant === "prev-next")
      addButton(
        settings.previousLabel ?? "Prev",
        settings.page! - 1,
        "previous",
        settings.page! <= 1
      );
    for (const item of pageWindow(settings.page!, settings.pageCount)) {
      if (item === "gap") {
        const li = document.createElement("li");
        li.className = "ag-paginator__ellipsis";
        li.textContent = "…";
        li.setAttribute("aria-hidden", "true");
        nodes.push(li);
      } else addButton(String(item), item, `page-${item}`);
    }
    if (settings.variant === "prev-next")
      addButton(
        settings.nextLabel ?? "Next",
        settings.page! + 1,
        "next",
        settings.page! >= settings.pageCount
      );
    list.replaceChildren(...nodes);
    root.dataset.variant = settings.variant ?? "default";
    if (focusKey) {
      const buttons = [...list.querySelectorAll<HTMLButtonElement>("button")];
      (
        buttons.find(
          (button) =>
            button.dataset.paginatorKey === focusKey && !button.disabled
        ) ?? buttons.find((button) => button.hasAttribute("aria-current"))
      )?.focus({ preventScroll: true });
    }
  };
  const click = (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button[data-page]"
    );
    if (!button || !list.contains(button) || button.disabled) return;
    const page = Number(button.dataset.page);
    if (page === settings.page) return;
    settings = validate({ ...settings, page });
    render();
    status.textContent =
      settings.statusLabel?.(settings.page!, settings.pageCount) ??
      `Page ${settings.page} of ${settings.pageCount}`;
    root.dispatchEvent(
      new CustomEvent("ag-page-change", {
        bubbles: true,
        detail: { page: settings.page, pageCount: settings.pageCount },
      })
    );
  };
  list.addEventListener("click", click);
  const controller: PaginatorController = {
    refresh: () => {
      if (!destroyed) render();
    },
    get page() {
      return settings.page!;
    },
    get pageCount() {
      return settings.pageCount;
    },
    update(next = {}) {
      if (destroyed) return;
      settings = validate({ ...settings, ...next });
      status.textContent = "";
      render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      list.removeEventListener("click", click);
      root.replaceChildren(...originalNodes);
      for (const [name, value] of attributes) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
      controllers.delete(root);
    },
  };
  render();
  controllers.set(root, controller);
  return controller;
}
