import {
  CheckboxOptions,
  Checkbox as FoundationCheckbox,
  checkboxTemplate as template,
} from "@microsoft/fast-foundation";
import { attr } from "@microsoft/fast-element";
import { checkboxStyles as styles } from "./checkbox.styles";

export type Variant = "default" | "filled" | "backdrop";

export class AGCheckbox extends FoundationCheckbox {
  // @ts-ignore
  @attr public variant: Variant;

  public connectedCallback() {
    super.connectedCallback();

    if (!this.variant) {
      const variantValue = this.getAttribute("variant");
      this.variant = variantValue as Variant;
    }

    if (this.textContent) {
      this.setAttribute("aria-label", this.textContent);
    } else {
      this.setAttribute("aria-lab xel", "Checkbox");
    }
  }
}

export const agCheckbox = AGCheckbox.compose<
  CheckboxOptions,
  typeof AGCheckbox
>({
  baseName: "checkbox",
  template,
  styles,
  checkedIndicator: `
    <svg 
      part="checked-indicator"
      class="checked-indicator"
      width="14" 
      height="10" 
      viewBox="0 0 14 10" 
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"       
    >
        <path 
            d="M13 1L4.75 9L1 5.36364" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
    </svg>
`,
  indeterminateIndicator: `
    <div part="indeterminate-indicator" class="indeterminate-indicator"></div>
  `,
});
