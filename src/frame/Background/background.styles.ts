import { css, cssPartial } from "@microsoft/fast-element";
import {
  backdrop,
  backdropLight,
  onBackdrop,
  backdropTextElevation,
} from "../frame-tokens";

export const backgroundMix = cssPartial`
  width: 100%;
  height: 100%;
  background: radial-gradient(
    ellipse 90% 80% at top,
    ${backdropLight},
    ${backdrop}
  );
  color: ${onBackdrop};
  text-shadow: ${backdropTextElevation};
`;

export const backgroundStyles = css`
  :host {
    ${backgroundMix}
  }
`;
