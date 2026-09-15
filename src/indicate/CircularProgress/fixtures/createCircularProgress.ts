import {
  enhanceCircularProgress,
  type CircularProgressOptions,
} from "../../../main";
import { element, escapeHTML, track } from "../../../stories/fixtures";

export type CircularProgressVariant = "default" | "backdrop";

/** Native markup remains a labelled progress bar until enhanced. */
export function circularProgressMarkup(
  title = "title",
  value: number | null = 0,
  max = 100,
  error = false,
  variant: CircularProgressVariant = "default"
) {
  return `<label class="ag-circular-progress" data-variant="${variant}" ${
    error ? "data-error" : ""
  }>
    <progress class="ag-circular-progress__native" max="${escapeHTML(max)}" ${
    value === null ? "" : `value="${escapeHTML(value)}"`
  } ${title ? "" : 'aria-label="Progress"'}></progress>
    <span class="ag-circular-progress__title">${escapeHTML(title)}</span>
  </label>`;
}

/** Create and track an enhanced example for Storybook's existing cleanup lifecycle. */
export function createCircularProgress({
  variant = "default",
  ...options
}: CircularProgressOptions & {
  variant?: CircularProgressVariant;
} = {}) {
  const root = element(circularProgressMarkup("title", 0, 100, false, variant));
  const controller = track(enhanceCircularProgress(root, options));
  return { root, controller };
}
