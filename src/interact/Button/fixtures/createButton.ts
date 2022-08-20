import { Button, Variant } from "../index";

export type ButtonArgs = {
  label: string;
  variant: Variant;
  isDangerous: boolean;
  isDisabled: boolean;
  isAutoFocussed: boolean;
  ariaLabel: string;
  onClick: any;
};

export function createButton({
  label,
  variant,
  onClick,
  isDisabled,
  isAutoFocussed,
  isDangerous,
}: ButtonArgs) {
  const button = new Button();

  button.textContent = label;
  button.setAttribute("variant", variant);

  if (isDisabled) button.setAttribute("disabled", "");
  if (isAutoFocussed) button.setAttribute("autofocus", "");
  if (isDangerous) button.setAttribute("dangerous", "true");

  button.addEventListener("click", onClick);

  return button;
}
