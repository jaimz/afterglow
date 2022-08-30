import { AGSwitch, Variant } from "..";

export type SwitchArgs = {
  variant: Variant;
  label: string;
  isChecked: string;
  isDisabled: boolean;
};

export function createSwitch({
  variant = "default",
  label,
  isChecked,
  isDisabled,
}: SwitchArgs) {
  const swtch = new AGSwitch();

  swtch.setAttribute("variant", variant);
  label && (swtch.textContent = label);
  isChecked && swtch.setAttribute("checked", isChecked);
  isDisabled && swtch.setAttribute("disabled", "");

  return swtch;
}
