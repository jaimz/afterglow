import {
  enhanceStagedProgress,
  type CircularProgressOptions,
} from "../../../main";
import { element, escapeHTML, track } from "../../../stories/fixtures";
import { circularProgressMarkup } from "../../CircularProgress/fixtures/createCircularProgress";

export interface StagedProgressArgs {
  label: string;
  orientation: "horizontal" | "vertical";
  variant: "default" | "backdrop";
  stages: CircularProgressOptions[];
}

/** Each list item composes the same circular progress markup used on its own. */
export function stageMarkup(
  options: CircularProgressOptions,
  variant: StagedProgressArgs["variant"] = "default"
) {
  return `<li class="ag-staged-progress__stage">${circularProgressMarkup(
    options.title ?? "Stage",
    options.value === undefined ? 0 : options.value,
    options.max ?? 100,
    options.error ?? false,
    variant
  )}</li>`;
}

/** Create a sequence and give Storybook ownership of its cleanup. */
export function createStagedProgress({
  label,
  orientation,
  variant,
  stages,
}: StagedProgressArgs) {
  const root = element(`<ol class="ag-staged-progress" role="list"
    aria-label="${escapeHTML(
      label
    )}" data-orientation="${orientation}" data-variant="${variant}">
    ${stages.map((stage) => stageMarkup(stage, variant)).join("")}
  </ol>`);
  const controller = track(enhanceStagedProgress(root));
  controller.stages.forEach((stage, index) => stage.update(stages[index]));
  return { root, controller };
}
