import { SwitchArgs, createSwitch } from "./fixtures/createSwitch";

export default {
  title: "Interact/Switch",
  argTypes: {
    label: { control: "text" },
    isChecked: { control: "boolean" },
    isDisabled: { control: "boolean" },
    showStatusLabel: {
      control: "boolean",
      description: "Show the status text beside the switch.",
    },
    positiveStatusLabel: {
      control: "text",
      description: "Status text when checked.",
    },
    negativeStatusLabel: {
      control: "text",
      description: "Status text when unchecked.",
    },
  },
  args: {
    showStatusLabel: true,
    positiveStatusLabel: "On",
    negativeStatusLabel: "Off",
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

export const CustomStatusLabels: any = Template.bind({});
CustomStatusLabels.args = {
  label: "Notifications",
  positiveStatusLabel: "Enabled",
  negativeStatusLabel: "Disabled",
  isChecked: true,
};

export const WithoutStatusLabel: any = Template.bind({});
WithoutStatusLabel.args = {
  label: "Notifications",
  showStatusLabel: false,
};
