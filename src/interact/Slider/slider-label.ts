import { LitElement, css, html } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { sliderLabelStyles } from "./slider-label.styles";
import { registerElement } from "../../utils/register";

export class AGSliderLabel extends LitElement {
  static styles = [
    sliderLabelStyles,
    css`
      :host {
        position: relative;
        display: block;
      }
      .root {
        width: 0;
        transform: translateX(-50%);
      }
      :host(.vertical) {
        height: 100%;
      }
      :host(.vertical) .root {
        height: 0;
        width: auto;
        transform: translateY(-50%);
      }
      :host([disabled]) {
        opacity: var(--disabled-opacity, 0.5);
      }
    `,
  ];
  @property({ type: Number }) position = 0;
  @property({ type: Boolean, attribute: "hide-mark" }) hideMark = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ attribute: false }) sliderMin = 0;
  @property({ attribute: false }) sliderMax = 10;
  @property({ attribute: false }) orientation = "horizontal";
  protected willUpdate() {
    this.classList.toggle("vertical", this.orientation === "vertical");
    this.classList.toggle("horizontal", this.orientation !== "vertical");
  }
  protected render() {
    const span = this.sliderMax - this.sliderMin;
    const percent = `${
      span > 0
        ? Math.max(
            0,
            Math.min(100, ((this.position - this.sliderMin) / span) * 100)
          )
        : 0
    }%`;
    return html`<div
      class="root"
      part="root"
      style=${styleMap(
        this.orientation === "vertical"
          ? { top: percent }
          : { insetInlineStart: percent }
      )}
    >
      <div class="container" part="container">
        ${this.hideMark
          ? null
          : html`<div class="mark" part="mark" aria-hidden="true"></div>`}
        <div class="label" part="label"><slot></slot></div>
      </div>
    </div>`;
  }
}
export const agSliderLabel = () =>
  registerElement("ag-slider-label", AGSliderLabel);
agSliderLabel();
declare global {
  interface HTMLElementTagNameMap {
    "ag-slider-label": AGSliderLabel;
  }
}
