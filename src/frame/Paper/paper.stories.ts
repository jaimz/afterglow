import { Paper } from "./index";

export default {
  title: "Frame/Paper",
};

export const Default = () => {
  let p = new Paper();
  p.style.position = "absolute";
  p.style.width = "300px";
  p.style.height = "500px";

  return p;
};
Default.parameters = {
  docs: {
    source: {
      code: "<ag-paper />",
    },
  },
};
