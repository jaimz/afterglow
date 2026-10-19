import { element, escapeHTML } from "../../stories/fixtures";

interface Crumb {
  label: string;
  href?: string;
  icon?: string;
}
interface BreadcrumbArgs {
  items: Crumb[];
  ariaLabel: string;
  variant: "default" | "backdrop";
}

const exampleItems: Crumb[] = [
  { label: "Home", href: "#home", icon: "home" },
  { label: "The Vikings", icon: "file-text" },
];

/** Render native links; the final crumb marks the current location. */
function createBreadcrumb({ items, ariaLabel, variant }: BreadcrumbArgs) {
  return element(`<nav class="ag-breadcrumb" aria-label="${escapeHTML(
    ariaLabel
  )}" data-variant="${variant}">
    <ol class="ag-breadcrumb__list" role="list">
      ${items
        .map((item, index) => {
          const current = index === items.length - 1;
          const tag = item.href ? "a" : "span";
          const icon = item.icon
            ? `<span class="ag-icon" data-icon="${escapeHTML(
                item.icon
              )}" aria-hidden="true"></span>`
            : "";
          return `<li class="ag-breadcrumb__item"><${tag} class="ag-breadcrumb__link" ${
            item.href ? `href="${escapeHTML(item.href)}"` : ""
          } ${current ? 'aria-current="page"' : ""}>
          ${icon}<span class="ag-breadcrumb__label">${escapeHTML(
            item.label
          )}</span>
        </${tag}></li>`;
        })
        .join("")}
    </ol>
  </nav>`);
}

/** Place the transparent breadcrumb on the appropriate sample surface. */
function render(args: BreadcrumbArgs) {
  const root = element(
    `<section class="${
      args.variant === "backdrop" ? "ag-background" : "ag-panel"
    }" style="height:auto;padding:24px"></section>`
  );
  root.append(createBreadcrumb(args));
  return root;
}

export default {
  title: "Interact/Breadcrumb",
  render,
  args: { items: exampleItems, ariaLabel: "Breadcrumb", variant: "default" },
  argTypes: {
    items: {
      control: "object",
      description:
        "Ordered crumbs: label, optional href, and optional Feather icon name. The final item is current.",
    },
    ariaLabel: { control: "text" },
    variant: { control: "select", options: ["default", "backdrop"] },
  },
};

export const Default = {};
export const TextOnly = {
  args: { items: exampleItems.map(({ label, href }) => ({ label, href })) },
};
export const WithIcons = {
  args: {
    items: [
      { label: "Home", href: "#home", icon: "home" },
      { label: "Library", href: "#library", icon: "book-open" },
      { label: "The Vikings", icon: "file-text" },
    ],
  },
};
export const Backdrop = { args: { ...WithIcons.args, variant: "backdrop" } };
export const SingleCrumb = {
  args: { items: [{ label: "Home", icon: "home" }] },
};

export const Layouts = () => {
  const root = element(
    `<section class="ag-panel" style="padding:24px;display:grid;gap:24px"></section>`
  );
  const narrow = element(`<div style="width:220px;max-width:100%"></div>`);
  narrow.append(
    createBreadcrumb({
      ariaLabel: "Long path",
      variant: "default",
      items: [
        { label: "Home", href: "#home", icon: "home" },
        { label: "Teaching resources", href: "#resources" },
        {
          label: "Scandinavian history and the voyages of the Vikings",
          icon: "book-open",
        },
      ],
    })
  );
  const rtl = element(`<div dir="rtl" lang="ar"></div>`);
  rtl.append(
    createBreadcrumb({
      ariaLabel: "مسار التنقل",
      variant: "default",
      items: [
        { label: "الرئيسية", href: "#home", icon: "home" },
        { label: "المكتبة", href: "#library" },
        { label: "التاريخ", icon: "book-open" },
      ],
    })
  );
  root.append(narrow, rtl);
  return root;
};
Layouts.parameters = { controls: { disable: true } };
