import { LitElement, PropertyValues, CSSResultGroup, css, html } from "lit";
import { property, state } from "lit/decorators.js";

/** Shared browser form integration. Native controls remain inside shadow DOM. */
export abstract class FormControl extends LitElement {
  static formAssociated = true;
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static styles: CSSResultGroup = css`
    :host {
      position: relative;
    }
    :host([hidden]) {
      display: none;
    }
    .native-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      z-index: 2;
      cursor: inherit;
    }
    :host(:focus-within) .control,
    :host(:focus-within) .switch {
      outline: 2px solid currentColor;
      outline-offset: 3px;
    }
  `;

  protected internals = this.attachInternals();
  private validationOverride?: { flags: ValidityStateFlags; message: string };
  @property({ reflect: true }) name = "";
  @property() value = "";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, attribute: "readonly", reflect: true }) readOnly =
    false;
  @property({ type: Boolean }) autofocus = false;
  @property({ attribute: "aria-label" }) ariaLabel: string | null = null;
  @property({ attribute: "aria-labelledby" }) ariaLabelledby: string | null =
    null;
  @property({ attribute: "aria-describedby" }) ariaDescribedby: string | null =
    null;
  @state() private fieldsetDisabled = false;
  @property({ attribute: false }) groupDisabled = false;
  @property({ attribute: false }) groupReadOnly = false;

  get effectiveDisabled() {
    return this.disabled || this.fieldsetDisabled || this.groupDisabled;
  }
  get effectiveReadOnly() {
    return this.readOnly || this.groupReadOnly;
  }
  get form() {
    return this.internals.form;
  }
  get labels() {
    return this.internals.labels;
  }
  get validity() {
    return this.internals.validity;
  }
  get validationMessage() {
    return this.internals.validationMessage;
  }
  get willValidate() {
    return this.internals.willValidate;
  }
  checkValidity() {
    this.syncForm();
    return this.internals.checkValidity();
  }
  reportValidity() {
    this.syncForm();
    return this.internals.reportValidity();
  }
  setValidity(flags: ValidityStateFlags, message = "") {
    this.validationOverride = Object.values(flags).some(Boolean)
      ? { flags, message }
      : undefined;
    this.syncForm();
  }
  setCustomValidity(message: string) {
    this.setValidity(message ? { customError: true } : {}, message);
  }
  protected updateValidity(flags: ValidityStateFlags = {}, message = "") {
    const validity = this.validationOverride ?? { flags, message };
    this.internals.setValidity(validity.flags, validity.message, this.control);
  }

  get control(): HTMLInputElement | HTMLButtonElement | undefined {
    return (
      this.shadowRoot?.querySelector<HTMLInputElement | HTMLButtonElement>(
        ".native-input, button.control"
      ) ?? undefined
    );
  }
  focus(options?: FocusOptions) {
    this.control?.focus(options);
  }

  protected referencedText(ids: string | null): string | undefined {
    const root = this.getRootNode() as Document | ShadowRoot;
    return (
      ids
        ?.split(/\s+/)
        .map((id) => root.getElementById?.(id)?.textContent ?? "")
        .join(" ")
        .trim() || undefined
    );
  }
  protected get accessibleLabel() {
    return (
      this.ariaLabel ||
      this.referencedText(this.ariaLabelledby) ||
      Array.from(this.labels)
        .map((label) => label.textContent)
        .join(" ")
        .trim() ||
      undefined
    );
  }
  protected renderDescription() {
    return html`<span id="description" hidden
      >${this.referencedText(this.ariaDescribedby)}</span
    >`;
  }
  protected get forwardHostClicks() {
    return true;
  }

  constructor() {
    super();
    // A click on the custom element (including an external label) activates its control.
    this.addEventListener(
      "click",
      (event) => {
        if (this.effectiveDisabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        } else if (
          this.forwardHostClicks &&
          this.control &&
          !event.composedPath().includes(this.control)
        ) {
          event.stopImmediatePropagation();
          this.control.click();
        }
      },
      true
    );
  }

  formDisabledCallback(disabled: boolean) {
    this.fieldsetDisabled = disabled;
  }
  formResetCallback() {
    this.value = this.getAttribute("value") ?? "";
  }
  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state === "string") this.value = state;
  }
  protected firstUpdated() {
    if (this.autofocus) this.focus();
  }
  protected updated(_changed: PropertyValues) {
    this.classList.toggle("disabled", this.effectiveDisabled);
    this.classList.toggle("readonly", this.effectiveReadOnly);
    this.syncForm();
  }
  protected syncForm() {
    this.internals.setFormValue(this.effectiveDisabled ? null : this.value);
    this.updateValidity();
  }
  protected emitChange() {
    this.syncForm();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }
}
