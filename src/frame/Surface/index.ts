import { LitElement, html } from "lit";
import { surfaceStyles } from "./surface.styles";
import { registerElement } from "../../utils/register";

export class Surface extends LitElement {
  static styles = surfaceStyles;
  protected render() {
    return html`<slot></slot>`;
  }
}

export const agSurface = () => registerElement("ag-surface", Surface);
agSurface();

declare global {
  interface HTMLElementTagNameMap {
    "ag-surface": Surface;
  }
}
