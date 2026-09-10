import { html, PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FormControl } from "../form-control";
import { AGRadio } from "../Radio";
import { radioGroupStyles } from "./radio-group.styles";
import { registerElement } from "../../utils/register";

export class AGRadioGroup extends FormControl {
  static styles = [FormControl.styles, radioGroupStyles];
  @property({ reflect: true }) orientation: "horizontal" | "vertical" =
    "horizontal";
  @property({ reflect: true }) variant = "default";
  private managedRadios: AGRadio[] = [];
  private selectionFromRadio = false;

  get radios() {
    return Array.from(this.children).filter(
      (child): child is AGRadio => child instanceof AGRadio
    );
  }
  get control() {
    return (this.radios.find((radio) => radio.checked) ?? this.radios[0])
      ?.control;
  }

  constructor() {
    super();
    this.addEventListener("change", this.onRadioChange);
    this.addEventListener("ag-radio-state-change", (event) => {
      event.stopPropagation();
      const radio = event.target;
      if (radio instanceof AGRadio && radio.parentElement === this) {
        if (radio.checked) this.select(radio);
        else {
          if (!this.radios.some((option) => option.checked)) {
            this.selectionFromRadio = true;
            this.value = "";
          }
          this.requestUpdate();
        }
      }
    });
    this.addEventListener("keydown", this.onKeyDown);
  }
  // A group is a container; clicks must reach its children without forwarding.
  protected get forwardHostClicks() {
    return false;
  }

  private select(radio: AGRadio) {
    for (const sibling of this.radios)
      if (sibling !== radio) sibling.checked = false;
    this.selectionFromRadio = true;
    this.value = radio.value;
    this.requestUpdate();
    this.syncForm();
  }
  private onRadioChange = (event: Event) => {
    if (
      !(event.target instanceof AGRadio) ||
      event.target.parentElement !== this
    )
      return;
    event.stopImmediatePropagation();
    this.select(event.target);
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };
  private onKeyDown = (event: KeyboardEvent) => {
    if (this.effectiveDisabled) return;
    const current = event
      .composedPath()
      .find((node) => node instanceof AGRadio) as AGRadio | undefined;
    if (!current || current.parentElement !== this) return;
    const radios = this.radios.filter((radio) => !radio.effectiveDisabled);
    const rtl = getComputedStyle(this).direction === "rtl";
    let delta = 0;
    if (event.key === "ArrowRight") delta = rtl ? -1 : 1;
    if (event.key === "ArrowLeft") delta = rtl ? 1 : -1;
    if (event.key === "ArrowDown") delta = 1;
    if (event.key === "ArrowUp") delta = -1;
    if (!delta && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
        ? radios.length - 1
        : (radios.indexOf(current) + delta + radios.length) % radios.length;
    const next = radios[index];
    next?.focus();
    if (!this.effectiveReadOnly) next?.click();
  };
  protected updated(changed: PropertyValues) {
    const radios = this.radios;
    for (const previous of this.managedRadios) {
      if (!radios.includes(previous)) {
        previous.groupManaged =
          previous.groupDisabled =
          previous.groupReadOnly =
            false;
        previous.inputTabIndex = 0;
      }
    }
    this.managedRadios = radios;
    if (
      changed.has("value") &&
      !this.selectionFromRadio &&
      (changed.get("value") !== undefined || this.value !== "")
    ) {
      const selected = radios.find((radio) => radio.value === this.value);
      for (const radio of radios) radio.checked = radio === selected;
    }
    this.selectionFromRadio = false;
    const active =
      radios.find((radio) => radio.checked && !radio.disabled) ??
      radios.find((radio) => !radio.disabled);
    for (const radio of radios) {
      radio.groupManaged = true;
      radio.groupDisabled = this.effectiveDisabled;
      radio.groupReadOnly = this.effectiveReadOnly;
      radio.inputTabIndex = radio === active ? 0 : -1;
    }
    super.updated(changed);
  }
  protected syncForm() {
    const selected = this.radios.find(
      (radio) => radio.checked && !radio.effectiveDisabled
    );
    this.internals.setFormValue(
      this.effectiveDisabled || !selected ? null : selected.value
    );
    const missing = this.required && !selected && !this.effectiveDisabled;
    this.updateValidity(
      missing ? { valueMissing: true } : {},
      missing ? "Please select an option." : ""
    );
  }
  formResetCallback() {
    for (const radio of this.radios) radio.formResetCallback();
    this.value =
      this.getAttribute("value") ??
      this.radios.find((radio) => radio.defaultChecked)?.value ??
      "";
    this.requestUpdate();
  }
  protected render() {
    return html`<div
      role="radiogroup"
      aria-label=${ifDefined(this.accessibleLabel)}
      aria-labelledby=${ifDefined(
        this.accessibleLabel ? undefined : "group-label"
      )}
      aria-orientation=${this.orientation}
      aria-disabled=${this.effectiveDisabled}
      aria-readonly=${this.effectiveReadOnly}
    >
      <div id="group-label"><slot name="label"></slot></div>
      <div class="positioning-region" part="positioning-region">
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </div>
    </div>`;
  }
}
export const agRadioGroup = () =>
  registerElement("ag-radio-group", AGRadioGroup);
agRadioGroup();
declare global {
  interface HTMLElementTagNameMap {
    "ag-radio-group": AGRadioGroup;
  }
}
