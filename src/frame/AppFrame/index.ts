import { LitElement, css, html } from "lit";
import { property } from "lit/decorators.js";
import { registerElement } from "../../utils/register";

export class AppFrame extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100%;
    }
    :host([hidden]) {
      display: none;
    }
  `;
  @property() pageTitle = "";
  protected render() {
    return html`<slot></slot>`;
  }
}
export const agAppFrame = () => registerElement("ag-appframe", AppFrame);
agAppFrame();
declare global {
  interface HTMLElementTagNameMap {
    "ag-appframe": AppFrame;
  }
}
