import { LitElement, html } from "lit";
import { paperStyles } from "./paper.styles";
import { registerElement } from "../../utils/register";

export class Paper extends LitElement {
  static styles = paperStyles;
  protected render() {
    return html`<slot></slot>`;
  }
}

export const agPaper = () => registerElement("ag-paper", Paper);
agPaper();

declare global {
  interface HTMLElementTagNameMap {
    "ag-paper": Paper;
  }
}
