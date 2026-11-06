import { assertMarkup } from "./markup";

/**
 * Optional inline validation for an .ag-text-field containing a native input.
 * Labels, icons, focus, values, password masking and submission already work
 * without this helper. Enhance only fields that need inline error messages.
 * Set placeholder on the input and associate consumer-owned labels with its id
 * using label[for]. The helper does not create, position or change labels.
 *
 * Native constraints and an optional synchronous validation callback determine
 * validity. Errors appear after blur or a submission attempt; subsequent typing
 * updates the feedback. A server error supplied with setError() remains until
 * explicitly cleared or the form is reset. No password-strength policy is built in.
 *
 * Call update() after programmatic input.value changes. destroy() removes owned
 * listeners, messages and validation state without changing the entered value.
 * See Usage.md for markup, accessible descriptions and static CSS-only feedback.
 *
 * @example
 * const field = enhanceTextField(document.querySelector("#email-field")!);
 * field.setError("That email address is already registered.");
 * field.setError(null);
 * field.input.value = "another@example.com";
 * field.update();
 * // When removing the view:
 * field.destroy();
 */

export interface TextFieldOptions {
  value?: string;
  /** Return an error message or null. Native constraints are checked as well. */
  validation?: (input: HTMLInputElement) => string | null;
}

export interface TextFieldController {
  /** Reconcile current DOM state immediately. */
  refresh(): void;
  /** The native input owns its value, constraints, events and form association. */
  readonly input: HTMLInputElement;
  /** Check constraints and the callback, show feedback, and return validity. */
  validate(): boolean;
  /** Recheck programmatic changes, retaining whether feedback has been revealed. */
  update(options?: TextFieldOptions): void;
  /** Set or clear a persistent application/server error using plain text. */
  setError(message: string | null): void;
  /** Clear interaction feedback and server errors without changing the input value. */
  reset(): void;
  /** Remove owned feedback and listeners, preserving input data and external validity. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, TextFieldController>();
let nextErrorId = 0;

/** Enhance one field. Repeated calls return its existing validation controller. */
export function enhanceTextField(
  root: HTMLElement,
  options: TextFieldOptions = {}
): TextFieldController {
  assertMarkup(root);
  const existing = controllers.get(root);
  if (existing) {
    existing.update(options);
    return existing;
  }
  options = { ...options };
  const input = root.querySelector<HTMLInputElement>(
    "input.ag-text-field__input"
  );
  if (!input)
    throw new Error("A text field requires an input.ag-text-field__input.");

  const owner = root.ownerDocument;
  const originalInvalid = input.getAttribute("aria-invalid");
  const originalStatus = root.getAttribute("data-status");
  const error = owner.createElement("p");
  error.className = "ag-text-field__error";
  do {
    error.id = `ag-text-field-error-${++nextErrorId}`;
  } while (owner.getElementById(error.id));
  error.setAttribute("aria-live", "polite");
  error.hidden = true;
  root.append(error);

  let revealed = false;
  let serverError: string | null = null;
  let ownedValidity: { message: string; previous: string } | null = null;
  let destroyed = false;

  /** Restore only the custom validity message this helper last assigned. */
  const releaseValidity = () => {
    if (
      ownedValidity &&
      input.validity.customError &&
      (input.validationMessage === ownedValidity.message || !input.willValidate)
    )
      input.setCustomValidity(ownedValidity.previous);
    ownedValidity = null;
  };

  /** Add/remove our description without disturbing other help text references. */
  const describeError = (visible: boolean) => {
    const ids = (input.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((id) => id && id !== error.id);
    if (visible) ids.push(error.id);
    if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
    else input.removeAttribute("aria-describedby");
  };

  const restorePresentation = () => {
    if (originalInvalid === null) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", originalInvalid);
    if (originalStatus === null) root.removeAttribute("data-status");
    else root.setAttribute("data-status", originalStatus);
  };

  /** Reconcile custom and native validity without dispatching an invalid event. */
  const update = (next: TextFieldOptions = {}) => {
    if (destroyed) return;
    Object.assign(options, next);
    if (next.value !== undefined) input.value = next.value;
    releaseValidity();

    if (input.willValidate) {
      const message = serverError || options.validation?.(input) || null;
      if (message) {
        ownedValidity = {
          message,
          previous: input.validity.customError ? input.validationMessage : "",
        };
        input.setCustomValidity(message);
      }
    }

    const message =
      input.willValidate && !input.validity.valid
        ? input.validationMessage
        : "";
    const visible = revealed && !!message;
    if (error.textContent !== (visible ? message : ""))
      error.textContent = visible ? message : "";
    error.hidden = !visible;
    describeError(visible);

    if (!revealed || !input.willValidate) restorePresentation();
    else if (message) {
      input.setAttribute("aria-invalid", "true");
      root.dataset.status = "error";
    } else {
      input.setAttribute("aria-invalid", "false");
      if (input.value) root.dataset.status = "success";
      else root.removeAttribute("data-status");
    }
  };

  const validate = () => {
    revealed = true;
    update();
    return !input.willValidate || input.validity.valid;
  };

  const reset = () => {
    if (destroyed) return;
    revealed = false;
    serverError = null;
    update();
  };

  const onInput = (event: Event) => {
    if (!(event as InputEvent).isComposing) update();
  };
  const onBlur = () => {
    validate();
  };
  const onInvalid = () => {
    validate();
  };
  const onSubmit = (event: Event) => {
    const submitter = (event as SubmitEvent).submitter as
      | HTMLButtonElement
      | HTMLInputElement
      | null;
    if (
      event.target === input.form &&
      !input.form?.noValidate &&
      !submitter?.formNoValidate &&
      !validate()
    )
      event.preventDefault();
  };
  const onReset = (event: Event) => {
    if (event.target !== input.form) return;
    // Wait for the native reset, and respect application cancellation.
    queueMicrotask(() => {
      if (!event.defaultPrevented) reset();
    });
  };

  input.addEventListener("input", onInput);
  const compositionEnd = () => update();
  input.addEventListener("compositionend", compositionEnd);
  input.addEventListener("blur", onBlur);
  input.addEventListener("invalid", onInvalid);
  owner.addEventListener("submit", onSubmit, true);
  owner.addEventListener("reset", onReset, true);

  const observer = new MutationObserver((records) => {
    if (
      records.some(
        ({ target }) =>
          target === input ||
          (target instanceof HTMLFieldSetElement && target.contains(input))
      )
    )
      update();
  });
  observer.observe(input, {
    attributes: true,
    attributeFilter: [
      "required",
      "pattern",
      "min",
      "max",
      "step",
      "minlength",
      "maxlength",
      "disabled",
      "readonly",
      "type",
      "value",
      "multiple",
    ],
  });
  observer.observe(owner, {
    attributes: true,
    subtree: true,
    attributeFilter: ["disabled"],
  });

  const controller: TextFieldController = {
    refresh: () => update(),
    input,
    validate,
    update,
    reset,

    setError(message) {
      if (destroyed) return;
      serverError = message || null;
      if (serverError) revealed = true;
      update();
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      input.removeEventListener("input", onInput);
      input.removeEventListener("compositionend", compositionEnd);
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("invalid", onInvalid);
      owner.removeEventListener("submit", onSubmit, true);
      owner.removeEventListener("reset", onReset, true);
      releaseValidity();
      describeError(false);
      error.remove();
      restorePresentation();
      controllers.delete(root);
    },
  };

  update(options);
  controllers.set(root, controller);
  return controller;
}
