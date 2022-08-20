import { Panel } from "./index";

export default {
  title: "Frame/Panel",
};

export const Default = () => {
  let s = new Panel();
  s.style.position = "absolute";
  s.style.width = "300px";
  s.style.height = "500px";

  return s;
};
Default.parameters = {
  docs: {
    source: {
      code: "<ag-panel />",
    },
  },
};
