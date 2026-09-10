import { css, html, PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { FormControl } from "../form-control";
import { sliderStyles } from "./slider.styles";
import { AGSliderLabel } from "./slider-label";
import { registerElement } from "../../utils/register";

export type Variant = "default" | "backdrop";

export class AGSlider extends FormControl {
  static styles = [
    FormControl.styles,
    sliderStyles,
    css`
      .native-input {
        cursor: pointer;
        touch-action: pan-y;
      }
      :host(.vertical) .native-input {
        writing-mode: vertical-lr;
        direction: ltr;
        touch-action: pan-x;
      }
      :host(:focus-within) .thumb {
        outline: 2px solid currentColor;
        outline-offset: 3px;
      }
      :host(.horizontal) .thumb-container {
        transform: translateX(-50%);
        margin: 0;
      }
      :host(.horizontal:dir(rtl)) .thumb-container {
        transform: translateX(50%);
      }
      :host(.horizontal) .track-start {
        left: auto;
        inset-inline-start: 0;
      }
      :host(.vertical) .thumb-container {
        transform: translateY(-50%);
        margin: 0;
      }
      :host(.vertical) .track {
        left: calc(var(--thumb-diameter) / 2);
      }
      :host(.vertical) .thumb-container {
        left: 0;
      }
      :host(.vertical) slot:not([name]) {
        grid-column: 2;
        height: 100%;
      }
      :host(.horizontal) slot:not([name]) {
        grid-row: 2;
      }
    `,
  ];
  @property({ reflect: true }) variant: Variant = "default";
  @property({ type: Boolean, reflect: true }) marks = false;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 10;
  @property({ type: Number }) step = 1;
  @property({ reflect: true }) orientation: "horizontal" | "vertical" =
    "horizontal";
  @property({ attribute: false }) valueTextFormatter = (value: string) => value;

  get track() {
    return this.shadowRoot?.querySelector<HTMLElement>(".track");
  }
  private get lower() {
    return Number.isFinite(this.min) ? this.min : 0;
  }
  private get upper() {
    return Number.isFinite(this.max)
      ? Math.max(this.lower, this.max)
      : this.lower;
  }
  private get increment() {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }
  private get progress() {
    return this.upper === this.lower
      ? 0
      : ((Number(this.value) - this.lower) / (this.upper - this.lower)) * 100;
  }

  private normalizeValue(value: string) {
    const numeric =
      value === "" ? (this.lower + this.upper) / 2 : Number(value);
    const clamped = Math.max(
      this.lower,
      Math.min(this.upper, Number.isFinite(numeric) ? numeric : this.lower)
    );
    const maxSteps = Math.floor(
      (this.upper - this.lower) / this.increment + 1e-9
    );
    const steps = Math.min(
      maxSteps,
      Math.round((clamped - this.lower) / this.increment)
    );
    const snapped = this.lower + steps * this.increment;
    return String(
      Number(Math.max(this.lower, Math.min(this.upper, snapped)).toFixed(10))
    );
  }
  protected willUpdate() {
    this.value = this.normalizeValue(this.value);
    this.classList.toggle("horizontal", this.orientation !== "vertical");
    this.classList.toggle("vertical", this.orientation === "vertical");
  }
  protected updated(changed: PropertyValues) {
    super.updated(changed);
    for (const child of Array.from(this.children)) {
      if (child instanceof AGSliderLabel) {
        child.sliderMin = this.lower;
        child.sliderMax = this.upper;
        child.orientation = this.orientation;
        child.disabled = this.effectiveDisabled;
      }
    }
  }
  private onInput(event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    if (this.effectiveReadOnly) {
      input.value = this.value;
      return;
    }
    this.value = this.normalizeValue(input.value);
    this.syncForm();
    this.dispatchEvent(
      new Event(event.type, { bubbles: true, composed: true })
    );
  }
  protected render() {
    const vertical = this.orientation === "vertical";
    const progress = `${this.progress}%`;
    // Bound generated markup when a caller supplies an extremely small step.
    const totalSteps = Math.floor(
      (this.upper - this.lower) / this.increment + 1e-9
    );
    const count = Math.min(1000, totalSteps);
    const marks = this.marks
      ? Array.from({ length: count + 1 }, (_, index) =>
          this.upper === this.lower
            ? 0
            : ((Math.round((index * totalSteps) / Math.max(1, count)) *
                this.increment) /
                (this.upper - this.lower)) *
              100
        )
      : [];
    return html`<div part="positioning-region" class="positioning-region">
        <input
          class="native-input"
          type="range"
          min=${this.lower}
          max=${this.upper}
          step=${this.increment}
          .value=${this.value}
          ?disabled=${this.effectiveDisabled}
          aria-label=${ifDefined(this.accessibleLabel)}
          aria-valuetext=${this.valueTextFormatter(this.value)}
          aria-orientation=${this.orientation}
          aria-readonly=${this.effectiveReadOnly}
          aria-describedby=${ifDefined(
            this.ariaDescribedby ? "description" : undefined
          )}
          @keydown=${(event: KeyboardEvent) => {
            if (this.effectiveReadOnly) event.preventDefault();
          }}
          @input=${this.onInput}
          @change=${this.onInput}
        />
        <div part="track-container" class="track" aria-hidden="true">
          <slot name="track"></slot>
          <div
            part="track-start"
            class="track-start"
            style=${styleMap(
              vertical ? { height: progress } : { width: progress }
            )}
          >
            <slot name="track-start"></slot>
          </div>
          ${marks.map(
            (position) =>
              html`<div
                class="mark"
                style=${styleMap(
                  vertical
                    ? { top: `${position}%` }
                    : { insetInlineStart: `${position}%` }
                )}
              ></div>`
          )}
        </div>
        <slot @slotchange=${() => this.requestUpdate()}></slot>
        <div
          part="thumb-container"
          class="thumb-container"
          aria-hidden="true"
          style=${styleMap(
            vertical ? { top: progress } : { insetInlineStart: progress }
          )}
        >
          <slot name="thumb"><div class="thumb"></div></slot>
        </div>
      </div>
      ${this.renderDescription()}`;
  }
}
export const agSlider = () => registerElement("ag-slider", AGSlider);
agSlider();
declare global {
  interface HTMLElementTagNameMap {
    "ag-slider": AGSlider;
  }
}
