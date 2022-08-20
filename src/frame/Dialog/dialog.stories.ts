// import DialogTemplate from "./fixtures/modal-dialog.html?raw";
import { createDialog, DialogArgs } from "./fixtures/createDialog";

export default {
  title: "Frame/Modal",
  argTypes: {
    anchor: {
      control: {
        type: "select",
        options: ["left", "right", "top", "bottom", "center"],
      },
    },
    stretch: {
      control: {
        type: "select",
        options: ["vertical", "horizontal", "full", "none"],
      },
    },
  },
};

// export const Dialog = () => DialogTemplate;
const Template = createDialog;

const dialogExample = `
<ag-dialog id="agdialog" aria-label="Modal dialog" modal="true" hidden>
    <h2>This is a modal dialog</h2>
    <ag-button>Close</ag-button>
</ag-dialog>
`;

export const Default: any = Template.bind({});
Default.args = {
  anchor: "center",
  stretch: "none",
  hidden: false,
} as DialogArgs;
Default.parameters = {
  docs: {
    source: {
      code: dialogExample,
    },
  },
};

// export default {
//   title: "Interact/Button",
//   argTypes: {
//     label: { control: "text" },
//     variant: {
//       control: {
//         type: "select",
//         options: ["Default", "Flat", "Primary", "Outline", "FAB"],
//       },
//     },
//     isDisabled: { control: "boolean" },
//     isAutoFocused: { control: "boolean" },
//     ariaLabel: { control: 'text" ' },
//     isDangerous: { control: "boolean" },
//     onClick: {
//       action: "clicked",
//       table: {
//         disable: true,
//       },
//     },
//   },
// };
