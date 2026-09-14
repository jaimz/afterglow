/**
 * Adds read-only behaviour, radio-group shortcuts and checkbox mixed-state reset
 * handling to native controls. Ordinary checkbox, radio and range interaction
 * already works without this helper.
 *
 * Add data-readonly to an input or its containing fieldset, then enhance that
 * element or an ancestor. Read-only inputs remain focusable and participate in
 * form submission; the helper prevents user changes and temporarily suspends
 * required validation. Radio shortcuts use the .ag-radio-group wrapper.
 *
 * Use one controller per form or view and avoid overlapping roots. Descendant
 * additions and relevant attribute changes are observed automatically. Call
 * update() when an immediate refresh is needed, and destroy() when disposing
 * the view. See Usage.md for the native control recipes.
 *
 * @example
 * import { enhanceControls } from "ag";
 *
 * const form = document.querySelector<HTMLFormElement>("#preferences")!;
 * const controls = enhanceControls(form);
 *
 * // When removing the form from the page:
 * controls.destroy();
 */

export interface ControlsController {
  /** Apply read-only state now, including restoring controls that became editable. */
  update(): void;

  /** Remove listeners and observation, and restore saved required/ARIA attributes. */
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

/**
 * Enhance controls within a root (the document by default), including the root
 * itself if it is an input. Repeated calls return the existing controller.
 */
export function enhanceControls(
  root: ParentNode = document
): ControlsController {
  const existing = controllers.get(root);
  if (existing) return existing;

  const target = root as ParentNode & EventTarget;
  let destroyed = false;

  // Store the caller's values before applying temporary read-only attributes.
  const saved = new Map<
    HTMLInputElement,
    { required: boolean; aria: string | null }
  >();

  const isReadOnly = (input: HTMLInputElement) =>
    input.hasAttribute("data-readonly") ||
    !!input.closest("fieldset[data-readonly]");

  // Query afresh so controls added after enhancement participate automatically.
  const inputs = () => [
    ...(root instanceof HTMLInputElement && root.matches(selector)
      ? [root]
      : []),
    ...root.querySelectorAll<HTMLInputElement>(selector),
  ];

  /** Restore attributes when a control becomes editable, leaves the root, or is disposed. */
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

    // Prevent the browser's native range drag while retaining keyboard focus.
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
      // Stay within this native radio group and skip disabled or nested groups.
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

      // Read-only groups can move focus without changing the checked value.
      if (!isReadOnly(input) && !isReadOnly(next)) next.click();
    } else if (isReadOnly(input) && changeKeys.has(key.key))
      key.preventDefault();
  };

  // Capture activation events so their native value changes can be prevented.
  target.addEventListener("click", click, true);
  target.addEventListener("pointerdown", pointer, true);
  target.addEventListener("keydown", keydown, true);

  const ownerDocument =
    root instanceof Document ? root : (root as Node).ownerDocument!;

  // Native reset restores checked values but leaves indeterminate unchanged.
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
