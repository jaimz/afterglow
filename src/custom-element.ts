import { agButton } from "./interact/Button";
import { Container } from "@microsoft/fast-foundation";
import { agDialog } from "./frame/Dialog";
import { agCheckbox } from "./interact/Checkbox";
import { agRadio } from "./interact/Radio";
import { agRadioGroup } from "./interact/RadioGroup";

export { agButton };
export { agDialog };
export { agCheckbox };
export { agRadio };
export { agRadioGroup };

export const allComponents = {
  agButton,
  agDialog,
  agCheckbox,
  agRadio,
  agRadioGroup,
  register(container?: Container, ...rest: any[]) {
    if (!container) {
      return;
    }

    for (const key in this) {
      if (key === "register") continue;

      (this as any)[key]().register(container, ...rest);
    }
  },
};
