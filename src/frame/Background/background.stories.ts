import { Background } from "./index";

export default {
  title: "Frame/Background",
};

export const Default = () => {
  let b = new Background();
  b.style.position = "absolute";
  b.style.top = "0px";
  b.style.left = "0px";

  return b;
};
Default.args = {};
Default.parameters = {
  docs: {
    source: {
      code: "<ag-background />",
    },
  },
};
