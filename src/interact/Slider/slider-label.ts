import {
  SliderLabel,
  sliderLabelTemplate as template,
} from "@microsoft/fast-foundation";
import { sliderLabelStyles as styles } from "./slider-label.styles";

export const agSliderLabel = SliderLabel.compose({
  baseName: "slider-label",
  template,
  styles,
});
