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

  public connectedCallback() {
    super.connectedCallback();

    if (!this.variant) {
      const variantValue = this.getAttribute("variant");
      this.variant = variantValue as Variant;
    }
  }
}

export const agRadio = Radio.compose<RadioOptions>({
  baseName: "radio",
  template,
  styles,
  checkedIndicator: `
    <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="7" />
    </svg>
  `,
});
