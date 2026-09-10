import { panel, onPanel, elevationShadow } from "../frame-tokens";
import { css } from "lit";

/**
 * Mix this into a css style to give the element a panel appearance.
 */
export const panelMix = css`
  background: ${panel};
  color: ${onPanel};
  box-shadow: ${elevationShadow};
`;

export const panelStyles = css`
  :host([hidden]) {
    display: none;
  }
  :host {
    display: block;
    ${panelMix}
  }
`;
