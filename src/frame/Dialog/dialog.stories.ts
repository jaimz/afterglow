import { createDialog } from "./fixtures/createDialog";
export default {
  title: "Frame/Modal",
  argTypes: {
    anchor: {
      control: "select",
      options: ["left", "right", "top", "bottom", "center"],
    },
    stretch: {
      control: "select",
      options: ["vertical", "horizontal", "full", "none"],
    },
    modal: { control: "boolean" },
    trapFocus: { control: "boolean" },
  },
};
export const Default: any = createDialog.bind({});
Default.args = {
  anchor: "center",
  stretch: "none",
  hidden: false,
  modal: true,
  trapFocus: true,
};
