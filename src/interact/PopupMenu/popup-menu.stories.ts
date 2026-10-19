import { enhancePopupMenu, type PopupMenuOptions } from "../../main";
import { element, escapeHTML, track } from "../../stories/fixtures";
import { menuItemContent } from "../MenuItem/fixtures/createMenuItem";

let nextExample = 0;
interface MenuArgs {
  label: string;
  placement: PopupMenuOptions["placement"];
  closeOnSelect: boolean;
  isDisabled: boolean;
}
const defaults: MenuArgs = {
  label: "Document actions",
  placement: "bottom-start",
  closeOnSelect: true,
  isDisabled: false,
};
const action = (label: string, icon: string, extra = "") =>
  `<button type="button" class="ag-menu-item" ${extra}>${menuItemContent({
    label,
    icon,
  })}</button>`;

/** Build each example with unique IDs, shared menu items and a disposable helper. */
function example(
  args = defaults,
  content = `${action("Open", "folder")}${action("Duplicate", "copy")}${action(
    "Rename…",
    "edit-2"
  )}<hr class="ag-popup-menu__separator" role="separator">${action(
    "Archive",
    "archive"
  )}${action("Delete", "trash-2", "disabled")}`
) {
  const id = `popup-example-${++nextExample}`;
  const root =
    element(`<div style="padding:32px;min-height:380px;box-sizing:border-box">
    <button type="button" class="ag-button" popovertarget="${id}" ${
      args.isDisabled ? "disabled" : ""
    }>${escapeHTML(args.label)}</button>
    <div class="ag-popup-menu" popover="auto" id="${id}">${content}</div>
    <p class="ag-caption" role="status">Choose an action.</p>
    <button type="button" class="ag-button" data-variant="flat">Next control</button>
  </div>`);
  const trigger = root.querySelector("button")!;
  const menu = root.querySelector<HTMLElement>(".ag-popup-menu")!;
  const controller = track(
    enhancePopupMenu(menu, {
      trigger,
      placement: args.placement,
      closeOnSelect: args.closeOnSelect,
    })
  );
  menu.addEventListener("ag-menu-select", (event) => {
    const item = (event as CustomEvent<{ item: HTMLElement }>).detail.item;
    root.querySelector(
      '[role="status"]'
    )!.textContent = `${item.textContent?.trim()} chosen`;
  });
  return { root, trigger, menu, controller };
}
export default {
  title: "Interact/Popup Menu",
  render: (args: MenuArgs) => example(args).root,
  args: defaults,
  argTypes: {
    label: { control: "text" },
    placement: {
      control: "select",
      options: ["bottom-start", "bottom-end", "inline-end"],
    },
    closeOnSelect: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
};
export const Default = {};

export const Submenus = () => {
  const nestedId = `popup-submenu-${++nextExample}`;
  const { root, menu } = example(
    defaults,
    `${action("Open", "folder")}
    <button class="ag-menu-item" type="button" popovertarget="${nestedId}">${menuItemContent(
      { label: "Share", icon: "share-2", withSubmenu: true }
    )}</button>
    <div class="ag-popup-menu" popover="auto" id="${nestedId}">
      ${action("Copy link", "link")}${action("Email link", "mail")}
    </div>
    ${action("Archive", "archive")}`
  );
  track(
    enhancePopupMenu(menu.querySelector<HTMLElement>(".ag-popup-menu")!, {
      trigger: menu.querySelector<HTMLButtonElement>("[popovertarget]")!,
      placement: "inline-end",
      openOnHover: true,
    })
  );
  root.querySelector('[role="status"]')!.textContent =
    "Hover over Share, or use Right Arrow to enter its submenu and Left Arrow to return.";
  return root;
};
Submenus.parameters = { controls: { disable: true } };

export const Selection = () => {
  const { root, menu } = example(
    { ...defaults, label: "View options", closeOnSelect: false },
    action(
      "Show details",
      "list",
      'role="menuitemcheckbox" aria-checked="true"'
    ) +
      action(
        "Show icons",
        "image",
        'role="menuitemcheckbox" aria-checked="false"'
      )
  );
  menu.addEventListener("ag-menu-select", (event) => {
    const item = (event as CustomEvent).detail.item as HTMLElement;
    item.setAttribute(
      "aria-checked",
      String(item.getAttribute("aria-checked") !== "true")
    );
  });
  return root;
};
Selection.parameters = { controls: { disable: true } };

export const LongMenu = () =>
  example(
    { ...defaults, label: "Choose a document" },
    Array.from({ length: 25 }, (_, i) =>
      action(`Document ${i + 1}`, "file-text")
    ).join("")
  ).root;
LongMenu.parameters = { controls: { disable: true } };

export const Layouts = () => {
  const wrapper = element(
    '<div style="display:flex;flex-wrap:wrap;gap:24px;padding:24px"></div>'
  );
  const clipped = example({ ...defaults, label: "Menu in a clipped card" });
  clipped.root.className = "ag-card";
  clipped.root.style.cssText =
    "overflow:hidden;height:150px;width:300px;padding:24px;box-sizing:border-box";
  const rtl = example(
    { ...defaults, label: "إجراءات المستند" },
    action("فتح", "folder") + action("نسخ", "copy") + action("أرشفة", "archive")
  );
  rtl.root.dir = "rtl";
  rtl.root.lang = "ar";
  wrapper.append(clipped.root, rtl.root);
  return wrapper;
};
Layouts.parameters = { controls: { disable: true } };

export const NativePopover = () => {
  const id = `native-popup-${++nextExample}`;
  return element(`<div style="padding:32px;min-height:300px">
    <button class="ag-button" type="button" popovertarget="${id}">Browse sections</button>
    <nav id="${id}" class="ag-popup-menu" popover="auto" aria-label="Sections">
      <a class="ag-menu-item" href="#overview">${menuItemContent({
        label: "Overview",
        icon: "home",
      })}</a>
      <a class="ag-menu-item" href="#documents">${menuItemContent({
        label: "Documents",
        icon: "folder",
      })}</a>
    </nav>
    <p class="ag-caption">HTML and CSS only: native Tab navigation, outside-click and Escape dismissal. Menu arrow keys and close-on-selection require the helper.</p>
  </div>`);
};
NativePopover.parameters = { controls: { disable: true } };
