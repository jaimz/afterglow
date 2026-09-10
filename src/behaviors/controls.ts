export interface ControlsController {
  update(): void;
  destroy(): void;
}
const controllers = new WeakMap<ParentNode, ControlsController>();
const selector =
  'input[type="checkbox"], input[type="radio"], input[type="range"]';
const changeKeys = new Set([
  " ",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);
/** Optional read-only states and radio-group shortcuts. Ordinary inputs need no helper. */
export function enhanceControls(
  root: ParentNode = document
): ControlsController {
  const existing = controllers.get(root);
  if (existing) return existing;
  const target = root as ParentNode & EventTarget;
  let destroyed = false;
  const saved = new Map<
    HTMLInputElement,
    { required: boolean; aria: string | null }
  >();
  const isReadOnly = (input: HTMLInputElement) =>
    input.hasAttribute("data-readonly") ||
    !!input.closest("fieldset[data-readonly]");
  const inputs = () => [
    ...(root instanceof HTMLInputElement && root.matches(selector)
      ? [root]
      : []),
    ...root.querySelectorAll<HTMLInputElement>(selector),
  ];
  const restore = (
    input: HTMLInputElement,
    state: { required: boolean; aria: string | null }
  ) => {
    input.required = state.required;
    if (state.aria === null) input.removeAttribute("aria-readonly");
    else input.setAttribute("aria-readonly", state.aria);
    saved.delete(input);
  };
  const update = () => {
    if (destroyed) return;
    const current = new Set(inputs());
    for (const [input, state] of saved)
      if (!current.has(input) || !isReadOnly(input)) restore(input, state);
    for (const input of current) {
      if (!isReadOnly(input)) continue;
      if (!saved.has(input))
        saved.set(input, {
          required: input.required,
          aria: input.getAttribute("aria-readonly"),
        });
      // Keep submission and focus, while exempting a value the user cannot change.
      if (input.required) {
        saved.get(input)!.required = true;
        input.required = false;
      }
      if (input.getAttribute("aria-readonly") !== "true")
        input.setAttribute("aria-readonly", "true");
    }
  };
  const inputTarget = (event: Event) =>
    event.target instanceof HTMLInputElement && event.target.matches(selector)
      ? event.target
      : null;
  const click = (event: Event) => {
    const input = inputTarget(event);
    if (input && isReadOnly(input)) event.preventDefault();
  };
  const pointer = (event: Event) => {
    const input = inputTarget(event);
    if (input?.type === "range" && isReadOnly(input)) {
      input.focus();
      event.preventDefault();
    }
  };
  const keydown = (event: Event) => {
    const key = event as KeyboardEvent;
    if (key.defaultPrevented) return;
    const input = inputTarget(event);
    if (!input) return;
    const group =
      input.type === "radio" ? input.closest(".ag-radio-group") : null;
    if (
      group &&
      [
        "Home",
        "End",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(key.key)
    ) {
      const radios = Array.from(
        group.querySelectorAll<HTMLInputElement>('input[type="radio"]')
      ).filter(
        (radio) =>
          !radio.matches(":disabled") &&
          radio.name === input.name &&
          radio.form === input.form &&
          radio.closest(".ag-radio-group") === group
      );
      if (!radios.length) return;
      const rtl = getComputedStyle(group).direction === "rtl";
      const delta =
        key.key === "ArrowRight"
          ? rtl
            ? -1
            : 1
          : key.key === "ArrowLeft"
          ? rtl
            ? 1
            : -1
          : key.key === "ArrowDown"
          ? 1
          : -1;
      const index =
        key.key === "Home"
          ? 0
          : key.key === "End"
          ? radios.length - 1
          : (radios.indexOf(input) + delta + radios.length) % radios.length;
      key.preventDefault();
      const next = radios[index];
      next.focus();
      if (!isReadOnly(input) && !isReadOnly(next)) next.click();
    } else if (isReadOnly(input) && changeKeys.has(key.key))
      key.preventDefault();
  };
  target.addEventListener("click", click, true);
  target.addEventListener("pointerdown", pointer, true);
  target.addEventListener("keydown", keydown, true);
  const ownerDocument =
    root instanceof Document ? root : (root as Node).ownerDocument!;
  const reset = (event: Event) =>
    queueMicrotask(() => {
      if (destroyed || event.defaultPrevented) return;
      for (const input of inputs())
        if (input.type === "checkbox" && input.form === event.target)
          input.indeterminate = false;
    });
  ownerDocument.addEventListener("reset", reset, true);
  const observer = new MutationObserver(update);
  observer.observe(root as Node, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-readonly", "required"],
  });
  const controller = {
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      target.removeEventListener("click", click, true);
      target.removeEventListener("pointerdown", pointer, true);
      target.removeEventListener("keydown", keydown, true);
      ownerDocument.removeEventListener("reset", reset, true);
      for (const [input, state] of saved) restore(input, state);
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  update();
  return controller;
}
