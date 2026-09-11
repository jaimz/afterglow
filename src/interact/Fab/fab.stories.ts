import { element } from "../../stories/fixtures";

export default {
  title: "Interact/FAB",
  args: { disabled: false },
  argTypes: { disabled: { control: "boolean" } },
};
export const Default = ({ disabled }: { disabled: boolean }) => {
  const root = element(`<section class="ag-panel ag-body" style="padding:32px">
    <button class="ag-fab" type="button" aria-label="Add a note" ${
      disabled ? "disabled" : ""
    }><span class="ag-fab__icon" data-icon="add" aria-hidden="true"></span></button>
    <p><output>No notes added.</output></p>
  </section>`);
  let count = 0;
  root.querySelector("button")!.onclick = () => {
    root.querySelector("output")!.textContent = `Notes added: ${++count}`;
  };
  return root;
};
