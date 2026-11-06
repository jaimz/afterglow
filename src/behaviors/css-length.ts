/** Let CSS resolve a length token, including relative units and calc() expressions. */
export function resolveCSSLength(
  element: HTMLElement,
  token: string,
  fallback: number
): number {
  const probe = element.ownerDocument.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.setAttribute("data-ag-measure", "");
  probe.style.cssText =
    "all:initial;position:absolute;visibility:hidden;pointer-events:none;display:block;height:0;padding:0;border:0;margin:0;min-width:0;max-width:none;box-sizing:content-box;";
  probe.style.font =
    element.ownerDocument.defaultView!.getComputedStyle(element).font;
  probe.style.width = `var(${token}, ${fallback}px)`;
  element.append(probe);
  try {
    const value = parseFloat(
      element.ownerDocument.defaultView!.getComputedStyle(probe).width
    );
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
  } finally {
    probe.remove();
  }
}
