import { PropertyValues, html } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FormControl } from "./form-control";

export abstract class Checkable extends FormControl {
  @property({ type: Boolean, attribute: "checked" }) defaultChecked = false;
  private checkedValue = false;
  private dirtyChecked = false;
  @property({ type: Boolean, attribute: false })
  get checked() {
    return this.checkedValue;
  }
  set checked(value: boolean) {
    this.dirtyChecked = true;
    this.checkedValue = Boolean(value);
  }
  @property({ type: Boolean, attribute: false }) indeterminate = false;
  @property({ attribute: false }) inputTabIndex = 0;
  value = "on";
  protected inputType = "checkbox";
  protected inputRole = "checkbox";

  protected willUpdate(changed: PropertyValues) {
    if (changed.has("defaultChecked") && !this.dirtyChecked)
      this.checkedValue = this.defaultChecked;
    this.classList.toggle("checked", this.checked);
    this.classList.toggle("indeterminate", this.indeterminate);
  }
  protected syncForm() {
    this.internals.setFormValue(
      this.checked && !this.effectiveDisabled ? this.value : null,
      this.checked ? "checked" : "unchecked"
    );
    const missing =
      this.required &&
      !this.checked &&
      !this.effectiveDisabled &&
      !this.effectiveReadOnly;
    this.updateValidity(
      missing ? { valueMissing: true } : {},
      missing ? "Please select this option." : ""
    );
  }
  formResetCallback() {
    this.dirtyChecked = false;
    this.checkedValue = this.defaultChecked;
    this.indeterminate = false;
    this.value = this.getAttribute("value") ?? "on";
    this.requestUpdate();
  }
  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state === "string") this.checked = state === "checked";
  }

  protected onNativeChange(event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = input.indeterminate;
    this.emitChange();
  }
  protected renderInput() {
    return html`
      <input
        class="native-input"
        type=${this.inputType}
        role=${this.inputRole}
        .checked=${this.checked}
        .indeterminate=${this.indeterminate}
        .value=${this.value}
        ?disabled=${this.effectiveDisabled}
        ?required=${this.required}
        tabindex=${this.inputTabIndex}
        aria-label=${ifDefined(this.accessibleLabel)}
        aria-labelledby=${ifDefined(this.accessibleLabel ? undefined : "label")}
        aria-describedby=${ifDefined(
          this.ariaDescribedby ? "description" : undefined
        )}
        aria-readonly=${this.effectiveReadOnly ? "true" : "false"}
        @click=${(event: Event) => {
          if (this.effectiveReadOnly) event.preventDefault();
        }}
        @input=${(event: Event) => event.stopPropagation()}
        @change=${this.onNativeChange}
      />
      ${this.renderDescription()}
    `;
  }
}
