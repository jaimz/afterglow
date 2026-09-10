import { createCheckable, ControlArgs } from "../../../stories/fixtures";
export type RadioArgs = ControlArgs;
export const createRadio = (args: RadioArgs) => createCheckable("radio", args);
