import { AGRadio, Variant } from "..";

export type RadioArgs = {
  variant: Variant;
  label: string;
  isChecked: string;
  isDisabled: boolean;
  isAutoFocused: boolean;
  isReadOnly: boolean;
  hasValue: boolean;
  onChange: any;
};

export function createRadio({
  variant = "default",
  label,
  isChecked,
  isDisabled,
  isAutoFocused,
  isReadOnly,
  hasValue,
  onChange,
}: RadioArgs) {
  const radio = new AGRadio();

  radio.setAttribute("variant", variant);
  label && (radio.textContent = label);
  isChecked && radio.setAttribute("checked", isChecked.toString());
  isDisabled && radio.setAttribute("disabled", "");
  isAutoFocused && radio.setAttribute("autofocused", "");
  isReadOnly && radio.setAttribute("readonly", "");
  hasValue && radio.setAttribute("value", "v");

  radio.addEventListener("change", onChange);

  return radio;
}
