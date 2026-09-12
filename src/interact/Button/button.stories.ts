import { action } from "@storybook/addon-actions";

import { createButton, ButtonArgs } from "./fixtures/createButton";
import { element } from "../../stories/fixtures";

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

export const WithIcons = () => {
  const root =
    element(`<section style="display:flex;gap:16px;padding:32px;flex-wrap:wrap;--icon-size:20px">
    <button type="button" class="ag-button" data-variant="primary"><span class="ag-icon ag-button__start" data-icon="save" aria-hidden="true"></span>Save</button>
    <button type="button" class="ag-button" data-variant="outline">Continue<span class="ag-icon ag-button__end" data-icon="arrow-right" aria-hidden="true"></span></button>
    <button type="button" class="ag-button" aria-label="Search"><span class="ag-icon" data-icon="search" aria-hidden="true"></span></button>
    <button type="button" class="ag-button" disabled><span class="ag-icon ag-button__start" data-icon="download" aria-hidden="true"></span>Download</button>
  </section>`);
  root.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", action("clicked"));
  });
  return root;
};
WithIcons.parameters = { controls: { disable: true } };
