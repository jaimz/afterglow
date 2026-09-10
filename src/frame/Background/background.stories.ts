import { element } from "../../stories/fixtures";
export default { title: "Frame/Background" };
export const Default = () =>
  element('<div class="ag-background" style="width:100%;height:100vh;"></div>');
Default.parameters = {
  docs: { source: { code: '<div class="ag-background">Content</div>' } },
};
