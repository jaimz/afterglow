import { agButton } from "./interact/Button";
import { Container } from "@microsoft/fast-foundation";
import { agDialog } from "./frame/Dialog";

export { agButton };
export { agDialog };

export const allComponents = {
  agButton,
  agDialog,
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
