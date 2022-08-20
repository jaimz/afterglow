import { attr } from "@microsoft/fast-element";
import {
  ButtonOptions,
  Button as FoundationButton,
  buttonTemplate as template,
} from "@microsoft/fast-foundation";
import { buttonStyles as styles } from "./button.styles";

/**
 * Button variants.
 * @public
 */
export type Variant = "default" | "flat" | "primary" | "outline" | "fab";

export class Button extends FoundationButton {
  /**
   * The variant of this button
   *
   * @public
   */
  // @ts-ignore
  @attr public variant: Variant;
  // @ts-ignore
  @attr public dangerous: boolean;

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

  public attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string
  ): void {
    if (name === "aria-label") {
      this.ariaLabel = newValue;
    }

    if (name === "disabled") {
      this.disabled = newValue !== null;
    }
  }
}

export const agButton = Button.compose<ButtonOptions, typeof Button>({
  baseName: "button",
  template,
  styles,
  shadowOptions: {
    delegatesFocus: true,
  },
});
