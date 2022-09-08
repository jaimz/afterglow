import { AGSlider, Variant } from "../index";

export type SliderArgs = {
  variant: Variant;
  isDisabled: boolean;

  min: number;
  max: number;
  step: number;

  withLabels: boolean;

  withMarks: boolean;

  orientation: string;
};

export function createSlider({
  variant = "default",
  isDisabled,
  min = 0,
  max = 100,
  step = 10,
  withLabels = false,
  withMarks = false,
  orientation = "horizontal",
}: SliderArgs) {
  const slider = new AGSlider();

  slider.setAttribute("variant", variant);
  slider.setAttribute("orientation", orientation);

  isDisabled && slider.setAttribute("disabled", "");
  withMarks && slider.setAttribute("marks", "true");

  min !== undefined && slider.setAttribute("min", `${min}`);
  max !== undefined && slider.setAttribute("max", `${max}`);
  step !== undefined && slider.setAttribute("step", `${step}`);

  if (withLabels) {
    slider.innerHTML = `
      <ag-slider-label position="${min}">${min}</ag-slider-label>
      <ag-slider-label position="${(max - min) / 4}">${
      (max - min) / 4
    }</ag-slider-label>
      <ag-slider-label position="${(max - min) * 0.75}">${
      (max - min) * 0.75
    }</ag-slider-label>    
      <ag-slider-label position="${max}">${max}</ag-slider-label>
    `;
  }

  return slider;
}
