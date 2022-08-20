import { Surface } from "./index";

export default {
  title: "Frame/Surface",
};

export const Default = () => {
  let s = new Surface();
  s.style.position = "absolute";
  s.style.width = "300px";
  s.style.height = "500px";

  return s;
};
Default.parameters = {
  docs: {
    source: {
      code: "<ag-surface />",
    },
  },
};
