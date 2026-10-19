export interface ButtonArgs {
  label?: string;
  variant?: string;
  dangerous?: boolean;
  isDisabled?: boolean;
  isAutoFocused?: boolean;
  ariaLabel?: string;
  onClick?: EventListener;
}
/** Create a native button; dangerous marks an action as destructive. */
export function createButton({
  label = "Button Text",
  variant = "default",
  onClick,
  isDisabled,
  isAutoFocused,
  dangerous = false,
  ariaLabel,
}: ButtonArgs) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ag-button";
  button.textContent = label;
  button.dataset.variant = variant;
  button.disabled = !!isDisabled;
  button.autofocus = !!isAutoFocused;
  button.toggleAttribute("data-dangerous", dangerous);
  if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
  if (onClick) button.addEventListener("click", onClick);
  return button;
}
