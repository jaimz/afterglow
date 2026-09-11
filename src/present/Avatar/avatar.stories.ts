import { enhanceAvatar } from "../../main";
import { element, escapeHTML, track } from "../../stories/fixtures";
import leaf from "./assets/leaf.jpg";
import circle from "./assets/circle.jpg";
import square from "./assets/square.jpg";

const portraits = { leaf, circle, square };
type Shape = keyof typeof portraits;
type Variant = "image" | "initials" | "flat-initials" | "blank";
type Size = "default" | "header" | "large";

const markup = (
  variant: Variant,
  size: Size,
  shape: Shape,
  name = "James O’Toole",
  imageUrl = ""
) =>
  `<span class="ag-avatar" data-variant="${variant}" data-size="${size}" data-shape="${shape}" data-name="${escapeHTML(
    name
  )}">
    ${
      variant === "image" && imageUrl
        ? `<img class="ag-avatar__image" src="${escapeHTML(imageUrl)}" alt="">`
        : ""
    }
  </span>`;

export default {
  title: "Present/Avatar",
  args: {
    name: "James O’Toole",
    imageUrl: leaf,
    variant: "initials",
    size: "default",
    shape: "leaf",
  },
  argTypes: {
    name: {
      control: "text",
      description: "The user's name; the helper derives the initials.",
    },
    imageUrl: {
      control: "text",
      description:
        "Photo URL for the image variant; clear it to show the fallback.",
    },
    variant: {
      control: "select",
      options: ["image", "initials", "flat-initials", "blank"],
    },
    size: { control: "select", options: ["default", "header", "large"] },
    shape: { control: "select", options: ["leaf", "circle", "square"] },
  },
};

export const Default = ({
  name,
  imageUrl,
  variant,
  size,
  shape,
}: {
  name: string;
  imageUrl: string;
  variant: Variant;
  size: Size;
  shape: Shape;
}) => {
  const root = element(`<section class="ag-body" style="padding:32px">
    ${markup(variant, size, shape, name)}
    <p><label>Full name <input name="name" value="${escapeHTML(
      name
    )}" style="font:inherit"></label></p>
    <p><label>Image URL <input name="imageUrl" type="url" value="${escapeHTML(
      imageUrl
    )}" style="font:inherit;width:min(480px,100%)"></label></p>
    <p><output></output></p>
  </section>`);
  const avatar = track(
    enhanceAvatar(root.querySelector<HTMLElement>(".ag-avatar")!, { imageUrl })
  );
  const report = () => {
    root.querySelector("output")!.textContent = `Initials: ${
      avatar.initials || "(blank avatar)"
    }`;
  };
  root.querySelector<HTMLInputElement>('input[name="name"]')!.oninput = (
    event
  ) => {
    avatar.name = (event.target as HTMLInputElement).value;
    report();
  };
  root.querySelector<HTMLInputElement>('input[name="imageUrl"]')!.onchange = (
    event
  ) => {
    avatar.imageUrl = (event.target as HTMLInputElement).value;
  };
  report();
  return root;
};

export const Variants = () => {
  const rows: Array<[string, Variant, Shape]> = [
    ["Leaf photo", "image", "leaf"],
    ["Initials", "initials", "leaf"],
    ["Blank", "blank", "leaf"],
    ["Circular photo", "image", "circle"],
    ["Square photo", "image", "square"],
    ["Flat initials", "flat-initials", "leaf"],
  ];
  const root =
    element(`<section class="ag-body ag-panel" style="display:grid;gap:32px;padding:32px;width:max-content;max-width:100%;box-sizing:border-box">
    ${rows
      .map(
        ([
          label,
          variant,
          shape,
        ]) => `<div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
      <span style="width:120px">${label}</span>
      ${(["default", "header", "large"] as Size[])
        .map((size) =>
          markup(variant, size, shape, "James O’Toole", portraits[shape])
        )
        .join("")}
    </div>`
      )
      .join("")}
  </section>`);
  root
    .querySelectorAll<HTMLElement>(".ag-avatar")
    .forEach((avatar) => track(enhanceAvatar(avatar)));
  return root;
};
Variants.parameters = { controls: { disable: true } };

export const Names = () => {
  const names = [
    "James O’Toole",
    "Ada Lovelace",
    "William Morris",
    "Dr. Mary Jane Watson, Ph.D.",
    "Prince",
    "Jean-Luc",
    "Álvaro Núñez",
    "王 小明",
    "علي حسن",
    "",
  ];
  const root =
    element(`<section class="ag-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:32px;padding:32px">
    ${names
      .map(
        (name) =>
          `<div style="display:flex;align-items:center;gap:16px">${markup(
            "initials",
            "header",
            "leaf",
            name
          )}<span>${escapeHTML(name || "Unknown user")}</span></div>`
      )
      .join("")}
  </section>`);
  root
    .querySelectorAll<HTMLElement>(".ag-avatar")
    .forEach((avatar) => track(enhanceAvatar(avatar)));
  return root;
};
Names.parameters = { controls: { disable: true } };

export const ImageFallback = () => {
  const root =
    element(`<section class="ag-body" style="padding:32px;display:flex;gap:24px;align-items:center">
    <span class="ag-avatar" data-variant="image" data-size="large"></span>
    <button type="button" class="ag-button">Load photo</button>
    <button type="button" class="ag-button">Clear photo</button>
  </section>`);
  const avatar = track(
    enhanceAvatar(root.querySelector<HTMLElement>(".ag-avatar")!, {
      name: "James O’Toole",
    })
  );
  const buttons = root.querySelectorAll("button");
  buttons[0].onclick = () => {
    avatar.imageUrl = leaf;
  };
  buttons[1].onclick = () => {
    avatar.imageUrl = "";
  };
  return root;
};
ImageFallback.parameters = { controls: { disable: true } };

const nativeMarkup = `<span class="ag-avatar" data-variant="initials" data-initial-count="2" role="img" aria-label="James O’Toole">
  <span class="ag-avatar__initials" aria-hidden="true">jo</span>
</span>`;
export const HTMLOnly = () =>
  element(`<section style="padding:32px">${nativeMarkup}</section>`);
HTMLOnly.parameters = {
  controls: { disable: true },
  docs: { source: { code: nativeMarkup } },
};
