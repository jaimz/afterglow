import { FASTElement, customElement } from "@microsoft/fast-element";
import { backgroundStyles as styles } from "./background.styles";

@customElement({
  name: "ag-background",
  styles,
})
export class Background extends FASTElement {}
