import { html } from "lit";
import { property } from "lit/decorators.js";
import { Checkable } from "../checkable";
import { switchStyles } from "./switch.styles";
import { registerElement } from "../../utils/register";

export type Variant = "default" | "backdrop";

export class AGSwitch extends Checkable {
  static styles = [Checkable.styles, switchStyles];
  @property({ reflect: true }) variant: Variant = "default";
  protected inputRole = "switch";
  protected render() {
    return html`${this.renderInput()}
      <label id="label" part="label" class="label"
        ><slot @slotchange=${() => this.requestUpdate()}></slot
      ></label>
      <div part="switch" class="switch" aria-hidden="true">
        <slot name="switch"><div class="indicator"></div></slot>
      </div>
      <span class="status-message" part="status-message" aria-hidden="true">
        <span class="checked-message" part="checked-message"
          ><slot name="checked-message"></slot
        ></span>
        <span class="unchecked-message" part="unchecked-message"
          ><slot name="unchecked-message"></slot
        ></span>
      </span>`;
  }
}
export const agSwitch = () => registerElement("ag-switch", AGSwitch);
agSwitch();
declare global {
  interface HTMLElementTagNameMap {
    "ag-switch": AGSwitch;
  }
}
