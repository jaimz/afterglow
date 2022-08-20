import { FASTElement, customElement } from "@microsoft/fast-element";
import { paperStyles as styles } from "./paper.styles";

@customElement({
  name: "ag-paper",
  styles,
})
export class Paper extends FASTElement {}
