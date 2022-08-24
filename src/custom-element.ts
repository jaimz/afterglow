import { agButton } from "./interact/Button";
import { Container } from "@microsoft/fast-foundation";
import { agDialog } from "./frame/Dialog";
import { agCheckbox } from "./interact/Checkbox";

export { agButton };
export { agDialog };
export { agCheckbox };

export const allComponents = {
  agButton,
  agDialog,
  agCheckbox,
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
