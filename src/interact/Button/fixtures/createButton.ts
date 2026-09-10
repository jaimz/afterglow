export interface ButtonArgs {
  label?: string;
  variant?: string;
  isDangerous?: boolean;
  isDisabled?: boolean;
  isAutoFocused?: boolean;
  ariaLabel?: string;
  onClick?: EventListener;
}
export function createButton({
  label = "Button Text",
  variant = "default",
  onClick,
  isDisabled,
  isAutoFocused,
  isDangerous,
  ariaLabel,
}: ButtonArgs) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ag-button";
  button.textContent = label;
  button.dataset.variant = variant;
  button.disabled = !!isDisabled;
  button.autofocus = !!isAutoFocused;
  if (isDangerous) button.dataset.dangerous = "";
  if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
  if (onClick) button.addEventListener("click", onClick);
  return button;
}
