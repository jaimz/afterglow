import { SliderArgs, createSlider } from "./fixtures/createSlider";

export default {
  title: "Interact/Slider",
  argTypes: {
    isDisabled: { control: "boolean" },
    withMarks: { control: "boolean" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    orientation: {
      options: ["horizontal", "vertical"],
      control: { type: "radio" },
    },
  },
};

const Template = ({ ...args }: SliderArgs) => {
  return createSlider({ ...args });
};
export const Default: any = Template.bind({});
Default.args = {
  isDisabled: false,
};

export const Marks: any = Template.bind({});
Marks.args = {
  isDisabled: false,
  withLabels: true,
};

export const Backdrop: any = Template.bind({});
Backdrop.args = {
  variant: "backdrop",
  isDisabled: false,
};

export const BackdropMarks: any = Template.bind({});
BackdropMarks.args = {
  variant: "backdrop",
  isDisabled: false,
  withLabels: true,
};
