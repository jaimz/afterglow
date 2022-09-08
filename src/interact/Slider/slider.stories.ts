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
Default.parameters = {
  docs: {
    source: {
      code: `<ag-slider></ag-slider>`,
    },
  },
};

export const Marks: any = Template.bind({});
Marks.args = {
  isDisabled: false,
  withLabels: true,
};
Marks.parameters = {
  docs: {
    source: {
      code: `<ag-slider></ag-slider>`,
    },
  },
};

export const Backdrop: any = Template.bind({});
Backdrop.args = {
  variant: "backdrop",
  isDisabled: false,
};
Backdrop.parameters = {
  docs: {
    source: {
      code: '<ag-slider variant="backdrop"></ag-slider>',
    },
  },
};

export const BackdropMarks: any = Template.bind({});
BackdropMarks.args = {
  variant: "backdrop",
  isDisabled: false,
  withLabels: true,
};
