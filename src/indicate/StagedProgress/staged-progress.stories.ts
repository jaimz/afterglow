import { element } from "../../stories/fixtures";
import {
  createStagedProgress,
  stageMarkup,
  type StagedProgressArgs,
} from "./fixtures/createStagedProgress";

const defaultStages = [
  { title: "Prepare", value: 100 },
  { title: "Upload", value: 38 },
  { title: "Finish", value: 0 },
];

export default {
  title: "Indicate/Staged Progress",
  render: (args: StagedProgressArgs) => {
    const section = element(
      `<section class="${
        args.variant === "backdrop" ? "ag-background" : ""
      }" style="padding:32px;width:auto;height:auto"></section>`
    );
    section.append(createStagedProgress(args).root);
    return section;
  },
  args: {
    label: "Publish photos",
    orientation: "horizontal",
    variant: "default",
    stages: defaultStages,
  },
  argTypes: {
    label: {
      control: "text",
      description: "Accessible name for the sequence.",
    },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    variant: { control: "select", options: ["default", "backdrop"] },
    stages: {
      control: "object",
      description:
        "Any number of stages, each with title, value, max and error. Use value: null for an unknown amount.",
    },
  },
};

export const Default = {};
export const WithError = {
  args: {
    stages: defaultStages.map((stage, index) => ({
      ...stage,
      error: index === 1,
    })),
  },
};
export const Vertical = { args: { orientation: "vertical" } };
export const Backdrop = { args: { variant: "backdrop" } };
export const NotStarted = {
  args: { stages: defaultStages.map((stage) => ({ ...stage, value: 0 })) },
};
export const Complete = {
  args: { stages: defaultStages.map((stage) => ({ ...stage, value: 100 })) },
};
export const MultipleErrors = {
  args: {
    stages: [
      { title: "Read files", value: 100 },
      { title: "Upload photos", value: 45, error: true },
      { title: "Upload videos", value: 22, error: true },
      { title: "Build index", value: null },
      { title: "Publish", value: 0 },
    ],
  },
};
export const ManyStages = {
  args: {
    stages: Array.from({ length: 20 }, (_, index) => ({
      title: `Stage ${index + 1}`,
      value: index < 4 ? 100 : index === 4 ? 38 : 0,
    })),
  },
};
export const SingleStage = {
  args: { stages: [{ title: "Upload", value: 38 }] },
};

export const Layouts = {
  render: () => {
    const root = element(
      '<section style="padding:32px;display:grid;gap:32px"></section>'
    );
    for (const orientation of ["horizontal", "vertical"] as const) {
      for (const variant of ["default", "backdrop"] as const) {
        const surface = element(`<div class="${
          variant === "backdrop" ? "ag-background" : "ag-panel"
        }"
          style="padding:24px;width:auto;height:auto"></div>`);
        surface.append(
          createStagedProgress({
            label: "Publish photos",
            orientation,
            variant,
            stages: defaultStages.map((stage, index) => ({
              ...stage,
              error: index === 1,
            })),
          }).root
        );
        root.append(surface);
      }
    }
    const narrow = element(
      '<div dir="rtl" style="width:200px;max-width:100%"></div>'
    );
    narrow.append(
      createStagedProgress({
        label: "Upload",
        orientation: "vertical",
        variant: "default",
        stages: [
          { title: "تحميل الصور", value: 100 },
          { title: "Averylongfilenamethatneedswrapping.zip", value: 38 },
          { title: "Publish the completed collection", value: 0 },
        ],
      }).root
    );
    root.append(narrow);
    return root;
  },
  parameters: { controls: { disable: true } },
};

export const LiveUpdates = {
  render: () => {
    const root =
      element(`<section class="ag-body" style="padding:32px;display:grid;gap:24px">
      <div class="sequence"></div>
      <label>Orientation <select class="orientation"><option>horizontal</option><option>vertical</option></select></label>
      <label>Subtask <select class="stage"></select></label>
      <label>Title <input class="title-input"></label>
      <label>Completed <input class="amount" type="range" min="0" max="100" step="1"></label>
      <label><input class="unknown" type="checkbox"> Amount of work is unknown</label>
      <label><input class="error" type="checkbox"> This subtask failed</label>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <button class="ag-button complete" type="button">Complete subtask</button>
        <button class="ag-button add" type="button">Add subtask</button>
        <button class="ag-button remove" type="button">Remove subtask</button>
      </div>
      <output></output>
    </section>`);
    const sequence = createStagedProgress({
      label: "Publish photos",
      orientation: "horizontal",
      variant: "default",
      stages: defaultStages,
    });
    root.querySelector(".sequence")!.append(sequence.root);
    const picker = root.querySelector<HTMLSelectElement>(".stage")!;
    const title = root.querySelector<HTMLInputElement>(".title-input")!;
    const amount = root.querySelector<HTMLInputElement>(".amount")!;
    const unknown = root.querySelector<HTMLInputElement>(".unknown")!;
    const error = root.querySelector<HTMLInputElement>(".error")!;
    const current = () => sequence.controller.stages[picker.selectedIndex];
    const showState = () => {
      root.querySelector("output")!.textContent = sequence.controller.stages
        .map((stage) => `${stage.title}: ${stage.state}`)
        .join("; ");
    };
    const readStage = () => {
      const stage = current();
      if (!stage) return;
      title.value = stage.title;
      amount.value = String(stage.value ?? 0);
      unknown.checked = stage.value === null;
      error.checked = stage.error;
      showState();
    };
    const rebuildPicker = (index = 0) => {
      picker.replaceChildren(
        ...sequence.controller.stages.map(
          (stage, index) =>
            new Option(`${index + 1}. ${stage.title}`, String(index))
        )
      );
      picker.selectedIndex = Math.min(index, picker.options.length - 1);
      root.querySelector<HTMLButtonElement>(".remove")!.disabled =
        picker.options.length <= 1;
      readStage();
    };
    const updateStage = () => {
      current().update({
        title: title.value,
        value: unknown.checked ? null : amount.valueAsNumber,
        error: error.checked,
      });
      picker.options[picker.selectedIndex].textContent = `${
        picker.selectedIndex + 1
      }. ${title.value}`;
      showState();
    };
    title.oninput =
      amount.oninput =
      unknown.onchange =
      error.onchange =
        updateStage;
    picker.onchange = readStage;
    root.querySelector<HTMLSelectElement>(".orientation")!.onchange = (
      event
    ) => {
      sequence.root.dataset.orientation = (
        event.target as HTMLSelectElement
      ).value;
    };
    root.querySelector<HTMLButtonElement>(".complete")!.onclick = () => {
      current().update({ value: 100, error: false });
      readStage();
    };
    root.querySelector<HTMLButtonElement>(".add")!.onclick = () => {
      sequence.root.append(
        element(
          stageMarkup({
            title: `Subtask ${picker.options.length + 1}`,
            value: 0,
          })
        )
      );
      sequence.controller.refresh();
      rebuildPicker(sequence.controller.stages.length - 1);
    };
    root.querySelector<HTMLButtonElement>(".remove")!.onclick = () => {
      const index = picker.selectedIndex;
      sequence.root.children[index].remove();
      sequence.controller.refresh();
      rebuildPicker(index);
    };
    rebuildPicker(1);
    return root;
  },
  parameters: { controls: { disable: true } },
};
