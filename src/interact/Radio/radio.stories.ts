import { agRadio } from ".";

export default {
  title: "Interact/Radio",
  component: agRadio,
  argTypes: {
    checked: {
      control: { type: "boolean" },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
};

interface TemplateArgs {
  checked: boolean;
  disabled: boolean;
  label: string;
}
const Template = ({ checked, disabled, label }: TemplateArgs) => `
  <ag-radio
    ${checked ? "checked" : ""}
    ${disabled ? "disabled" : ""}>
    ${label}
  </ag-radio>
`;

export const Radio: any = Template.bind({});
Radio.args = {
  label: "Label",
  checked: false,
  disabled: false,
};
Radio.parameters = {
  docs: {
    source: {
      code: "<ag-radio>Label</ag-radio>",
    },
  },
};
