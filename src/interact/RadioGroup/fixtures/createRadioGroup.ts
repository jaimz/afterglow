import { AGRadioGroup } from "../index";
import { AGRadio } from "../../Radio";

export type RadioGroupArgs = {
  label: string;
  orientation: string;
  childCount: number;
  isDisabled: boolean;
  isReadonly: boolean;
};

function createRadioGroupWithChildren(childCount: number) {
  const group = new AGRadioGroup();

  for (let i = 0; i < childCount; ++i) {
    const radio = new AGRadio();
    radio.textContent = "Radio Label";
    group.appendChild(radio);
  }

  return group;
}

export function createRadioGroup({
  label,
  orientation,
  childCount,
  isDisabled,
  isReadonly,
}: RadioGroupArgs) {
  const group = createRadioGroupWithChildren(childCount);

  if (label) {
    const labelElement = document.createElement("label");
    labelElement.setAttribute("slot", "label");
    labelElement.textContent = label;
    group.prepend(labelElement);
  }

  orientation && group.setAttribute("orientation", orientation.toLowerCase());
  isDisabled && group.setAttribute("disabled", "");
  isReadonly && group.setAttribute("readonly", "");

  return group;
}
