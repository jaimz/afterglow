import {
  Slider,
  SliderOptions,
  sliderTemplate as template,
} from "@microsoft/fast-foundation";
import { attr } from "@microsoft/fast-element";
import { sliderStyles as styles } from "./slider.styles";
import { createDom } from "../../utils/content";

export type Variant = "default" | "backdrop";

export class AGSlider extends Slider {
  // @ts-ignore
  @attr public variant: Variant;

  // @ts-ignore
  @attr public marks: boolean;

  public connectedCallback() {
    super.connectedCallback();

    if (!this.variant) {
      const variantValue = this.getAttribute("variant");
      this.variant = variantValue as Variant;
    }

    if (this.marks === undefined) {
      this.marks = Boolean(this.getAttribute("marks"));
    }

    if (this.marks) {
      this.track.style.flexDirection =
        this.orientation === "vertical" ? "column" : "row";

      const span = this.max - this.min;
      let markCount = span / this.step;
      const markPc = 100 / markCount;

      while (markCount-- > 0) {
        const m = createDom("div", { className: "mark" }, null, this.track);
        const p = `${Math.round(100 - markPc * markCount)}%`;
        if (this.orientation === "vertical") m.style.top = p;
        else m.style.right = p;
      }
    }
  }
}

export const agSlider = AGSlider.compose<SliderOptions>({
  baseName: "slider",
  template,
  styles,
  thumb: `
    <div class="thumb"></div>
  `,
});
