import { LitElement, html } from "lit";
import { panelStyles } from "./panel.styles";
import { registerElement } from "../../utils/register";

export class Panel extends LitElement {
  static styles = panelStyles;
  protected render() {
    return html`<slot></slot>`;
  }
}

export const agPanel = () => registerElement("ag-panel", Panel);
agPanel();

declare global {
  interface HTMLElementTagNameMap {
    "ag-panel": Panel;
  }
}
