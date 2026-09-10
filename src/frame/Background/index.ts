import { LitElement, html } from "lit";
import { backgroundStyles } from "./background.styles";
import { registerElement } from "../../utils/register";

export class Background extends LitElement {
  static styles = backgroundStyles;
  protected render() {
    return html`<slot></slot>`;
  }
}

export const agBackground = () => registerElement("ag-background", Background);
agBackground();

declare global {
  interface HTMLElementTagNameMap {
    "ag-background": Background;
  }
}
