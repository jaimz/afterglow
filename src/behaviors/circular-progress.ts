/**
 * Turns a labelled native <progress> into Afterglow's circular progress display.
 * Load the styles, wrap the progress and an .ag-circular-progress__title in an
 * .ag-circular-progress element, then pass that wrapper to this helper.
 *
 * Zero means not started, a partial value means in progress, and reaching max
 * means complete. Set error to show a failure while retaining the last value.
 * A null value removes the native value attribute for indeterminate progress.
 * Native value/max writes are observed; update() refreshes synchronously.
 * See Usage.md for complete markup and the public class/attribute contract.
 *
 * @example
 * import { enhanceCircularProgress } from "ag";
 *
 * const root = document.querySelector<HTMLElement>("#upload-progress")!;
 * const progress = enhanceCircularProgress(root, { title: "Upload", max: 100 });
 * progress.value = 40;
 * progress.error = true;
 *
 * // When disposing the view:
 * progress.destroy();
 */

export type CircularProgressState =
  | "not-started"
  | "in-progress"
  | "complete"
  | "error";

export interface CircularProgressOptions {
  /** Visible title and accessible name; omitted values preserve the existing title. */
  title?: string;

  /** Completed amount in the same units as max; null means an unknown amount. */
  value?: number | null;

  /** Positive total amount; omitted values preserve the native maximum. */
  max?: number;

  /** Show the error state without discarding progress; defaults to data-error. */
  error?: boolean;

  /** Override accessible state descriptions, for example with translated strings. */
  stateLabels?: Partial<Record<CircularProgressState, string>>;
}

export interface CircularProgressController {
  /** Native source of value/max semantics and accessibility. */
  readonly progress: HTMLProgressElement;

  /** Read or assign the visible title. Empty titles use the native accessible label. */
  title: string;

  /** Read or assign the native amount; null selects indeterminate progress. */
  value: number | null;

  /** Read or assign a positive native maximum. */
  max: number;

  /** Read or assign failure state; clearing it restores the state derived from value. */
  error: boolean;

  /** Effective state, with error taking precedence over the current amount. */
  readonly state: CircularProgressState;

  /** Apply partial options and synchronise the ring, title and accessible state now. */
  update(options?: CircularProgressOptions): void;

  /** Remove generated decoration and observation, restoring native progress display. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, CircularProgressController>();

const defaultLabels: Record<CircularProgressState, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  complete: "Complete",
  error: "Error",
};

/** Enhance one native progress recipe; repeated calls return the same controller. */
export function enhanceCircularProgress(
  root: HTMLElement,
  options: CircularProgressOptions = {}
): CircularProgressController {
  const existing = controllers.get(root);
  if (existing) return existing;

  const progress = root.querySelector<HTMLProgressElement>("progress");
  const title = root.querySelector<HTMLElement>(".ag-circular-progress__title");
  if (!progress || !title)
    throw new Error(
      "A circular progress requires a native progress element and a title element."
    );

  // Validate before adding any decoration or changing the caller's markup.
  const validate = (next: CircularProgressOptions) => {
    if (next.max !== undefined && (!Number.isFinite(next.max) || next.max <= 0))
      throw new RangeError(
        "Circular progress max must be a positive finite number."
      );
    if (next.value != null && !Number.isFinite(next.value))
      throw new RangeError("Circular progress value must be finite or null.");
  };
  validate(options);

  const savedAttributes = new Map(
    ["aria-label", "aria-valuetext"].map((name) => [
      name,
      progress.getAttribute(name),
    ])
  );
  const originalState = root.getAttribute("data-state");
  const originalEnhanced = root.getAttribute("data-enhanced");
  const visual = root.ownerDocument.createElement("span");
  visual.className = "ag-circular-progress__ring";
  visual.setAttribute("aria-hidden", "true");
  progress.before(visual);

  let labels = { ...defaultLabels };
  let destroyed = false;

  /** Derive display state from native clamped values, keeping errors independent. */
  const state = (): CircularProgressState => {
    if (root.hasAttribute("data-error")) return "error";
    if (progress.position === -1) return "in-progress";
    if (progress.value === 0) return "not-started";
    return progress.value >= progress.max ? "complete" : "in-progress";
  };

  /** Synchronise decoration; the native element remains the single accessible control. */
  const render = () => {
    if (destroyed) return;

    const current = state();
    const indeterminate = progress.position === -1;
    const percent = indeterminate ? 0 : progress.position * 100;
    root.dataset.state = current;
    visual.style.setProperty("--ag-circular-progress-value", `${percent}%`);
    visual.toggleAttribute("data-indeterminate", indeterminate);

    // An external aria-labelledby keeps priority; otherwise use the visible title.
    const name =
      title.textContent?.trim() ||
      savedAttributes.get("aria-label") ||
      "Progress";
    progress.setAttribute("aria-label", name);
    const valueText =
      !indeterminate && (current === "in-progress" || current === "error")
        ? `${labels[current]}: ${Math.round(percent)}%`
        : labels[current];
    progress.setAttribute("aria-valuetext", valueText);
  };

  const update = (next: CircularProgressOptions = {}) => {
    if (destroyed) return;
    validate(next);

    if (next.title !== undefined) title.textContent = next.title;
    if (next.max !== undefined) progress.max = next.max;
    if (next.value === null) progress.removeAttribute("value");
    else if (next.value !== undefined) progress.value = next.value;
    if (next.error !== undefined)
      root.toggleAttribute("data-error", next.error);
    if (next.stateLabels) labels = { ...labels, ...next.stateLabels };

    render();
  };

  // Progress properties reflect their attributes, so native property writes are observed.
  const observer = new MutationObserver(render);
  observer.observe(progress, {
    attributes: true,
    attributeFilter: ["value", "max"],
  });
  observer.observe(root, { attributes: true, attributeFilter: ["data-error"] });
  observer.observe(title, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  const controller: CircularProgressController = {
    progress,

    get title() {
      return title.textContent ?? "";
    },
    set title(value: string) {
      update({ title: value });
    },

    get value() {
      return progress.position === -1 ? null : progress.value;
    },
    set value(value: number | null) {
      update({ value });
    },

    get max() {
      return progress.max;
    },
    set max(value: number) {
      update({ max: value });
    },

    get error() {
      return root.hasAttribute("data-error");
    },
    set error(value: boolean) {
      update({ error: value });
    },

    get state() {
      return state();
    },

    update,

    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      visual.remove();

      for (const [name, value] of savedAttributes) {
        if (value === null) progress.removeAttribute(name);
        else progress.setAttribute(name, value);
      }
      if (originalState === null) root.removeAttribute("data-state");
      else root.setAttribute("data-state", originalState);
      if (originalEnhanced === null) root.removeAttribute("data-enhanced");
      else root.setAttribute("data-enhanced", originalEnhanced);

      controllers.delete(root);
    },
  };

  update(options);
  root.setAttribute("data-enhanced", "");
  controllers.set(root, controller);

  return controller;
}
