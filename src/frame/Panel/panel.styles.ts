import { css, cssPartial } from "@microsoft/fast-element";

/**
 * Mix this into a css style to give the element a panel appearance.
 */
export const panelMix = cssPartial`
  background: var(--panel);
  color: var(--onPanel);
  box-shadow: var(--elevationShadow);
`;

export const panelStyles = css`
  :host {
    ${panelMix}
  }
`;
