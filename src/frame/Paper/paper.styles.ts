import { paper, onPaper, elevationShadow } from "../frame-tokens";
import { css } from "lit";

/**
 * Mix this into a css style to give the element a paper appearance.
 */
export const paperMix = css`
  background: ${paper};
  color: ${onPaper};
  box-shadow: ${elevationShadow};
`;

export const paperStyles = css`
  :host([hidden]) {
    display: none;
  }
  :host {
    display: block;
    ${paperMix}
  }
`;
