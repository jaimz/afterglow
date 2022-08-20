import { FASTElement, customElement } from "@microsoft/fast-element";
import { surfaceStyles as styles } from "./surface.styles";

@customElement({
  name: "ag-surface",
  styles,
})
export class Surface extends FASTElement {}
