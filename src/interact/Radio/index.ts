import { html, PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { Checkable } from "../checkable";
import { radioStyles } from "./radio.styles";
import { registerElement } from "../../utils/register";

export type Variant = "default" | "backdrop";

export class AGRadio extends Checkable {
  static styles = [Checkable.styles, radioStyles];
  @property({ reflect: true }) variant: Variant = "default";
  @property({ attribute: false }) groupManaged = false;
  protected inputType = "radio";
  protected inputRole = "radio";

  connectedCallback() {
    super.connectedCallback();
    if (this.parentElement?.localName !== "ag-radio-group") {
      this.groupManaged = this.groupDisabled = this.groupReadOnly = false;
      this.inputTabIndex = 0;
    }
  }

  constructor() {
    super();
    this.addEventListener("keydown", (event) => {
      if (this.groupManaged || this.effectiveDisabled) return;
      const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
        ? 1
        : ["ArrowLeft", "ArrowUp"].includes(event.key)
        ? -1
        : 0;
      if (!direction) return;
      event.preventDefault();
      const peers = this.peers().filter((radio) => !radio.effectiveDisabled);
      const next =
        peers[(peers.indexOf(this) + direction + peers.length) % peers.length];
      next?.focus();
      if (!this.effectiveReadOnly) next?.click();
    });
  }
  private peers(): AGRadio[] {
    if (!this.name) return [this];
    return Array.from(
      (this.getRootNode() as Document | ShadowRoot).querySelectorAll<AGRadio>(
        "ag-radio"
      )
    ).filter(
      (radio) =>
        !radio.groupManaged &&
        radio.name === this.name &&
        radio.form === this.form
    );
  }
  protected updated(changed: PropertyValues) {
    super.updated(changed);
    if (
      this.checked &&
      (changed.has("checked") ||
        changed.has("defaultChecked") ||
        changed.has("name"))
    ) {
      if (!this.groupManaged) {
        for (const radio of this.peers())
          if (radio !== this) radio.checked = false;
      }
    }
    if (
      changed.has("checked") ||
      changed.has("defaultChecked") ||
      changed.has("value")
    ) {
      this.dispatchEvent(
        new CustomEvent("ag-radio-state-change", { bubbles: true })
      );
    }
  }
  protected syncForm() {
    super.syncForm();
    if (this.groupManaged) {
      this.internals.setFormValue(null);
      this.updateValidity({});
    } else if (this.required) {
      const missing = !this.peers().some((radio) => radio.checked);
      this.updateValidity(
        missing ? { valueMissing: true } : {},
        missing ? "Please select an option." : ""
      );
    }
  }
  protected render() {
    return html`${this.renderInput()}
      <div part="control" class="control" aria-hidden="true">
        <slot name="checked-indicator"
          ><div part="checked-indicator" class="checked-indicator"></div
        ></slot>
      </div>
      <label id="label" part="label" class="label"
        ><slot @slotchange=${() => this.requestUpdate()}></slot
      ></label>`;
  }
}
export const agRadio = () => registerElement("ag-radio", AGRadio);
agRadio();
declare global {
  interface HTMLElementTagNameMap {
    "ag-radio": AGRadio;
  }
}
