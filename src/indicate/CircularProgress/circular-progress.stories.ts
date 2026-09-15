import { enhanceCircularProgress } from "../../main";
import { element, track } from "../../stories/fixtures";
import {
  circularProgressMarkup,
  createCircularProgress,
  type CircularProgressVariant,
} from "./fixtures/createCircularProgress";

interface CircularProgressArgs {
  title: string;
  value: number;
  max: number;
  error: boolean;
  indeterminate: boolean;
  size: string;
  variant: CircularProgressVariant;
}

export default {
  title: "Indicate/Circular Progress",
  render: ({
    title,
    value,
    max,
    error,
    indeterminate,
    size,
    variant,
  }: CircularProgressArgs) => {
    const { root } = createCircularProgress({
      title,
      value: indeterminate ? null : value,
      max,
      error,
      variant,
    });
    root.style.setProperty("--circular-progress-size", size);
    const section = element(
      `<section class="${
        variant === "backdrop" ? "ag-background" : ""
      }" style="padding:32px;width:auto;height:auto"></section>`
    );
    section.append(root);
    return section;
  },
  args: {
    title: "title",
    value: 0,
    max: 100,
    error: false,
    indeterminate: false,
    size: "24px",
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "backdrop"],
      description:
        "Backdrop uses the light foreground and keyline for dark surfaces.",
    },
    title: {
      control: "text",
      description: "Visible title beneath the ring and its accessible name.",
    },
    value: {
      control: "number",
      description: "Zero is not started; reaching max is complete.",
    },
    max: {
      control: { type: "number", min: 1 },
      description: "Positive total amount, in the same units as value.",
    },
    error: {
      control: "boolean",
      description: "Show failure without discarding the last value.",
    },
    indeterminate: {
      control: "boolean",
      description: "Use when work is underway but the amount is unknown.",
    },
    size: {
      control: "text",
      description: "CSS --circular-progress-size; defaults to 24px.",
    },
  },
};

export const Default = {};
export const InProgress = { args: { value: 38 } };
export const Complete = { args: { value: 100 } };
export const Error = { args: { value: 38, error: true } };
export const Indeterminate = { args: { indeterminate: true } };
export const Backdrop = { args: { variant: "backdrop", value: 38 } };

const renderStates = (variant: CircularProgressVariant = "default") => {
  const root = element(
    `<section class="${
      variant === "backdrop" ? "ag-background" : ""
    }" style="padding:32px;display:flex;flex-wrap:wrap;align-items:start;gap:22px;width:auto;height:auto"></section>`
  );
  for (const options of [
    { title: "title", value: 0 },
    { title: "title", value: 38 },
    { title: "title", value: 100 },
    { title: "title", value: 38, error: true },
  ])
    root.append(createCircularProgress({ ...options, variant }).root);
  return root;
};

export const States = {
  render: () => renderStates(),
  parameters: { controls: { disable: true } },
};

export const BackdropStates = {
  render: () => renderStates("backdrop"),
  parameters: { controls: { disable: true } },
};

export const LiveUpdates = {
  render: () => {
    const root =
      element(`<section class="ag-body" style="padding:32px;display:grid;justify-items:start;gap:24px">
      <div class="progress-preview"></div>
      <label>Title <input class="title-input" value="Upload"></label>
      <label>Completed <input class="amount-input" type="range" min="0" max="100" value="0"></label>
      <label><input class="unknown-input" type="checkbox"> Amount of work is unknown</label>
      <label><input class="error-input" type="checkbox"> An error occurred</label>
      <div style="display:flex;gap:12px">
        <button class="ag-button" type="button">Complete</button>
        <button class="ag-button" type="button">Reset</button>
      </div>
      <output>Not started</output>
    </section>`);
    const component = createCircularProgress({ title: "Upload" });
    root.querySelector(".progress-preview")!.append(component.root);
    const title = root.querySelector<HTMLInputElement>(".title-input")!;
    const amount = root.querySelector<HTMLInputElement>(".amount-input")!;
    const unknown = root.querySelector<HTMLInputElement>(".unknown-input")!;
    const error = root.querySelector<HTMLInputElement>(".error-input")!;
    const update = () => {
      component.controller.update({
        title: title.value,
        value: unknown.checked ? null : amount.valueAsNumber,
        error: error.checked,
      });
      root.querySelector("output")!.textContent = `${
        component.controller.state
      }; value: ${component.controller.value ?? "unknown"}`;
    };
    title.oninput = amount.oninput = unknown.onchange = error.onchange = update;
    const buttons = root.querySelectorAll("button");
    buttons[0].onclick = () => {
      amount.value = "100";
      unknown.checked = error.checked = false;
      update();
    };
    buttons[1].onclick = () => {
      amount.value = "0";
      unknown.checked = error.checked = false;
      update();
    };
    return root;
  },
  parameters: { controls: { disable: true } },
};

export const Layouts = {
  render: () => {
    const root =
      element(`<section class="ag-body" style="padding:32px;display:flex;flex-wrap:wrap;align-items:start;gap:32px">
      <div class="ag-panel" style="padding:24px"></div>
      <div class="ag-background" style="padding:24px;width:auto;height:auto"></div>
      <div class="narrow" style="width:80px"></div>
      <div class="right-to-left" dir="rtl"></div>
      <div class="larger" style="--circular-progress-size:48px"></div>
    </section>`);
    root
      .querySelector(".ag-panel")!
      .append(createCircularProgress({ title: "Upload", value: 38 }).root);
    root
      .querySelector(".ag-background")!
      .append(
        createCircularProgress({
          title: "Upload",
          value: 38,
          variant: "backdrop",
        }).root
      );
    root.querySelector(".narrow")!.append(
      createCircularProgress({
        title: "Averylongfilenamethatwraps.zip",
        value: 38,
      }).root
    );
    root
      .querySelector(".right-to-left")!
      .append(createCircularProgress({ title: "تحميل", value: 38 }).root);
    root
      .querySelector(".larger")!
      .append(createCircularProgress({ title: "Ready", value: 100 }).root);
    return root;
  },
  parameters: { controls: { disable: true } },
};

export const NativeHTML = {
  render: () => {
    const root =
      element(`<section class="ag-body" style="padding:32px;display:grid;justify-items:start;gap:24px">
      <p>The native progress bar remains usable before enhancement. The helper adds the ring and state icons.</p>
      ${circularProgressMarkup("Upload", 38)}
      <button class="ag-button" type="button">Enhance</button>
    </section>`);
    const button = root.querySelector("button")!;
    button.onclick = () => {
      track(
        enhanceCircularProgress(
          root.querySelector<HTMLElement>(".ag-circular-progress")!
        )
      );
      button.disabled = true;
    };
    return root;
  },
  parameters: { controls: { disable: true } },
};
