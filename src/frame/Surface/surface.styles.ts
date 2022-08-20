import { css, cssPartial } from "@microsoft/fast-element";

/**
 * Mix this into a css style to give the element a surface appearance.
 */
export const surfaceMix = cssPartial`
  background: var(--surface);
  color: var(--onSurface);
  box-shadow: var(--elevationShadow);
`;

export const surfaceStyles = css`
  :host {
    ${surfaceMix}
  }
`;
