import { action } from "@storybook/addon-actions";

import { createButton, ButtonArgs } from "./fixtures/createButton";

export default {
  title: "Interact/Button",
  argTypes: {
    label: { control: "text" },
    variant: {
      control: {
        type: "select",
        options: ["Default", "Flat", "Primary", "Outline", "FAB"],
      },
    },
    isDisabled: { control: "boolean" },
    isAutoFocused: { control: "boolean" },
    ariaLabel: { control: 'text" ' },
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
Default.parameters = {
  docs: {
    source: {
      code: "<ag-button>ButtonText</ag-button>",
    },
  },
};

export const Primary: any = Template.bind({});
Primary.args = {
  ...Default.args,
  variant: "primary",
};
Primary.parameters = {
  docs: {
    source: {
      code: '<ag-button variant="primary">Button Text</ag-button>',
    },
  },
};

export const Outline: any = Template.bind({});
Outline.args = {
  ...Default.args,
  variant: "outline",
};
Outline.parameters = {
  docs: {
    source: {
      code: '<ag-button variant="outline">Button Text</ag-button>',
    },
  },
};

export const Flat: any = Template.bind({});
Flat.args = {
  ...Default.args,
  variant: "flat",
};
Flat.parameters = {
  docs: {
    source: {
      code: '<ag-button variant="flat">Button Text</ag-button>',
    },
  },
};
