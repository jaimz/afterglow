import { enhanceControls } from "../../../main";
import {
  checkableMarkup,
  element,
  escapeHTML,
  track,
} from "../../../stories/fixtures";
export interface RadioGroupArgs {
  label: string;
  orientation: string;
  childCount: number;
  isDisabled: boolean;
  isReadOnly: boolean;
}
let nextGroup = 0;
export function createRadioGroup({
  label,
  orientation = "horizontal",
  childCount = 3,
  isDisabled,
  isReadOnly,
}: RadioGroupArgs) {
  const name = `choice-${++nextGroup}`;
  const root =
    element(`<fieldset class="ag-radio-group" data-orientation="${escapeHTML(
      orientation.toLowerCase()
    )}" ${isDisabled ? "disabled" : ""} ${isReadOnly ? "data-readonly" : ""}>
    <legend>${escapeHTML(
      label
    )}</legend><div class="ag-radio-group__options">${Array.from(
      { length: Math.max(0, Math.min(100, childCount)) },
      (_, index) =>
        checkableMarkup("radio", {
          name,
          label: "Radio Label",
          value: `option-${index + 1}`,
        })
    ).join("")}</div></fieldset>`);
  track(enhanceControls(root));
  return root;
}
