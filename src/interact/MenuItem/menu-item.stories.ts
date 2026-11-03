import { action } from "@storybook/addon-actions";
import { element } from "../../stories/fixtures";
import {
  createMenuItem,
  menuItemContent,
  MenuItemArgs,
} from "./fixtures/createMenuItem";

let nextSubmenuId = 0;

/** Demonstrate popup navigation separately from an inline child disclosure. */
function render(args: MenuItemArgs) {
  const root = element(
    '<section class="ag-panel" style="padding:20px;width:280px;max-width:100%;box-sizing:border-box"></section>'
  );
  const button = createMenuItem(args);
  const row = element('<div style="position:relative"></div>');
  row.append(button);
  root.append(row);
  if (args.withChildMenu || args.withSubmenu) {
    const id = `menu-item-submenu-${++nextSubmenuId}`;
    const children =
      element(`<nav id="${id}" aria-label="Shared documents" hidden>
      <a class="ag-menu-item" href="#recent">${menuItemContent({
        label: "Recent documents",
        icon: "clock",
      })}</a>
      <a class="ag-menu-item" href="#all">${menuItemContent({
        label: "All documents",
        icon: "folder",
      })}</a>
    </nav>`);
    button.setAttribute("aria-controls", id);
    button.setAttribute("aria-expanded", "false");
    const setOpen = (open: boolean) => {
      if (button.disabled) return;
      children.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    };
    button.addEventListener("click", () =>
      setOpen(args.withChildMenu ? children.hidden : true)
    );
    if (args.withChildMenu) {
      children.style.paddingInlineStart = "24px";
      row.append(children);
    } else {
      children.className = "ag-panel";
      children.style.cssText =
        "position:absolute;inset-inline-start:100%;top:0;width:240px;padding:8px;box-sizing:border-box;z-index:1";
      row.append(children);
      row.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") setOpen(true);
      });
      row.addEventListener("pointerleave", () => {
        if (!row.contains(document.activeElement)) setOpen(false);
      });
      row.addEventListener("focusout", (event) => {
        if (!row.contains(event.relatedTarget as Node | null)) setOpen(false);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setOpen(true);
          children.querySelector("a")?.focus();
        }
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !children.hidden) {
          event.preventDefault();
          setOpen(false);
          button.focus();
        }
      });
    }
  }
  button.addEventListener("click", action("clicked"));
  return root;
}

export default {
  title: "Interact/Menu Item",
  render,
  args: {
    label: "Shared with me",
    icon: "users",
    isSelected: false,
    isDisabled: false,
    withSubmenu: true,
    withChildMenu: false,
  },
  argTypes: {
    label: { control: "text" },
    icon: {
      control: "text",
      description: "Feather icon name. Clear to omit the leading icon.",
    },
    isSelected: { control: "boolean" },
    isDisabled: { control: "boolean" },
    withChildMenu: {
      control: "boolean",
      description:
        "Show a trailing chevron for an inline child disclosure. Takes precedence over withSubmenu.",
    },
    withSubmenu: {
      control: "boolean",
      description:
        "Show a trailing chevron for a popup submenu (hover or activate in this story).",
    },
  },
};
export const Default = {};
export const ChildMenu = { args: { withChildMenu: true, withSubmenu: false } };
export const Selected = { args: { isSelected: true, icon: "star" } };
export const TextOnly = { args: { icon: "", withSubmenu: false } };
export const Disabled = { args: { isDisabled: true } };

export const States = () => {
  const root = element(
    '<section class="ag-panel" style="padding:20px;display:grid;gap:12px;width:280px;max-width:100%;box-sizing:border-box"></section>'
  );
  for (const args of [
    { label: "Shared with me", icon: "users", withSubmenu: true },
    {
      label: "Shared with me",
      icon: "star",
      isSelected: true,
      withSubmenu: true,
    },
    { label: "Create document", icon: "plus" },
    { label: "Text only", icon: "" },
    { label: "Unavailable action", icon: "lock", isDisabled: true },
  ])
    root.append(createMenuItem(args));
  return root;
};
States.parameters = { controls: { disable: true } };

export const InNavigation = () => {
  const root =
    element(`<nav class="ag-panel" aria-label="Documents" style="padding:8px;width:256px;max-width:100%;box-sizing:border-box">
    <ul class="ag-location-index__list" role="list">
      <li><a class="ag-menu-item" href="#shared" aria-current="page">${menuItemContent(
        { label: "Shared with me", icon: "users" }
      )}</a></li>
      <li><a class="ag-menu-item" href="#favourites">${menuItemContent({
        label: "Favourites",
        icon: "star",
      })}</a></li>
      <li><details><summary class="ag-menu-item">${menuItemContent({
        label: "Collections",
        icon: "folder",
        withChildMenu: true,
      })}</summary>
        <ul class="ag-location-index__list" role="list" style="padding-inline-start:24px">
          <li><a class="ag-menu-item" href="#research">${menuItemContent({
            label: "Research",
            icon: "",
          })}</a></li>
          <li><a class="ag-menu-item" href="#ideas">${menuItemContent({
            label: "Ideas",
            icon: "",
          })}</a></li>
        </ul>
      </details></li>
    </ul>
  </nav>`);
  root.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      root
        .querySelector('[aria-current="page"]')
        ?.removeAttribute("aria-current");
      link.setAttribute("aria-current", "page");
    })
  );
  return root;
};
InNavigation.parameters = { controls: { disable: true } };

export const Layouts = () => {
  const root = element(
    '<section class="ag-panel" style="display:grid;gap:24px;padding:24px"></section>'
  );
  const narrow = element('<div style="width:180px;max-width:100%"></div>');
  narrow.append(
    createMenuItem({
      label: "Documents shared with the whole research group",
      icon: "users",
      withSubmenu: true,
    })
  );
  const rtl = element(
    '<div dir="rtl" lang="ar" style="width:240px;max-width:100%"></div>'
  );
  rtl.append(
    createMenuItem({
      label: "المستندات المشتركة",
      icon: "users",
      withSubmenu: true,
      isSelected: true,
    })
  );
  root.append(narrow, rtl);
  return root;
};
Layouts.parameters = { controls: { disable: true } };
