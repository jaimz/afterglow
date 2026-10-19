import { element, escapeHTML } from "../../../stories/fixtures";

export interface MenuItemArgs {
  label?: string;
  icon?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  withSubmenu?: boolean;
  withChildMenu?: boolean;
}

/** Compose the shared content slots for buttons, links and native disclosures. */
export function menuItemContent({
  label = "Shared with me",
  icon = "users",
  withSubmenu = false,
  withChildMenu = false,
}: MenuItemArgs = {}) {
  return `${
    withChildMenu
      ? '<span class="ag-icon ag-menu-item__child-menu" data-icon="chevron-right" aria-hidden="true"></span>'
      : ""
  }${
    icon
      ? `<span class="ag-icon ag-menu-item__leader" data-icon="${escapeHTML(
          icon
        )}" aria-hidden="true"></span>`
      : ""
  }
    <span class="ag-menu-item__label">${escapeHTML(label)}</span>
    ${
      withSubmenu && !withChildMenu
        ? '<span class="ag-icon ag-menu-item__submenu" data-icon="chevron-right" aria-hidden="true"></span>'
        : ""
    }`;
}

/** Create a native action button. The caller supplies its click or submenu handler. */
export function createMenuItem(args: MenuItemArgs = {}) {
  const button = element(
    `<button type="button" class="ag-menu-item">${menuItemContent(
      args
    )}</button>`
  ) as HTMLButtonElement;
  button.disabled = !!args.isDisabled;
  button.toggleAttribute("data-selected", !!args.isSelected);
  return button;
}
