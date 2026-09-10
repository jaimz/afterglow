import { SwitchArgs, createSwitch } from "./fixtures/createSwitch";

export default {
  title: "Interact/Switch",
  argTypes: {
    label: { control: "text" },
    isChecked: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
};

const Template = ({ ...args }: SwitchArgs) => {
  return createSwitch({ ...args });
};

export const Default: any = Template.bind({});
Default.args = {
  label: "",
  isChecked: false,
  isDisabled: false,
};

export const Backdrop: any = Template.bind({});
Backdrop.args = {
  variant: "backdrop",
  label: "",
  isChecked: false,
  isDisabled: false,
};
