import { enhancePopover, type PopoverOptions } from "../../behaviors/popover";
import { checkableMarkup, element, escapeHTML, track } from "../../stories/fixtures";

type Args = Omit<PopoverOptions, "trigger"> & { open?: boolean; width?: number };

function connect(root: HTMLElement, args: Args = {}) {
  const panel = root.querySelector<HTMLElement>(".ag-popover")!;
  const trigger = root.querySelector<HTMLButtonElement>("[data-trigger]")!;
  const controller = track(enhancePopover(panel, { trigger, placement: args.placement, align: args.align }));
  if (args.width) panel.style.setProperty("--popover-width", `${args.width}px`);
  if (args.open) {
    const timer = setTimeout(() => { if (root.isConnected) controller.show({ focus: false }); }, 0);
    track({ destroy: () => clearTimeout(timer) });
  }
  return controller;
}

function render(args: Args) {
  const root = element(`<section class="ag-surface ag-body" style="min-height:460px;padding:64px 24px;box-sizing:border-box;display:flex;justify-content:center;align-items:flex-start">
    <button class="ag-button" type="button" data-trigger><span class="ag-icon ag-button__start" data-icon="info" aria-hidden="true"></span>About this notebook</button>
    <div class="ag-popover" popover="auto">
      <header class="ag-popover__header"><h2 class="ag-popover__title">Field notes</h2></header>
      <div class="ag-popover__body">
        <p>A place for small discoveries, passing thoughts, and things to return to.</p>
        <dl style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-block-end:0">
          <dt style="color:var(--onPanelAlt)">Notes</dt><dd style="margin:0">24</dd>
          <dt style="color:var(--onPanelAlt)">Last updated</dt><dd style="margin:0">Today</dd>
        </dl>
      </div>
    </div>
  </section>`);
  connect(root, args);
  return root;
}

export default {
  title: "Frame/Popover",
  render,
  args: { placement: "bottom", align: "center", open: true, width: 320 },
  argTypes: {
    placement: { control: "select", options: ["top", "bottom", "inline-start", "inline-end"] },
    align: { control: "select", options: ["start", "center", "end"] },
    open: { control: "boolean" },
    width: { control: { type: "range", min: 240, max: 480, step: 8 } },
  },
};

export const Default = {};

export const Settings = (args: Args) => {
  const root = element(`<section class="ag-surface ag-body" style="min-height:500px;padding:48px 24px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:24px">
    <button class="ag-button" type="button" data-trigger><span class="ag-icon ag-button__start" data-icon="sliders" aria-hidden="true"></span>View options</button>
    <p data-summary style="color:var(--onSurfaceAlt)">Showing previews and modification dates.</p>
    <div class="ag-popover" popover="auto">
      <header class="ag-popover__header"><h2 class="ag-popover__title">View options</h2></header>
      <div class="ag-popover__body" style="display:grid;gap:16px">
        <p style="color:var(--onPanelAlt)">Choose what appears in your notebook.</p>
        ${checkableMarkup("switch", { label: "Note previews", name: "previews", isChecked: true, isAutoFocused: true })}
        ${checkableMarkup("switch", { label: "Modification dates", name: "dates", isChecked: true })}
      </div>
      <footer class="ag-popover__footer"><button class="ag-button" type="button" data-variant="primary" data-popover-close>Done</button></footer>
    </div>
  </section>`);
  connect(root, args);
  root.addEventListener("change", () => {
    const previews = root.querySelector<HTMLInputElement>('[name="previews"]')!.checked;
    const dates = root.querySelector<HTMLInputElement>('[name="dates"]')!.checked;
    root.querySelector("[data-summary]")!.textContent = previews && dates ? "Showing previews and modification dates." :
      previews ? "Showing previews." : dates ? "Showing modification dates." : "Showing note titles only.";
  });
  return root;
};

export const EditDetails = (args: Args) => {
  const root = element(`<section class="ag-surface ag-body" style="min-height:480px;padding:48px 24px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:16px">
    <h2 class="ag-h4" data-name style="margin:0">Field notes</h2>
    <button class="ag-button" type="button" data-trigger>Rename notebook</button>
    <div class="ag-popover" popover="auto">
      <header class="ag-popover__header"><h2 class="ag-popover__title">Notebook details</h2></header>
      <div class="ag-popover__body">
        <label style="display:grid;gap:8px">Name
          <span class="ag-text-field" style="--text-field-width:100%"><span class="ag-text-field__control"><input class="ag-text-field__input" value="Field notes" autofocus></span></span>
        </label>
        <p class="ag-caption" style="color:var(--onPanelAlt);margin-block-end:0">Changes are saved as you type.</p>
      </div>
      <footer class="ag-popover__footer"><button class="ag-button" type="button" data-variant="primary" data-popover-close>Done</button></footer>
    </div>
  </section>`);
  connect(root, args);
  const input = root.querySelector("input")!;
  input.addEventListener("input", () => { root.querySelector("[data-name]")!.textContent = input.value || "Untitled notebook"; });
  return root;
};

export const Placements = () => {
  const root = element('<section class="ag-surface ag-body" style="min-height:540px;display:grid;place-items:center;padding:24px;box-sizing:border-box"></section>');
  const buttons = element('<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center"></div>');
  root.append(buttons);
  for (const placement of ["top", "bottom", "inline-start", "inline-end"] as const) {
    const item = element(`<div><button class="ag-button" type="button" data-trigger>${escapeHTML(placement)}</button>
      <div class="ag-popover" popover="auto"><header class="ag-popover__header"><h2 class="ag-popover__title">A little more context</h2></header>
      <div class="ag-popover__body"><p>Keep related information close to the item you are working with.</p></div></div></div>`);
    buttons.append(item);
    connect(item, { placement });
  }
  return root;
};
Placements.parameters = { controls: { disable: true } };

export const NearEdges = () => {
  const root = element('<section class="ag-surface ag-body" style="position:fixed;inset:0;padding:24px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box"></section>');
  for (const edge of ["top", "bottom"]) {
    const row = element('<div style="display:flex;justify-content:space-between;gap:16px"></div>');
    for (const alignment of ["start", "end"] as const) {
      const item = element(`<div><button class="ag-button" type="button" data-trigger>${edge === "top" ? "Upper" : "Lower"} ${alignment === "start" ? "left" : "right"}</button>
        <div class="ag-popover" popover="auto"><header class="ag-popover__header"><h2 class="ag-popover__title">Room to read</h2></header><div class="ag-popover__body"><p>The panel finds room near its trigger and keeps its pointer aligned.</p></div></div></div>`);
      row.append(item);
      connect(item, { placement: edge === "top" ? "top" : "bottom", align: alignment });
    }
    root.append(row);
  }
  return root;
};
NearEdges.parameters = { controls: { disable: true } };

export const LongContent = (args: Args) => {
  const root = render({ ...args, open: false });
  const panel = root.querySelector<HTMLElement>(".ag-popover")!;
  panel.querySelector(".ag-popover__title")!.textContent = "Notebook activity";
  panel.querySelector(".ag-popover__body")!.innerHTML = `<ol style="padding-inline-start:20px">${Array.from({ length: 25 }, (_, i) => `<li style="padding-block:8px">${i % 2 ? "A note was updated" : "A new observation was added"}.</li>`).join("")}</ol>`;
  panel.insertAdjacentHTML("beforeend", '<footer class="ag-popover__footer"><button class="ag-button" type="button" data-popover-close>Done</button></footer>');
  if (args.open) {
    const timer = setTimeout(() => { if (root.isConnected) root.querySelector<HTMLButtonElement>("[data-trigger]")!.click(); }, 0);
    track({ destroy: () => clearTimeout(timer) });
  }
  return root;
};

export const RightToLeft = (args: Args) => {
  const root = Settings({ ...args, placement: "inline-start" });
  root.dir = "rtl";
  return root;
};
RightToLeft.args = { placement: "inline-start" };

export const Narrow = { parameters: { viewport: { defaultViewport: "mobile1" } } };

export const Themed = (args: Args) => {
  const root = render(args);
  root.style.setProperty("--panel", "#eef5f3");
  root.style.setProperty("--keyline", "#7d9c92");
  root.style.setProperty("--onPanel", "#314b43");
  return root;
};
