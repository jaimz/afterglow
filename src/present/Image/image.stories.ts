import { enhanceImage } from "../../main";
import { element, escapeHTML, track } from "../../stories/fixtures";
import landscape from "./assets/landscape.png";
import portrait from "../Avatar/assets/leaf.jpg";

interface ImageArgs {
  imageUrl?: string;
  alt?: string;
  title?: string;
  overlineText?: string;
  backlight?: boolean;
}

/** Render native image content and let the helper mirror the loaded URL. */
function createImage(
  {
    imageUrl = "",
    alt = "",
    title = "",
    overlineText = "",
    backlight = true,
  }: ImageArgs,
  enhance = true
) {
  title = title.trim();
  overlineText = overlineText.trim();
  const root = element(`<figure class="ag-image" ${
    backlight ? "data-backlight" : ""
  }>
    <img class="ag-image__picture" ${
      imageUrl.trim() ? `src="${escapeHTML(imageUrl.trim())}"` : ""
    } alt="${escapeHTML(alt)}">
    ${
      title || overlineText
        ? `<figcaption class="ag-image__caption">
      ${
        overlineText
          ? `<p class="ag-image__overline">${escapeHTML(overlineText)}</p>`
          : ""
      }
      ${title ? `<h3 class="ag-image__title">${escapeHTML(title)}</h3>` : ""}
    </figcaption>`
        : ""
    }
  </figure>`);
  const controller = enhance ? track(enhanceImage(root)) : undefined;
  return { root, controller };
}

const example: ImageArgs = {
  imageUrl: landscape,
  alt: "A quiet lake reflecting trees under a cloudy evening sky.",
  title: "Canada",
  overlineText: "Vancouver",
  backlight: true,
};

export default {
  title: "Present/Image",
  render: (args: ImageArgs) => {
    const section = element('<section style="padding:40px"></section>');
    section.append(createImage(args).root);
    return section;
  },
  args: example,
  argTypes: {
    imageUrl: {
      control: "text",
      description: "Image URL; the backlight follows the loaded image.",
    },
    alt: {
      control: "text",
      description:
        "Alternative text describing the image; empty for a decorative image.",
    },
    title: { control: "text", description: "Clear to omit the title." },
    overlineText: {
      control: "text",
      description: "Clear to omit the overline.",
    },
    backlight: { control: "boolean" },
  },
};

export const Default = {};
export const WithoutBacklight = { args: { backlight: false } };
export const ImageOnly = { args: { title: "", overlineText: "" } };
export const TitleOnly = { args: { overlineText: "" } };
export const OverlineOnly = { args: { title: "" } };

export const Layouts = {
  render: () => {
    const section = element(
      '<section style="display:flex;flex-wrap:wrap;align-items:start;gap:48px;padding:40px"></section>'
    );
    section.append(createImage(example).root);
    const narrow = createImage({
      ...example,
      title: "A peaceful evening",
      overlineText: "By the water",
    }).root;
    narrow.style.width = "240px";
    narrow.style.setProperty("--image-aspect-ratio", "1");
    const tall = createImage({
      imageUrl: portrait,
      alt: "Portrait of a woman.",
      title: "Portrait",
      overlineText: "People",
    }).root;
    tall.style.width = "200px";
    tall.style.setProperty("--image-aspect-ratio", "3 / 4");
    const rtl = createImage({
      ...example,
      title: "كندا",
      overlineText: "فانكوفر",
    }).root;
    rtl.dir = "rtl";
    section.append(narrow, tall, rtl);
    return section;
  },
  parameters: { controls: { disable: true } },
};

export const LiveUpdates = {
  render: () => {
    const section =
      element(`<section class="ag-body" style="padding:40px;display:grid;gap:40px">
      <div class="photo"></div>
      <form style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">
        <label>Image URL <input name="imageUrl" type="text" autocomplete="off" aria-label="Image URL" style="width:260px;max-width:100%" value="${escapeHTML(
          landscape
        )}"></label>
        <button class="ag-button" type="submit">Load image</button>
        <button class="ag-button change" type="button">Use portrait</button>
        <button class="ag-button clear" type="button">Clear image</button>
        <label><input type="checkbox" name="backlight" checked> Backlight</label>
      </form>
    </section>`);
    const photo = createImage({
      ...example,
      title: "",
      overlineText: "",
      alt: "Selected image preview.",
    });
    section.querySelector(".photo")!.append(photo.root);
    const urlInput =
      section.querySelector<HTMLInputElement>('[name="imageUrl"]')!;
    section.querySelector("form")!.onsubmit = (event) => {
      event.preventDefault();
      photo.controller!.imageUrl = urlInput.value;
    };
    section.querySelector<HTMLButtonElement>(".change")!.onclick = () => {
      urlInput.value = portrait;
      photo.controller!.imageUrl = portrait;
    };
    section.querySelector<HTMLButtonElement>(".clear")!.onclick = () => {
      urlInput.value = "";
      photo.controller!.imageUrl = "";
    };
    section.querySelector<HTMLInputElement>('[name="backlight"]')!.onchange = (
      event
    ) => {
      photo.controller!.backlight = (event.target as HTMLInputElement).checked;
    };
    return section;
  },
  parameters: { controls: { disable: true } },
};

export const NativeHTML = {
  render: () => {
    const section = element('<section style="padding:40px"></section>');
    const { root } = createImage(example, false);
    // With no helper, assign the same URL to both native images.
    const copy = document.createElement("img");
    copy.className = "ag-image__backlight";
    copy.src = landscape;
    copy.alt = "";
    copy.setAttribute("aria-hidden", "true");
    copy.draggable = false;
    root.prepend(copy);
    section.append(root);
    return section;
  },
  parameters: { controls: { disable: true } },
};
