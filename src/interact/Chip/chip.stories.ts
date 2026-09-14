import { ChipArgs, ChipVariant, createChip } from "./fixtures/createChip";
import { element } from "../../stories/fixtures";
import portrait from "../../present/Avatar/assets/circle.jpg";
import customIcon from "../../styles/assets/feather/compass.svg";

const variants: ChipVariant[] = [
  "default",
  "outlined",
  "avatar",
  "avatar-outlined",
  "backdrop",
];
const icons = Object.keys(import.meta.glob("../../styles/assets/feather/*.svg"))
  .map((path) =>
    path
      .split("/")
      .pop()!
      .replace(/\.svg$/, "")
  )
  .sort();

export default {
  title: "Interact/Chip",
  args: {
    label: "Portland",
    variant: "default",
    icon: "map-pin",
    withIcon: true,
    avatarVariant: "image",
    name: "Sandra Adams",
    imageUrl: portrait,
    removable: true,
    isDisabled: false,
  },
  argTypes: {
    label: { control: "text" },
    variant: { control: "select", options: variants },
    withIcon: {
      control: "boolean",
      description:
        "Show the leading icon when an icon name is supplied. Avatar variants keep their avatar.",
    },
    icon: {
      // Empty object keys break shared metadata references in Storybook 6's
      // serializer. Map a named choice to the component's empty icon value.
      control: { type: "select", labels: { none: "None" } },
      options: ["none", ...icons],
      mapping: { none: "" },
      description:
        "Optional leading Feather icon. Choose None for text only; unused in avatar variants.",
    },
    avatarVariant: {
      control: "select",
      options: ["image", "initials", "flat-initials", "blank"],
    },
    name: {
      control: "text",
      description: "Name used for avatar initials and photo fallback.",
    },
    imageUrl: {
      control: "text",
      description: "Photo URL for avatar variants.",
    },
    removable: { control: "boolean" },
    isDisabled: {
      control: "boolean",
      description: "Disable the remove button.",
    },
  },
};

export const Default = (args: ChipArgs) => {
  const root = element(`<section class="ag-body" style="padding:32px">
    <div data-preview style="min-height:40px"></div>
    <p><output aria-live="polite"></output></p>
    <button class="ag-button" type="button" hidden>Restore chip</button>
  </section>`);
  const slot = root.querySelector("[data-preview]")!;
  const restore = root.querySelector("button")!;
  const chip = createChip({
    ...args,
    onRemove: (chip) => {
      chip.hidden = true;
      root.querySelector("output")!.textContent = `${args.label} removed.`;
      restore.hidden = false;
      restore.focus();
    },
  });
  slot.append(chip);
  restore.onclick = () => {
    chip.hidden = false;
    root.querySelector("output")!.textContent = "";
    chip.querySelector("button")?.focus();
    restore.hidden = true;
  };
  return root;
};

export const TextOnly = (args: ChipArgs) => Default(args);
TextOnly.args = { variant: "default", withIcon: false, label: "Design" };

export const Variants = () => {
  const root = element(
    '<section class="ag-body" style="padding:32px;display:grid;gap:24px"></section>'
  );
  for (const variant of variants) {
    const row =
      element(`<div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center">
      <span style="width:140px">${variant}</span>
    </div>`);
    const chip = createChip({
      variant,
      icon: "map-pin",
      label: variant.startsWith("avatar") ? "Sandra" : "Portland",
      imageUrl: portrait,
    });
    chip.style.width = "199px";
    row.append(chip);
    if (!variant.startsWith("avatar")) {
      const textChip = createChip({ variant, label: "Portland" });
      textChip.style.width = "199px";
      row.append(textChip);
    }
    root.append(row);
  }
  return root;
};
Variants.parameters = { controls: { disable: true } };

export const IconsAndAvatars = () => {
  const root = element(
    '<section class="ag-body" style="padding:32px;display:flex;flex-wrap:wrap;gap:16px;align-items:center"></section>'
  );
  for (const [label, icon] of [
    ["Travel", "compass"],
    ["Favourite", "heart"],
    ["Documents", "file-text"],
  ]) {
    root.append(createChip({ label, icon, variant: "outlined" }));
  }
  const custom = createChip({
    label: "Custom image",
    variant: "outlined",
    icon: "compass",
  });
  const img = document.createElement("img");
  img.src = customIcon;
  img.alt = "";
  img.className = "ag-chip__icon";
  custom.querySelector(".ag-chip__icon")!.replaceWith(img);
  root.append(custom);
  for (const avatarVariant of [
    "image",
    "initials",
    "flat-initials",
    "blank",
  ] as const) {
    root.append(
      createChip({
        label: "Sandra Adams",
        variant: "avatar",
        avatarVariant,
        imageUrl: portrait,
      })
    );
  }
  return root;
};
IconsAndAvatars.parameters = { controls: { disable: true } };

export const StatesAndLayouts = () => {
  const root =
    element(`<section class="ag-body" style="padding:32px;display:grid;gap:24px">
    <div data-disabled></div>
    <div data-readonly></div>
    <div data-narrow style="width:180px;max-width:100%"></div>
    <div data-rtl dir="rtl"></div>
  </section>`);
  root
    .querySelector("[data-disabled]")!
    .append(
      createChip({ label: "Cannot remove", icon: "map-pin", isDisabled: true })
    );
  root
    .querySelector("[data-readonly]")!
    .append(createChip({ label: "Read only", icon: "tag", removable: false }));
  root.querySelector("[data-narrow]")!.append(
    createChip({
      label: "A very long location name in a narrow view",
      icon: "map-pin",
      variant: "outlined",
    })
  );
  root
    .querySelector("[data-rtl]")!
    .append(
      createChip({ label: "القاهرة", icon: "map-pin", variant: "outlined" })
    );
  return root;
};
StatesAndLayouts.parameters = { controls: { disable: true } };
