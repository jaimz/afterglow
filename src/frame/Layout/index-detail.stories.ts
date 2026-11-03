import { element, escapeHTML, track } from "../../stories/fixtures";
import { menuItemContent } from "../../interact/MenuItem/fixtures/createMenuItem";
import { enhanceIndexDetail } from "../../behaviors/index-detail";

export default {
  title: "Frame/Index Detail",
  excludeStories: ["createIndexDetailExample"],
  parameters: { controls: { disable: true } },
};

const notebooks = [
  { name: "Field notes", entries: [
    { title: "Along the coast", summary: "Observations from a morning walk beside the sea.", detail: "Low tide reveals rock pools and a narrow path around the headland.", category: "Observation" },
    { title: "Things to revisit", summary: "Questions and places worth returning to.", detail: "Return to the sheltered bay in the late afternoon to compare the light.", category: "Reminder" },
  ] },
  { name: "Project ideas", entries: [
    { title: "A local walking guide", summary: "A collection of favourite routes close to home.", detail: "Include distance, terrain and a few landmarks for each route.", category: "Idea" },
    { title: "Seasonal journal", summary: "Small changes noticed throughout the year.", detail: "Collect one observation each week, grouped by season.", category: "Plan" },
  ] },
];

/** Selection belongs to the application; the layout only arranges its regions. */
export function createIndexDetailExample(showInspector = true) {
  const root = element(`<section class="ag-index-detail ag-body" aria-label="Notebook" style="height:560px">
    <nav class="ag-index-detail__index" aria-label="Notebooks" tabindex="0">
      <div style="padding:24px 16px"><h2 class="ag-h4" style="margin-top:0">Notebooks</h2>
        <div class="ag-location-index"><ul class="ag-location-index__list">
          ${notebooks.map((notebook, index) => `<li><a class="ag-menu-item" href="#notebook-${index}" data-notebook="${index}">${menuItemContent({ label: notebook.name, icon: "" })}</a></li>`).join("")}
        </ul></div>
      </div>
    </nav>
    <section class="ag-index-detail__detail" aria-label="Notebook contents" tabindex="0">
      <div style="padding:24px">
        <header style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <h1 class="ag-h3" style="margin:0" data-title></h1>
          <button class="ag-button" data-variant="flat" type="button" data-inspector-toggle aria-controls="notebook-inspector" aria-expanded="${showInspector}">Inspector</button>
        </header>
        <p class="ag-caption">Select a note to see its details in the Inspector.</p>
        <div data-notes style="display:grid;gap:16px"></div>
      </div>
    </section>
    <aside class="ag-index-detail__inspector" id="notebook-inspector" aria-label="Inspector" tabindex="0" ${showInspector ? "" : "hidden"}>
      <div style="padding:24px"><h2 class="ag-h4" style="margin-top:0">Inspector</h2><div data-inspection aria-live="polite"></div></div>
    </aside>
  </section>`);
  const toggle = root.querySelector<HTMLButtonElement>("[data-inspector-toggle]")!;
  const layout = track(enhanceIndexDetail(root, { trigger: toggle }));
  let selectedNotebook = 0;
  const inspect = (selected: number | null) => {
    root.querySelectorAll<HTMLButtonElement>("[data-note]").forEach(button => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.note) === selected));
    });
    const note = selected === null ? null : notebooks[selectedNotebook].entries[selected];
    root.querySelector("[data-inspection]")!.innerHTML = note
      ? `<p class="ag-caption">${escapeHTML(note.category)}</p><h3 class="ag-h5">${escapeHTML(note.title)}</h3><p>${escapeHTML(note.detail)}</p>`
      : '<p class="ag-caption">Select a note to inspect it.</p>';
  };
  const selectNotebook = (index: number) => {
    selectedNotebook = index;
    const notebook = notebooks[index];
    root.querySelector("[data-title]")!.textContent = notebook.name;
    root.querySelectorAll<HTMLElement>("[data-notebook]").forEach(link => {
      if (Number(link.dataset.notebook) === index) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    root.querySelector("[data-notes]")!.innerHTML = notebook.entries.map((note, noteIndex) => `
      <article class="ag-card ag-paper"><div class="ag-card__body">
        <h2 class="ag-h4" style="margin-top:0">${escapeHTML(note.title)}</h2><p>${escapeHTML(note.summary)}</p>
        <button class="ag-button" type="button" data-variant="flat" data-note="${noteIndex}" aria-pressed="false" aria-label="Inspect ${escapeHTML(note.title)}">Inspect note</button>
      </div></article>`).join("");
    inspect(null);
  };
  root.addEventListener("click", (event) => {
    const target = (event.target as Element).closest<HTMLElement>("[data-notebook], [data-note], [data-inspector-toggle]");
    if (!target) return;
    if (target.dataset.notebook !== undefined) {
      event.preventDefault();
      selectNotebook(Number(target.dataset.notebook));
    } else if (target.dataset.note !== undefined) {
      inspect(Number(target.dataset.note));
      void layout.setInspectorOpen(true);
    } else {
      void layout.setInspectorOpen(!layout.inspectorOpen);
    }
  });
  selectNotebook(0);
  return root;
}

export const Default = () => createIndexDetailExample();
export const WithoutInspector = () => createIndexDetailExample(false);
export const Narrow = () => {
  const wrapper = element('<div style="max-width:600px"></div>');
  wrapper.append(createIndexDetailExample());
  return wrapper;
};
export const RightToLeft = () => {
  const root = createIndexDetailExample();
  root.dir = "rtl";
  return root;
};
export const Sketch = () => element(`<section class="ag-index-detail" aria-label="Index-Detail layout" style="aspect-ratio:2306 / 1817">
  <nav class="ag-index-detail__index" aria-label="Index"></nav>
  <section class="ag-index-detail__detail" aria-label="Detail"></section>
  <aside class="ag-index-detail__inspector" aria-label="Inspector"></aside>
</section>`);
