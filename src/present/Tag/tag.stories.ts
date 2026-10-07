import { element, escapeHTML } from "../../stories/fixtures";

interface TagArgs {
  label: string;
  variant: "default" | "backdrop";
}

/** Render a category annotation in either appearance. */
function tagMarkup({ label, variant = "default" }: Partial<TagArgs>) {
  return `<span class="ag-tag" data-variant="${variant}"><span class="ag-tag__label">${escapeHTML(
    label || ""
  )}</span></span>`;
}

export default {
  title: "Present/Tag",
  args: { label: "John", variant: "default" },
  argTypes: {
    label: { control: "text" },
    variant: { control: "select", options: ["default", "backdrop"] },
  },
};

export const Default = (args: TagArgs) =>
  element(
    `<section class="ag-body ${
      args.variant === "backdrop" ? "ag-background" : "ag-panel"
    }" style="padding:32px">${tagMarkup(args)}</section>`
  );

export const Variants = () =>
  element(`<section class="ag-body" style="display:flex;flex-wrap:wrap;gap:24px">
    <div class="ag-panel" style="padding:24px">${tagMarkup({
      label: "John",
    })}</div>
    <div class="ag-background" style="padding:24px">${tagMarkup({
      label: "John",
      variant: "backdrop",
    })}</div>
  </section>`);

export const Annotations = () =>
  element(`<article class="ag-article ag-paper" style="max-width:600px">
  <h3>Notes from the workshop</h3>
  <p>A few ideas to explore in the next iteration.</p>
  <div role="group" aria-label="Categories" style="display:flex;flex-wrap:wrap;gap:8px">
    ${["Design", "Research", "Next steps"]
      .map((label) => tagMarkup({ label }))
      .join("")}
  </div>
</article>`);

export const FilterField = () => {
  // Tags and the editable input are siblings in the existing field control.
  // HTML inputs cannot contain tags; hidden inputs supply the applied filter values.
  const form =
    element(`<form class="ag-body ag-panel" style="padding:24px;max-width:600px">
    <label for="tag-search">Search notes</label>
    <div class="ag-text-field" style="--text-field-width:100%;margin-block:8px">
      <div class="ag-text-field__control" style="flex-wrap:wrap;padding-block:8px">
        ${tagMarkup({
          label: "Design",
        })}<input type="hidden" name="category" value="Design">
        ${tagMarkup({
          label: "Research",
        })}<input type="hidden" name="category" value="Research">
        <input class="ag-text-field__input" id="tag-search" type="search" name="query" placeholder="Search…" autocomplete="off" style="flex:1 1 140px;min-block-size:24px">
      </div>
    </div>
    <p class="ag-caption">Search within the Design and Research categories.</p>
    <button class="ag-button" type="submit">Search</button>
    <p><output aria-live="polite"></output></p>
  </form>`) as HTMLFormElement;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    form.querySelector("output")!.textContent = `Search: ${
      data.get("query") || "all notes"
    }; categories: ${data.getAll("category").join(", ") || "all"}.`;
  });
  return form;
};

export const Layouts = () =>
  element(`<section class="ag-body ag-panel" style="padding:24px;display:grid;gap:24px">
  <div style="display:flex;flex-wrap:wrap;gap:8px;max-width:240px">${[
    "Design",
    "A longer category",
    "Research",
    "Notes",
  ]
    .map((label) => tagMarkup({ label }))
    .join("")}</div>
  <div style="width:120px">${tagMarkup({
    label: "A very long category name",
  })}</div>
  <div dir="rtl" style="display:flex;gap:8px">${tagMarkup({
    label: "تصميم",
  })}${tagMarkup({ label: "מחקר" })}</div>
</section>`);

for (const story of [Variants, Annotations, FilterField, Layouts]) {
  Object.assign(story, { parameters: { controls: { disable: true } } });
}
