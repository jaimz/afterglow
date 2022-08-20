import { css, cssPartial } from "@microsoft/fast-element";

/**
 * Mix this into a css style to give the element a paper appearance.
 */
export const paperMix = cssPartial`
  background: var(--paper);
  color: var(--onPaper);
  box-shadow: var(--elevationShadow);
`;

export const paperStyles = css`
  :host {
    ${paperMix}
  }
`;
