import { element, escapeHTML } from "../../stories/fixtures";

type Variant = "default" | "error" | "caution";
interface ProgressArgs {
  label: string;
  value: number;
  max: number;
  variant: Variant;
  indeterminate: boolean;
  width: string;
}
const markup = (
  label: string,
  value: number | null = 25,
  variant: Variant = "default",
  max = 100
) => `<label class="ag-progress" data-variant="${variant}">
  <progress class="ag-progress__bar" max="${max}" ${
  value === null ? "" : `value="${value}"`
} ${label ? "" : 'aria-label="Progress"'}></progress>
  ${label ? `<span class="ag-progress__label">${escapeHTML(label)}</span>` : ""}
</label>`;

export default {
  title: "Indicate/Progress",
  args: {
    label: "Something is happening...",
    value: 25,
    max: 100,
    variant: "default",
    indeterminate: false,
    width: "142px",
  },
  argTypes: {
    label: { control: "text" },
    value: {
      control: "number",
      description: "Native progress.value, in the same units as max.",
    },
    max: {
      control: "number",
      description: "Native progress.max; defaults to 1 when omitted in HTML.",
    },
    variant: { control: "select", options: ["default", "error", "caution"] },
    indeterminate: {
      control: "boolean",
      description: "Omit value when the amount of work is unknown.",
    },
    width: {
      control: "text",
      description: "CSS --progress-width, constrained by available space.",
    },
  },
};

export const Default = ({
  label,
  value,
  max,
  variant,
  indeterminate,
  width,
}: ProgressArgs) => {
  const root = element(`<section class="ag-body" style="padding:32px">
    ${markup(label, indeterminate ? null : value, variant, max)}
  </section>`);
  root.style.setProperty("--progress-width", width);
  return root;
};

export const Variants = () =>
  element(`<section style="padding:32px;display:flex;flex-direction:column;gap:24px">
  ${markup("Something is happening...")}
  ${markup("Something has gone wrong...", 25, "error")}
  ${markup("Uh-oh...", 25, "caution")}
</section>`);
Variants.parameters = { controls: { disable: true } };

export const States = () => {
  const root =
    element(`<section style="padding:32px;display:flex;flex-direction:column;gap:24px;--progress-width:240px">
    ${markup("Waiting to begin", 0)}
    ${markup("Uploading files: 25%", 25)}
    ${markup("Upload complete", 100)}
    ${markup("Preparing your files...", null)}
    ${markup("Connection lost. Please retry.", 40, "error")}
    ${markup("Some files could not be uploaded.", 80, "caution")}
  </section>`);
  return root;
};
States.parameters = { controls: { disable: true } };

export const LiveUpdates = () => {
  const root =
    element(`<section class="ag-body" style="padding:32px;display:grid;gap:24px">
    ${markup("Uploading files: 25%", 25)}
    <label>Completed <input type="range" min="0" max="100" value="25" style="vertical-align:middle"></label>
    <label><input type="checkbox"> Amount of work is unknown</label>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button type="button" class="ag-button">Mark as error</button>
      <button type="button" class="ag-button">Resume</button>
    </div>
  </section>`);
  root.style.setProperty("--progress-width", "min(320px, 100%)");
  const progress = root.querySelector("progress")!;
  const status = root.querySelector<HTMLElement>(".ag-progress__label")!;
  const component = root.querySelector<HTMLElement>(".ag-progress")!;
  const amount = root.querySelector<HTMLInputElement>('input[type="range"]')!;
  const unknown = root.querySelector<HTMLInputElement>(
    'input[type="checkbox"]'
  )!;
  const update = () => {
    component.dataset.variant = "default";
    if (unknown.checked) {
      progress.removeAttribute("value");
      status.textContent = "Preparing your files...";
    } else {
      progress.value = amount.valueAsNumber;
      status.textContent =
        progress.value === progress.max
          ? "Upload complete"
          : `Uploading files: ${progress.value}%`;
    }
  };
  amount.oninput = update;
  unknown.onchange = update;
  const buttons = root.querySelectorAll("button");
  buttons[0].onclick = () => {
    component.dataset.variant = "error";
    status.textContent = "Connection lost. Please retry.";
  };
  buttons[1].onclick = update;
  return root;
};
LiveUpdates.parameters = { controls: { disable: true } };

export const Layouts = () =>
  element(`<section class="ag-body" style="padding:32px;display:grid;gap:32px">
  <div class="ag-panel" style="padding:24px;max-width:400px;--progress-width:100%">
    ${markup(
      "A longer status message wraps to fit the available space while the progress bar fills its container.",
      60
    )}
  </div>
  <div dir="rtl" style="--progress-width:240px">
    ${markup("جارٍ تحميل الملفات", 35)}
  </div>
  <div style="--progress-width:240px">
    ${markup("", 70)}
  </div>
</section>`);
Layouts.parameters = { controls: { disable: true } };
