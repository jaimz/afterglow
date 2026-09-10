import { action } from "@storybook/addon-actions";

import { createButton, ButtonArgs } from "./fixtures/createButton";

export default {
  title: "Interact/Button",
  argTypes: {
    label: { control: "text" },
    variant: {
      control: {
        type: "select",
        options: ["default", "flat", "primary", "outline"],
      },
    },
    isDisabled: { control: "boolean" },
    isAutoFocused: { control: "boolean" },
    ariaLabel: { control: "text" },
    isDangerous: { control: "boolean" },
    onClick: {
      action: "clicked",
      table: {
        disable: true,
      },
    },
  },
};

const Template = createButton;

export const Default: any = Template.bind({});
Default.args = {
  label: "Button Text",
  variant: "default",
  onClick: action("clicked"),
} as ButtonArgs;

export const Primary: any = Template.bind({});
Primary.args = {
  ...Default.args,
  variant: "primary",
};

export const Outline: any = Template.bind({});
Outline.args = {
  ...Default.args,
  variant: "outline",
};

export const Flat: any = Template.bind({});
Flat.args = {
  ...Default.args,
  variant: "flat",
};
