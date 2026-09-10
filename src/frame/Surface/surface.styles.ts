import { surface, onSurface, elevationShadow } from "../frame-tokens";
import { css } from "lit";

/**
 * Mix this into a css style to give the element a surface appearance.
 */
export const surfaceMix = css`
  background: ${surface};
  color: ${onSurface};
  box-shadow: ${elevationShadow};
`;

export const surfaceStyles = css`
  :host([hidden]) {
    display: none;
  }
  :host {
    display: block;
    ${surfaceMix}
  }
`;
