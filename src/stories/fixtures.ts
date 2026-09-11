import { enhanceControls, enhanceDialog, enhanceSlider } from "../main";

const cleanups: Array<() => void> = [];
export function cleanupStories() {
  cleanups.splice(0).forEach((cleanup) => cleanup());
}
export function track<T extends { destroy(): void }>(controller: T): T {
  cleanups.push(() => controller.destroy());
  return controller;
}
export function element(markup: string): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  // Template content has an inert ownerDocument until adopted. Helpers may be
  // initialized before Storybook mounts the returned element.
  return document.adoptNode(template.content.firstElementChild as HTMLElement);
}
export function escapeHTML(value: string | number) {
  return String(value).replace(
    /[&<>"']/g,
    (value) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        value
      ]!)
  );
}
export const tick =
  '<svg class="ag-check__tick" width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor"><path d="M13 1L4.75 9L1 5.36364" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export interface ControlArgs {
  label?: string;
  variant?: string;
  isChecked?: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  isAutoFocused?: boolean;
  isReadOnly?: boolean;
  hasValue?: boolean;
  name?: string;
  value?: string;
  onChange?: EventListener;
  ariaLabel?: string;
}
export function checkableMarkup(
  kind: "checkbox" | "radio" | "switch",
  args: ControlArgs = {}
) {
  const {
    label = "Label",
    variant = "default",
    name,
    value = "on",
    isChecked,
    isDisabled,
    isReadOnly,
    isAutoFocused,
    ariaLabel,
  } = args;
  const input = `<input class="ag-check__input" type="${
    kind === "radio" ? "radio" : "checkbox"
  }" ${kind === "switch" ? 'role="switch"' : ""} ${
    name ? `name="${escapeHTML(name)}"` : ""
  } value="${escapeHTML(value)}" ${isChecked ? "checked" : ""} ${
    isDisabled ? "disabled" : ""
  } ${isReadOnly ? "data-readonly" : ""} ${isAutoFocused ? "autofocus" : ""} ${
    ariaLabel || !label
      ? `aria-label="${escapeHTML(ariaLabel || "Notifications")}"`
      : ""
  }>`;
  const text = `<span class="ag-check__label">${escapeHTML(label)}</span>`;
  const decoration =
    kind === "switch"
      ? `${text}<span class="ag-switch__track" aria-hidden="true"><span class="ag-switch__thumb"></span></span><span class="ag-switch__status" aria-hidden="true"><span class="ag-switch__on">On</span><span class="ag-switch__off">Off</span></span>`
      : `<span class="ag-check__control" aria-hidden="true">${
          kind === "checkbox"
            ? tick + '<span class="ag-check__mixed"></span>'
            : '<span class="ag-check__tick"></span>'
        }</span>${text}`;
  return `<label class="ag-${kind}" data-variant="${escapeHTML(
    variant
  )}">${input}${decoration}</label>`;
}
export function createCheckable(
  kind: "checkbox" | "radio" | "switch",
  args: ControlArgs
) {
  const root = element(checkableMarkup(kind, args));
  const input = root.querySelector("input")!;
  if (args.isIndeterminate) input.indeterminate = true;
  if (args.onChange) input.addEventListener("change", args.onChange);
  if (args.isReadOnly) track(enhanceControls(root));
  return root;
}
export interface SliderArgs {
  variant?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  name?: string;
  withLabels?: boolean;
  withMarks?: boolean;
  orientation?: string;
  labels?: Array<{ position: number; label: string }>;
}
export function sliderMarkup({
  variant = "default",
  isDisabled,
  isReadOnly,
  min = 0,
  max = 100,
  step = 10,
  value = (min + max) / 2,
  name = "volume",
  withLabels,
  withMarks,
  orientation = "horizontal",
  labels,
}: SliderArgs = {}) {
  return `<div class="ag-slider" data-variant="${escapeHTML(
    variant
  )}" data-orientation="${escapeHTML(orientation)}" ${
    withMarks ? "data-marks" : ""
  }>
    <div class="ag-slider__control">
      <input class="ag-slider__input" aria-label="Volume" type="range" name="${escapeHTML(
        name
      )}" min="${min}" max="${max}" step="${step}" value="${value}" ${
    isDisabled ? "disabled" : ""
  } ${isReadOnly ? "data-readonly" : ""}>
      <div class="ag-slider__track" aria-hidden="true"><div class="ag-slider__fill"></div><div class="ag-slider__marks"></div></div>
      ${
        withLabels
          ? `<div class="ag-slider__labels" aria-hidden="true">${(
              labels ??
              [min, min + (max - min) / 4, min + (max - min) * 0.75, max].map(
                (position) => ({ position, label: String(position) })
              )
            )
              .map(
                ({ position, label }) =>
                  `<span class="ag-slider__label" data-position="${position}" style="--ag-slider-position: ${
                    max > min ? ((position - min) / (max - min)) * 100 : 0
                  }%"><span>${escapeHTML(label)}</span></span>`
              )
              .join("")}</div>`
          : ""
      }
    </div>
  </div>`;
}
export function createSlider(args: SliderArgs) {
  const root = element(sliderMarkup(args));
  track(enhanceSlider(root));
  if (args.isReadOnly) track(enhanceControls(root));
  return root;
}
export interface DialogArgs {
  anchor?: string;
  stretch?: string;
  hidden?: boolean;
  modal?: boolean;
  trapFocus?: boolean;
}
export function createDialog({
  anchor = "center",
  stretch = "none",
  hidden = false,
  modal = true,
  trapFocus = true,
}: DialogArgs) {
  const root = element(
    `<div><button class="ag-button" type="button">Open dialog</button><dialog class="ag-dialog" data-anchor="${escapeHTML(
      anchor
    )}" data-stretch="${escapeHTML(
      stretch
    )}" aria-labelledby="example-dialog-title"><div style="padding:32px"><h2 id="example-dialog-title">A moment of focus</h2><p>Native HTML, with Afterglow's colour and depth.</p><button class="ag-button" data-variant="primary" type="button" autofocus>Close dialog</button></div></dialog></div>`
  );
  const dialog = root.querySelector("dialog")!;
  const controller = track(enhanceDialog(dialog, { modal, trapFocus }));
  root.querySelector("button")!.onclick = () => void controller.show();
  dialog.querySelector("button")!.onclick = () => void controller.hide();
  dialog.addEventListener("dismiss", () => void controller.hide());
  if (!hidden) {
    const timer = setTimeout(() => {
      if (dialog.isConnected) void controller.show();
    }, 0);
    cleanups.push(() => clearTimeout(timer));
  }
  return root;
}
