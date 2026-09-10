import { html } from "lit";
import { property } from "lit/decorators.js";
import { Checkable } from "../checkable";
import { checkboxStyles } from "./checkbox.styles";
import { registerElement } from "../../utils/register";

export type Variant = "default" | "solid" | "filled" | "backdrop";

export class AGCheckbox extends Checkable {
  static styles = [Checkable.styles, checkboxStyles];
  @property({ reflect: true }) variant: Variant = "default";
  protected render() {
    return html`${this.renderInput()}
      <div part="control" class="control" aria-hidden="true">
        <slot name="checked-indicator"
          ><svg
            part="checked-indicator"
            class="checked-indicator"
            width="14"
            height="10"
            viewBox="0 0 14 10"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M13 1L4.75 9L1 5.36364"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg
        ></slot>
        <slot name="indeterminate-indicator"
          ><div
            part="indeterminate-indicator"
            class="indeterminate-indicator"
          ></div
        ></slot>
      </div>
      <label id="label" part="label" class="label"
        ><slot @slotchange=${() => this.requestUpdate()}></slot
      ></label>`;
  }
}
export const agCheckbox = () => registerElement("ag-checkbox", AGCheckbox);
agCheckbox();
declare global {
  interface HTMLElementTagNameMap {
    "ag-checkbox": AGCheckbox;
  }
}
