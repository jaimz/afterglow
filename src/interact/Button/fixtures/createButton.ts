import { Button, Variant } from "../index";

export type ButtonArgs = {
  label: string;
  variant: Variant;
  isDangerous: boolean;
  isDisabled: boolean;
  isAutoFocused: boolean;
  ariaLabel: string;
  onClick: any;
};

export function createButton({
  label,
  variant,
  onClick,
  isDisabled,
  isAutoFocused,
  isDangerous,
  ariaLabel,
}: ButtonArgs) {
  const button = new Button();

  button.textContent = label;
  if (ariaLabel) button.ariaLabel = ariaLabel;
  button.setAttribute("variant", variant);

  if (isDisabled) button.setAttribute("disabled", "");
  if (isAutoFocused) button.setAttribute("autofocus", "");
  if (isDangerous) button.setAttribute("dangerous", "true");

  button.addEventListener("click", onClick);

  return button;
}
