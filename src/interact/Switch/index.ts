import {
  Switch,
  SwitchOptions,
  switchTemplate as template,
} from "@microsoft/fast-foundation";

import { attr } from "@microsoft/fast-element";
import { switchStyles as styles } from "./switch.styles";

export type Variant = "default" | "backdrop";

export class AGSwitch extends Switch {
  // @ts-ignore
  @attr public variant: Variant;

  public connectedCallback() {
    super.connectedCallback();

    if (!this.variant) {
      const variantValue = this.getAttribute("variant");
      this.variant = variantValue as Variant;
    }
  }
}

export const agSwitch = AGSwitch.compose<SwitchOptions>({
  baseName: "switch",
  template,
  styles,
  switch: `
    <div class='indicator'></div>
  `,
});
