import { AGCheckbox, Variant } from "../index";

export type CheckboxArgs = {
  variant: Variant;
  label: string;
  isChecked: string;
  isIndeterminate: boolean;
  isDisabled: boolean;
  isAutoFocused: boolean;
  isReadOnly: boolean;
  hasValue: boolean;
  onChange: any;
};

export function createCheckbox({
  variant = "default",
  label,
  isChecked,
  isIndeterminate,
  isDisabled,
  isAutoFocused,
  isReadOnly,
  hasValue,
  onChange,
}: CheckboxArgs) {
  const checkbox = new AGCheckbox();

  checkbox.setAttribute("variant", variant);
  label && (checkbox.textContent = label);
  isChecked && checkbox.setAttribute("checked", isChecked.toString());
  isIndeterminate && (checkbox.indeterminate = isIndeterminate);
  isDisabled && checkbox.setAttribute("disabled", "");
  isAutoFocused && checkbox.setAttribute("autofocused", "");
  isReadOnly && checkbox.setAttribute("readonly", "");
  hasValue && checkbox.setAttribute("value", "v");

  checkbox.addEventListener("change", onChange);

  return checkbox;
}
