import { enhanceTabbedView } from "../../main";
import { element, escapeHTML, track } from "../../stories/fixtures";
let nextTabExample = 0;

export default {
  title: "Interact/Tab",
  args: { label: "A Tab", isSelected: false, isDisabled: false },
  argTypes: {
    label: { control: "text" },
    isSelected: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
  render: ({
    label,
    isSelected,
    isDisabled,
  }: {
    label: string;
    isSelected: boolean;
    isDisabled: boolean;
  }) => {
    const id = `tab-example-${++nextTabExample}`;
    const root =
      element(`<section class="ag-tabbed-view" style="margin:24px;max-width:600px">
      <div class="ag-tab-strip" aria-label="Tab appearance example">
        <button type="button" class="ag-tab" aria-controls="${id}-sample" aria-selected="${isSelected}" ${
        isDisabled ? "disabled" : ""
      }>${escapeHTML(label)}</button>
        <button type="button" class="ag-tab" aria-controls="${id}-other">Other view</button>
      </div>
      <section class="ag-tabbed-view__panel" id="${id}-sample"><p class="ag-body" style="padding:24px">The example tab is selected.</p></section>
      <section class="ag-tabbed-view__panel" id="${id}-other"><p class="ag-body" style="padding:24px">Choose the example tab to select it.</p></section>
    </section>`);
    track(
      enhanceTabbedView(root, {
        selectedPanelId:
          isSelected && !isDisabled ? `${id}-sample` : `${id}-other`,
      })
    );
    return root;
  },
};
export const Default = {};
export const Selected = { args: { isSelected: true } };
export const Disabled = { args: { isDisabled: true } };
