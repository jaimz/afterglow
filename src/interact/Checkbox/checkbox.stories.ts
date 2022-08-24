import { action } from "@storybook/addon-actions";
import { CheckboxArgs, createCheckbox } from "./fixtures/createCheckbox";

export default {
  title: "Interact/Checkbox",
  argTypes: {
    label: { control: "text" },
    isChecked: { control: "boolean" },
    isIndeterminate: { control: "boolean" },
    isDisabled: { control: "boolean" },
    isAutoFocused: { control: "boolean" },
    isReadOnly: { control: "boolean" },
    hasValue: { control: "boolean" },
    indicatorIcon: { control: "boolean" },
    onChange: {
      action: "changed",
      table: {
        disable: true,
      },
    },
  },
};

const Template = ({ ...args }: CheckboxArgs) => {
  return createCheckbox({ ...args });
};

export const Default: any = Template.bind({});
Default.args = {
  label: "Label",
  isChecked: false,
  isIndeterminate: false,
  isDisabled: false,
  isAutoFocused: false,
  isReadOnly: false,
  hasValue: false,
  indicatorIcon: false,
  onChange: action("checkbox-onchange"),
};
Default.parameters = {
  docs: {
    source: {
      code: `<ag-checkbox>Label</ag-checkbox>`,
    },
  },
};

export const Solid: any = Template.bind({});
Solid.args = {
  variant: "solid",
  label: "Solid",
  isChecked: false,
  isIndeterminate: false,
  isDisabled: false,
  isAutoFocused: false,
  isReadOnly: false,
  hasValue: false,
  indicatorIcon: false,
  onChange: action("checkbox-onchange"),
};

export const Backdrop: any = Template.bind({});
Backdrop.args = {
  variant: "backdrop",
  label: "Backdrop",
  isChecked: false,
  isIndeterminate: false,
  isDisabled: false,
  isAutoFocused: false,
  isReadOnly: false,
  hasValue: false,
  indicatorIcon: false,
  onChange: action("checkbox-onchange"),
};
