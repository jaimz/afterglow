import {
  RadioGroup,
  radioGroupTemplate as template,
} from "@microsoft/fast-foundation";
import { radioGroupStyles as styles } from "./radio-group.styles";

export class AGRadioGroup extends RadioGroup {
  public connectedCallback() {
    super.connectedCallback();

    const label = this.querySelector("label");
    if (label) {
      const id = `radio-group-${Math.random().toString(16).slice(2)}`;

      label.setAttribute("id", id);
      this.setAttribute("aria-labelledby", id);
    }
  }
}

export const agRadioGroup = AGRadioGroup.compose({
  baseName: "radio-group",
  template,
  styles,
});
