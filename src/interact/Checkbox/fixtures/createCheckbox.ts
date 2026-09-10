import { createCheckable, ControlArgs } from "../../../stories/fixtures";
export type CheckboxArgs = ControlArgs;
export const createCheckbox = (args: CheckboxArgs) =>
  createCheckable("checkbox", args);
