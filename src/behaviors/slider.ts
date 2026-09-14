export interface SliderOptions {
  /** Used by both the visible value bubble and assistive technology. */
  formatValue?: (value: string) => string;
}
export interface SliderController {
  /** The single value, or the lower value of a two-handle slider. */
  readonly input: HTMLInputElement;
  readonly upperInput: HTMLInputElement | undefined;
  update(): void;
  setValue(value: string | number): void;
  setValues(lower: string | number, upper: string | number): void;
  destroy(): void;
}
const controllers = new WeakMap<HTMLElement, SliderController>();
const adjustmentKeys = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);
/** Native ranges own values, form submission, focus and thumb dragging. */
export function enhanceSlider(
  root: HTMLElement,
  options: SliderOptions = {}
): SliderController {
  const existing = controllers.get(root);
  if (existing) return existing;
  const inputs = Array.from(
    root.querySelectorAll<HTMLInputElement>('input[type="range"]')
  );
  const [range, upper] = inputs;
  const control = root.querySelector<HTMLElement>(".ag-slider__control");
  if (
    !range ||
    !control ||
    inputs.length > 2 ||
    !!upper !== root.hasAttribute("data-range")
  )
    throw new Error(
      "An Afterglow slider requires a control with one range input, or two inputs with data-range on the slider."
    );
  const document = root.ownerDocument;
  const window = document.defaultView!;
  const marks = root.querySelector<HTMLElement>(".ag-slider__marks");
  const saved = inputs.map(
    (input) =>
      new Map(
        [
          "aria-valuetext",
          "aria-valuemin",
          "aria-valuemax",
          "aria-orientation",
          "tabindex",
        ].map((name) => [name, input.getAttribute(name)])
      )
  );
  inputs.forEach((input) => {
    if (!input.hasAttribute("tabindex")) input.tabIndex = 0;
  });
  const tips = inputs.map((_, index) => {
    const tip = document.createElement("span");
    tip.className = "ag-slider__tooltip";
    tip.setAttribute("aria-hidden", "true");
    tip.dataset.handle = String(index);
    tip.hidden = true;
    control.append(tip);
    return tip;
  });
  let lastMarks = "";
  let destroyed = false;
  let active: HTMLInputElement | undefined;
  let pointerId: number | undefined;
  let trackDrag: { input: HTMLInputElement; initial: string } | undefined;
  const heldKeys = new Set<string>();
  const blocked = (input: HTMLInputElement) =>
    input.matches(":disabled") ||
    input.hasAttribute("data-readonly") ||
    !!input.closest("fieldset[data-readonly]");
  const bounds = () => {
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
    return { min, max, span: max - min };
  };
  const show = (input?: HTMLInputElement) => {
    active = input;
    inputs.forEach((item, index) => {
      tips[index].hidden = item !== input || blocked(item);
      item.toggleAttribute("data-active", item === input);
    });
  };
  const update = (changed?: HTMLInputElement) => {
    if (destroyed) return;
    // Keep both native tracks on the same scale. Effective limits are exposed
    // through ARIA; changing native min/max per handle would move the thumbs.
    if (upper) {
      const value = upper.value;
      for (const name of ["min", "max", "step"] as const)
        if (upper[name] !== range[name]) upper[name] = range[name];
      upper.value = value;
      if (range.valueAsNumber > upper.valueAsNumber) {
        if (changed === upper) upper.value = range.value;
        else range.value = upper.value;
      }
    }
    const { min, max, span } = bounds();
    const percent = (value: number) =>
      span ? Math.max(0, Math.min(100, ((value - min) / span) * 100)) : 0;
    const lowerPercent = percent(range.valueAsNumber);
    const upperPercent = upper ? percent(upper.valueAsNumber) : lowerPercent;
    root.style.setProperty("--ag-slider-progress", `${lowerPercent}%`);
    root.style.setProperty("--ag-slider-start", `${upper ? lowerPercent : 0}%`);
    root.style.setProperty(
      "--ag-slider-selection",
      `${upperPercent - (upper ? lowerPercent : 0)}%`
    );
    inputs.forEach((input, index) => {
      input.setAttribute(
        "aria-orientation",
        root.dataset.orientation === "vertical" ? "vertical" : "horizontal"
      );
      if (upper) {
        input.setAttribute(
          "aria-valuemin",
          String(index ? range.valueAsNumber : min)
        );
        input.setAttribute(
          "aria-valuemax",
          String(index ? max : upper.valueAsNumber)
        );
      }
      const value = options.formatValue
        ? options.formatValue(input.value)
        : input.value;
      if (options.formatValue) input.setAttribute("aria-valuetext", value);
      if (tips[index].textContent !== value) tips[index].textContent = value;
      tips[index].style.setProperty(
        "--ag-slider-position",
        `${percent(input.valueAsNumber)}%`
      );
      tips[index].hidden = input !== active || blocked(input);
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
  const observer = new MutationObserver(() => update());
  observer.observe(root, {
    subtree: true,
    attributes: true,
    attributeFilter: [
      "min",
      "max",
      "step",
      "value",
      "data-marks",
      "data-orientation",
      "disabled",
      "data-readonly",
    ],
  });
  const onValue = (event: Event) =>
    update(event.currentTarget as HTMLInputElement);
  const emitInput = (input: HTMLInputElement) =>
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  const emitChange = (input: HTMLInputElement) =>
    input.dispatchEvent(new Event("change", { bubbles: true }));
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      show();
      return;
    }
    if (!adjustmentKeys.has(event.key) || event.defaultPrevented) return;
    const input = event.currentTarget as HTMLInputElement;
    if (blocked(input)) return;
    heldKeys.add(event.key);
    show(input);
    // Engines disagree on vertical/RTL arrows. Normalise those directions,
    // while preserving the browser's stepping for ordinary horizontal ranges.
    const vertical = root.dataset.orientation === "vertical";
    const rtl = getComputedStyle(input).direction === "rtl";
    const keys = vertical
      ? ["ArrowUp", "ArrowDown"]
      : rtl
      ? ["ArrowLeft", "ArrowRight"]
      : [];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const previous = input.value;
    const increase = vertical
      ? event.key === "ArrowDown"
      : event.key === "ArrowLeft";
    if (input.step === "any")
      input.valueAsNumber += (bounds().span / 100) * (increase ? 1 : -1);
    else if (increase) input.stepUp();
    else input.stepDown();
    update(input);
    if (input.value !== previous) {
      emitInput(input);
      emitChange(input);
    }
  };
  const keyup = (event: KeyboardEvent) => {
    heldKeys.delete(event.key);
    if (!heldKeys.size && pointerId === undefined) show();
  };
  const pointerValue = (event: PointerEvent) => {
    const rect = control.getBoundingClientRect();
    const vertical = root.dataset.orientation === "vertical";
    const rtl = getComputedStyle(range).direction === "rtl";
    const fraction = vertical
      ? (event.clientY - rect.top) / rect.height
      : rtl
      ? (rect.right - event.clientX) / rect.width
      : (event.clientX - rect.left) / rect.width;
    const { min, span } = bounds();
    return min + Math.max(0, Math.min(1, fraction)) * span;
  };
  const moveTrack = (event: PointerEvent) => {
    if (!trackDrag || event.pointerId !== pointerId) return;
    const input = trackDrag.input;
    if (blocked(input)) {
      finish();
      return;
    }
    const previous = input.value;
    input.valueAsNumber = pointerValue(event);
    update(input);
    if (input.value !== previous) emitInput(input);
  };
  const pointerdown = (event: PointerEvent) => {
    if (event.button !== 0 || event.defaultPrevented || pointerId !== undefined)
      return;
    let input = inputs.find((input) => input === event.target);
    if (!input && upper) {
      const value = pointerValue(event);
      const available = inputs.filter((input) => !blocked(input));
      // On coincident handles, choose the one that can move toward the pointer.
      input = available.sort(
        (a, b) =>
          Math.abs(a.valueAsNumber - value) -
            Math.abs(b.valueAsNumber - value) ||
          (value < range.valueAsNumber
            ? inputs.indexOf(a) - inputs.indexOf(b)
            : inputs.indexOf(b) - inputs.indexOf(a))
      )[0];
      if (input) {
        event.preventDefault();
        input.focus();
        trackDrag = { input, initial: input.value };
        control.setPointerCapture(event.pointerId);
      }
    }
    if (!input || blocked(input)) return;
    pointerId = event.pointerId;
    show(input);
    moveTrack(event);
  };
  const finish = () => {
    const drag = trackDrag;
    trackDrag = undefined;
    if (pointerId !== undefined && control.hasPointerCapture(pointerId))
      control.releasePointerCapture(pointerId);
    pointerId = undefined;
    heldKeys.clear();
    show();
    if (drag && drag.input.value !== drag.initial) emitChange(drag.input);
  };
  const pointerup = (event: PointerEvent) => {
    if (event.pointerId === pointerId) finish();
  };
  const blur = () => {
    if (!trackDrag) finish();
  };
  const onReset = (event: Event) => {
    if (inputs.some((input) => event.target === input.form))
      queueMicrotask(() => {
        if (!destroyed && !event.defaultPrevented) {
          finish();
          update();
        }
      });
  };
  inputs.forEach((input) => {
    input.addEventListener("input", onValue, true);
    input.addEventListener("change", onValue, true);
    input.addEventListener("keydown", keydown);
    input.addEventListener("keyup", keyup);
    input.addEventListener("blur", blur);
  });
  control.addEventListener("pointerdown", pointerdown);
  control.addEventListener("lostpointercapture", pointerup);
  document.addEventListener("pointermove", moveTrack);
  document.addEventListener("pointerup", pointerup, true);
  document.addEventListener("pointercancel", pointerup, true);
  document.addEventListener("reset", onReset, true);
  window.addEventListener("blur", finish);
  root.setAttribute("data-enhanced", "");
  const controller: SliderController = {
    input: range,
    upperInput: upper,
    update: () => update(),
    setValue(value) {
      range.value = String(value);
      update(range);
    },
    setValues(lowerValue, upperValue) {
      if (!upper) throw new Error("setValues requires a two-handle slider.");
      update(); // Apply pending bound/step changes before native rounding.
      range.value = String(lowerValue);
      upper.value = String(upperValue);
      if (range.valueAsNumber > upper.valueAsNumber) {
        const lower = upper.value;
        upper.value = range.value;
        range.value = lower;
      }
      update();
    },
    destroy() {
      if (destroyed) return;
      // Disposing is not a user change.
      trackDrag = undefined;
      finish();
      destroyed = true;
      observer.disconnect();
      inputs.forEach((input, index) => {
        input.removeEventListener("input", onValue, true);
        input.removeEventListener("change", onValue, true);
        input.removeEventListener("keydown", keydown);
        input.removeEventListener("keyup", keyup);
        input.removeEventListener("blur", blur);
        for (const [name, value] of saved[index]) {
          if (value === null) input.removeAttribute(name);
          else input.setAttribute(name, value);
        }
        tips[index].remove();
      });
      control.removeEventListener("pointerdown", pointerdown);
      control.removeEventListener("lostpointercapture", pointerup);
      document.removeEventListener("pointermove", moveTrack);
      document.removeEventListener("pointerup", pointerup, true);
      document.removeEventListener("pointercancel", pointerup, true);
      document.removeEventListener("reset", onReset, true);
      window.removeEventListener("blur", finish);
      root.removeAttribute("data-enhanced");
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  update();
  return controller;
}
