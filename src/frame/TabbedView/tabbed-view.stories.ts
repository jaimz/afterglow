import { enhanceTabbedView, type TabbedViewOptions } from "../../main";
import { element, escapeHTML, track } from "../../stories/fixtures";

interface ViewArgs {
  labels: string[];
  selectedIndex: number;
  activation: "automatic" | "manual";
  disabledIndex: number;
}
let nextViewId = 0;

/** Keep panel markup in the document; the helper owns only selection and ARIA. */
function createView(args: ViewArgs, contents?: string[]) {
  const prefix = `example-tabs-${++nextViewId}`;
  const labels = args.labels.length ? args.labels : ["Overview"];
  const root =
    element(`<section class="ag-tabbed-view" style="width:669px;max-width:100%;min-height:340px">
    <div class="ag-tab-strip" aria-label="Document sections">
      ${labels
        .map(
          (label, index) =>
            `<button class="ag-tab" type="button" aria-controls="${prefix}-${index}" ${
              index === args.disabledIndex ? "disabled" : ""
            }>${escapeHTML(label)}</button>`
        )
        .join("")}
    </div>
    ${labels
      .map(
        (label, index) =>
          `<section class="ag-tabbed-view__panel" id="${prefix}-${index}">${
            contents?.[index] ??
            `<article class="ag-article"><h2>${escapeHTML(
              label
            )}</h2><p>Panel ${
              index + 1
            } can contain any related content or component.</p></article>`
          }</section>`
      )
      .join("")}
  </section>`);
  const options: TabbedViewOptions = { activation: args.activation };
  if (
    args.selectedIndex >= 0 &&
    args.selectedIndex < labels.length &&
    args.selectedIndex !== args.disabledIndex
  )
    options.selectedPanelId = `${prefix}-${args.selectedIndex}`;
  const controller = track(enhanceTabbedView(root, options));
  return { root, controller };
}

const defaults: ViewArgs = {
  labels: ["Overview", "Notes", "Settings"],
  selectedIndex: 0,
  activation: "automatic",
  disabledIndex: -1,
};

export default {
  title: "Frame/Tabbed View",
  render: (args: ViewArgs) => {
    const wrapper = element('<div style="padding:24px"></div>');
    wrapper.append(
      createView(args, [
        '<article class="ag-article"><h2>A place for related views</h2><p>Choose a tab to move between the document overview, notes and settings.</p></article>',
        '<div style="padding:24px"><label class="ag-body">Working notes<textarea class="ag-textarea" placeholder="Write a note…"></textarea></label><p class="ag-caption">Your notes remain here when you switch tabs.</p></div>',
        '<div style="padding:24px"><div class="ag-text-field"><div class="ag-text-field__control"><input class="ag-text-field__input" aria-label="Document name" autocomplete="off" value="Research notes"></div></div><p class="ag-body"><button type="button" class="ag-button" data-variant="primary">Save settings</button></p></div>',
      ]).root
    );
    return wrapper;
  },
  args: defaults,
  argTypes: {
    labels: { control: "object" },
    selectedIndex: {
      control: { type: "number", min: 0 },
      description: "Initially selected tab (zero-based).",
    },
    activation: { control: "select", options: ["automatic", "manual"] },
    disabledIndex: {
      control: "number",
      description: "Disable one example tab by index; -1 enables all.",
    },
  },
};
export const Default = {};
export const ManualActivation = { args: { activation: "manual" } };
export const DisabledTab = { args: { disabledIndex: 1 } };

export const Layouts = () => {
  const wrapper = element(
    '<div style="display:grid;gap:32px;padding:24px"></div>'
  );
  const narrow = createView({
    ...defaults,
    labels: ["Summary", "Documents", "Activity", "Settings"],
  }).root;
  narrow.style.width = "320px";
  narrow.style.height = "340px";
  const rtl = createView({
    ...defaults,
    labels: ["نظرة عامة", "ملاحظات", "إعدادات"],
  }).root;
  rtl.dir = "rtl";
  rtl.lang = "ar";
  wrapper.append(narrow, rtl);
  return wrapper;
};
Layouts.parameters = { controls: { disable: true } };

export const NestedViews = () => {
  const wrapper = element('<div style="padding:24px"></div>');
  const parent = createView({ ...defaults, labels: ["Project", "Activity"] });
  const child = createView({ ...defaults, labels: ["Tasks", "Files"] });
  child.root.style.cssText = "margin:24px;min-height:200px";
  parent.root
    .querySelector(".ag-tabbed-view__panel")!
    .replaceChildren(child.root);
  wrapper.append(parent.root);
  return wrapper;
};
NestedViews.parameters = { controls: { disable: true } };

export const ProgrammaticSelection = () => {
  const wrapper = element(
    '<div style="display:grid;gap:16px;padding:24px"></div>'
  );
  const { root, controller } = createView(defaults);
  const button = element(
    '<button type="button" class="ag-button" style="justify-self:start">Open Settings</button>'
  );
  const status = element(
    '<p class="ag-body" role="status" style="margin:0">Overview selected</p>'
  );
  button.addEventListener("click", () =>
    controller.select(
      root.querySelectorAll<HTMLElement>(":scope > .ag-tabbed-view__panel")[2]
        .id
    )
  );
  root.addEventListener("ag-tab-change", (event) => {
    const id = (event as CustomEvent).detail.panelId;
    const tab = Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        ":scope > .ag-tab-strip > .ag-tab"
      )
    ).find((tab) => tab.getAttribute("aria-controls") === id);
    status.textContent = `${tab?.textContent} selected`;
  });
  wrapper.append(button, root, status);
  return wrapper;
};
ProgrammaticSelection.parameters = { controls: { disable: true } };
