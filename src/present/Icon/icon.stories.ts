import { element, escapeHTML } from "../../stories/fixtures";

const files = import.meta.glob("../../styles/assets/feather/*.svg");
const names = Object.keys(files)
  .map((path) =>
    path
      .split("/")
      .pop()!
      .replace(/\.svg$/, "")
  )
  .sort();

export default {
  title: "Present/Icon",
  args: { name: "feather", size: 24, color: "#007693" },
  argTypes: {
    name: { control: "select", options: names },
    size: { control: { type: "range", min: 12, max: 64, step: 4 } },
    color: { control: "color" },
  },
};

export const Default = ({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) => {
  const root = element(`<section class="ag-body" style="padding:32px">
    <span class="ag-icon" data-icon="${escapeHTML(
      name
    )}" role="img" aria-label="${escapeHTML(name)}"></span>
  </section>`);
  root.style.color = color;
  root.style.setProperty("--icon-size", `${size}px`);
  return root;
};

export const Gallery = () => {
  const root = element(`<section class="ag-body" style="padding:24px">
    <p><label>Search icons <input type="search" placeholder="e.g. arrow, file, user" style="font:inherit"></label></p>
    <p><output aria-live="polite"></output></p>
    <ul style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:0;list-style:none">
      ${names
        .map(
          (
            name
          ) => `<li class="ag-paper" data-icon-name="${name}" style="padding:16px;text-align:center;border-radius:8px">
        <span class="ag-icon" data-icon="${name}" aria-hidden="true"></span>
        <code style="display:block;margin-top:12px;font-size:12px;overflow-wrap:anywhere">${name}</code>
      </li>`
        )
        .join("")}
    </ul>
  </section>`);
  const items = [...root.querySelectorAll<HTMLElement>("[data-icon-name]")];
  const search = root.querySelector("input")!;
  const filter = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const item of items) {
      item.hidden = !item.dataset.iconName!.includes(query);
      if (!item.hidden) visible++;
    }
    root.querySelector(
      "output"
    )!.textContent = `${visible} of ${names.length} icons`;
  };
  search.oninput = filter;
  filter();
  return root;
};
Gallery.parameters = { controls: { disable: true } };

export const Composition = () => {
  const root =
    element(`<section class="ag-body" style="padding:32px;display:grid;gap:32px">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;--icon-size:20px">
      <button type="button" class="ag-button" data-variant="primary"><span class="ag-icon ag-button__start" data-icon="save" aria-hidden="true"></span>Save</button>
      <button type="button" class="ag-button" data-variant="outline">Continue<span class="ag-icon ag-button__end" data-icon="arrow-right" aria-hidden="true"></span></button>
      <button type="button" class="ag-button" aria-label="Search"><span class="ag-icon" data-icon="search" aria-hidden="true"></span></button>
      <button type="button" class="ag-button" data-dangerous><span class="ag-icon ag-button__start" data-icon="trash-2" aria-hidden="true"></span>Delete</button>
      <button type="button" class="ag-button" disabled><span class="ag-icon ag-button__start" data-icon="download" aria-hidden="true"></span>Download</button>
      <button type="button" class="ag-fab" aria-label="Add note"><span class="ag-icon" data-icon="plus" aria-hidden="true" style="--icon-size:24px"></span></button>
    </div>
    <nav class="ag-location-index" aria-label="Example navigation" style="max-width:320px;--icon-size:16px">
      <ul class="ag-location-index__list">
        <li><a class="ag-location-index__link" href="#icon-files" aria-current="page"><span class="ag-icon" data-icon="folder" aria-hidden="true"></span>Files</a></li>
        <li><a class="ag-location-index__link" href="#icon-team"><span class="ag-icon" data-icon="users" aria-hidden="true"></span>Team</a></li>
      </ul>
    </nav>
    <p class="ag-caption" style="margin:0;--icon-size:1em"><span class="ag-icon" data-icon="clock" aria-hidden="true"></span> Updated a moment ago</p>
    <p><output aria-live="polite">Choose an action.</output></p>
  </section>`);
  root.querySelectorAll("button").forEach((button) => {
    button.onclick = () => {
      root.querySelector("output")!.textContent = `${
        button.getAttribute("aria-label") || button.textContent!.trim()
      } activated.`;
    };
  });
  return root;
};
Composition.parameters = { controls: { disable: true } };

export const SizesAndColours = () =>
  element(`<section class="ag-body" style="padding:32px;display:grid;gap:32px">
  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    ${[16, 20, 24, 32, 48]
      .map(
        (size) =>
          `<div style="text-align:center"><span class="ag-icon" data-icon="feather" aria-hidden="true" style="--icon-size:${size}px"></span><p class="ag-caption">${size}px</p></div>`
      )
      .join("")}
  </div>
  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <span style="color:var(--ctrlText)"><span class="ag-icon" data-icon="info" aria-hidden="true"></span> Information</span>
    <span style="color:var(--error)"><span class="ag-icon" data-icon="alert-circle" aria-hidden="true"></span> Error</span>
    <span class="ag-background" style="padding:16px"><span class="ag-icon" data-icon="moon" aria-hidden="true"></span> On a backdrop</span>
  </div>
</section>`);
SizesAndColours.parameters = { controls: { disable: true } };
