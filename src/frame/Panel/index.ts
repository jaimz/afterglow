import { FASTElement, customElement } from "@microsoft/fast-element";
import { panelStyles as styles } from "./panel.styles";

@customElement({
  name: "ag-panel",
  styles,
})
export class Panel extends FASTElement {}
