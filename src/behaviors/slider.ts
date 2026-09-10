export interface SliderOptions {
  formatValue?: (value: string) => string;
}
export interface SliderController {
  readonly input: HTMLInputElement;
  update(): void;
  setValue(value: string | number): void;
  destroy(): void;
}
const controllers = new WeakMap<HTMLElement, SliderController>();
/** Synchronise decorations; the native range owns its value, keyboard and events. */
export function enhanceSlider(
  root: HTMLElement,
  options: SliderOptions = {}
): SliderController {
  const existing = controllers.get(root);
  if (existing) return existing;
  const input = root.querySelector<HTMLInputElement>('input[type="range"]');
  if (!input)
    throw new Error("An Afterglow slider requires an input[type=range].");
  const range = input;
  const marks = root.querySelector<HTMLElement>(".ag-slider__marks");
  const originalValueText = range.getAttribute("aria-valuetext");
  let lastMarks = "";
  let destroyed = false;
  const update = () => {
    if (destroyed) return;
    const min =
      range.min !== "" && Number.isFinite(Number(range.min))
        ? Number(range.min)
        : 0;
    const max = Math.max(
      min,
      range.max !== "" && Number.isFinite(Number(range.max))
        ? Number(range.max)
        : 100
    );
    const span = max - min;
    const percent = (value: number) =>
      span ? Math.max(0, Math.min(100, ((value - min) / span) * 100)) : 0;
    root.style.setProperty(
      "--ag-slider-progress",
      `${percent(range.valueAsNumber)}%`
    );
    range.setAttribute(
      "aria-orientation",
      root.dataset.orientation === "vertical" ? "vertical" : "horizontal"
    );
    if (options.formatValue)
      range.setAttribute("aria-valuetext", options.formatValue(range.value));
    root
      .querySelectorAll<HTMLElement>(".ag-slider__label[data-position]")
      .forEach((label) => {
        label.style.setProperty(
          "--ag-slider-position",
          `${percent(Number(label.dataset.position))}%`
        );
      });
    const signature = [
      range.min,
      range.max,
      range.step,
      root.hasAttribute("data-marks"),
    ].join("|");
    if (marks && signature !== lastMarks) {
      lastMarks = signature;
      marks.replaceChildren();
      if (root.hasAttribute("data-marks") && range.step !== "any") {
        const step = Number(range.step) > 0 ? Number(range.step) : 1;
        const steps = Math.floor(span / step + 1e-9);
        const count = Math.min(1000, steps);
        for (let index = 0; index <= count; index++) {
          const mark = document.createElement("span");
          mark.style.setProperty(
            "--ag-slider-position",
            `${percent(
              min + Math.round((index * steps) / Math.max(1, count)) * step
            )}%`
          );
          marks.append(mark);
        }
      }
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "min",
      "max",
      "step",
      "value",
      "data-position",
      "data-marks",
      "data-orientation",
    ],
  });
  range.addEventListener("input", update);
  range.addEventListener("change", update);
  // Engines disagree on vertical and RTL arrow direction. Use native stepping
  // while keeping keys consistent with the visible direction of increasing values.
  const keydown = (event: KeyboardEvent) => {
    const vertical = root.dataset.orientation === "vertical";
    const rtl = getComputedStyle(range).direction === "rtl";
    const keys = vertical
      ? ["ArrowUp", "ArrowDown"]
      : rtl
      ? ["ArrowLeft", "ArrowRight"]
      : [];
    if (!keys.includes(event.key) || event.defaultPrevented) return;
    if (
      range.matches(":disabled") ||
      range.hasAttribute("data-readonly") ||
      range.closest("fieldset[data-readonly]")
    )
      return;
    event.preventDefault();
    const previous = range.value;
    const down = vertical
      ? event.key === "ArrowDown"
      : event.key === "ArrowLeft";
    if (range.step === "any") {
      const min = range.min === "" ? 0 : Number(range.min);
      const max = range.max === "" ? 100 : Number(range.max);
      range.valueAsNumber += ((max - min) / 100) * (down ? 1 : -1);
    } else if (down) range.stepUp();
    else range.stepDown();
    if (range.value !== previous) {
      range.dispatchEvent(
        new Event("input", { bubbles: true, composed: true })
      );
      range.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
  range.addEventListener("keydown", keydown);
  const onReset = (event: Event) => {
    if (event.target === range.form) queueMicrotask(update);
  };
  range.ownerDocument.addEventListener("reset", onReset, true);
  root.setAttribute("data-enhanced", "");
  const controller: SliderController = {
    input: range,
    update,
    setValue(value) {
      range.value = String(value);
      update();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      range.removeEventListener("input", update);
      range.removeEventListener("change", update);
      range.removeEventListener("keydown", keydown);
      range.ownerDocument.removeEventListener("reset", onReset, true);
      root.removeAttribute("data-enhanced");
      if (options.formatValue) {
        if (originalValueText === null) range.removeAttribute("aria-valuetext");
        else range.setAttribute("aria-valuetext", originalValueText);
      }
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  update();
  return controller;
}
