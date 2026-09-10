import { element } from "../../stories/fixtures";
export default { title: "Frame/Panel" };
export const Default = () =>
  element('<div class="ag-panel" style="width:300px;height:500px;"></div>');
Default.parameters = {
  docs: { source: { code: '<div class="ag-panel">Content</div>' } },
};
