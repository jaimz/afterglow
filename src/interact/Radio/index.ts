import {
  Radio,
  RadioOptions,
  radioTemplate as template,
} from "@microsoft/fast-foundation";
import { attr } from "@microsoft/fast-element";
import { radioStyles as styles } from "./radio.styles";

export type Variant = "default" | "backdrop";

export class AGRadio extends Radio {
  // @ts-ignore
  @attr public variant: Variant;

  constructor() {
    super();
  }

  public connectedCallback() {
    super.connectedCallback();

    if (!this.variant) {
      const variantValue = this.getAttribute("variant");
      this.variant = variantValue as Variant;
    }
  }
}

export const agRadio = AGRadio.compose<RadioOptions>({
  baseName: "radio",
  template,
  styles,
  checkedIndicator: `
    <div part="checked-indicator" class="checked-indicator"></div>
  `,
});
