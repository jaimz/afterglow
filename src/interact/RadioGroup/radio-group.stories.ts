import { createRadioGroup, RadioGroupArgs } from "./fixtures/createRadioGroup";

export default {
  title: "Interact/Radio Group",
  argTypes: {
    label: { control: "text" },
    orientation: {
      control: {
        type: "select",
        options: ["Vertical", "Horizontal"],
      },
    },
    childCount: { control: "number" },
    isDisabled: { control: "boolean" },
    isreadonly: { control: "boolean" },
  },
};

const Template = ({ ...args }: RadioGroupArgs) => {
  return createRadioGroup({ ...args });
};

export const Default: any = Template.bind({});
Default.args = {
  label: "Radio group label",
  orientation: "Horizontal",
  childCount: 3,
  isDisabled: false,
  isReadOnly: false,
};
