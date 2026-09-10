import { element } from "../../stories/fixtures";
export default { title: "Frame/Surface" };
export const Default = () =>
  element('<div class="ag-surface" style="width:300px;height:500px;"></div>');
Default.parameters = {
  docs: { source: { code: '<div class="ag-surface">Content</div>' } },
};
