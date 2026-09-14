import { SliderArgs, createSlider } from "./fixtures/createSlider";

export default {
  title: "Interact/Slider",
  render: (args: SliderArgs) => createSlider(args),
  args: {
    isDisabled: false,
    isReadOnly: false,
    isRange: false,
    withMarks: false,
    min: 0,
    max: 100,
    step: 1,
    value: 28,
    upperValue: 70,
    orientation: "horizontal",
  },
  argTypes: {
    isDisabled: { control: "boolean" },
    isReadOnly: { control: "boolean" },
    isRange: { control: "boolean" },
    withMarks: { control: "boolean" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    value: { control: "number" },
    upperValue: { control: "number" },
    orientation: {
      options: ["horizontal", "vertical"],
      control: { type: "radio" },
    },
  },
};

export const Default = {};
export const Marks = { args: { step: 10, value: 30, withMarks: true } };
export const Range = { args: { isRange: true, value: 30, upperValue: 70 } };
export const RangeWithMarks = {
  args: { ...Range.args, step: 10, withMarks: true },
};
export const Backdrop = { args: { variant: "backdrop" } };
export const BackdropMarks = { args: { ...Marks.args, variant: "backdrop" } };
export const BackdropRange = { args: { ...Range.args, variant: "backdrop" } };
