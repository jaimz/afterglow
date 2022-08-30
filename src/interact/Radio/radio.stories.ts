import { RadioArgs, createRadio } from "./fixtures/createRadio";

export default {
  title: "Interact/Radio",
  argTypes: {
    label: { control: "text" },
    isChecked: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
};

const Template = ({ ...args }: RadioArgs) => {
  return createRadio({ ...args });
};

export const Default: any = Template.bind({});
Default.args = {
  label: "Label",
  isChecked: false,
  isDisabled: false,
};
Default.parameters = {
  docs: {
    source: {
      code: "<ag-radio>Label</ag-radio>",
    },
  },
};

export const Backdrop: any = Template.bind({});
Backdrop.args = {
  variant: "backdrop",
  label: "Label",
  isChecked: false,
  isDisabled: false,
};
Backdrop.parameters = {
  docs: {
    source: {
      code: '<ag-radio variant="backdrop">Label</ag-radio>',
    },
  },
};
