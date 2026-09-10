import { element } from "../../stories/fixtures";
export default { title: "Frame/Paper" };
export const Default = () =>
  element('<div class="ag-paper" style="width:300px;height:500px;"></div>');
Default.parameters = {
  docs: { source: { code: '<div class="ag-paper">Content</div>' } },
};
