import { createCheckable, ControlArgs } from "../../../stories/fixtures";
export type SwitchArgs = ControlArgs;
export const createSwitch = (args: SwitchArgs) =>
  createCheckable("switch", args);
