import { css, cssPartial } from "@microsoft/fast-element";

export const backgroundMix = cssPartial`
  width: 100%;
  height: 100%;
  background: radial-gradient(
    ellipse 90% 80% at top,
    var(--backgroundLight),
    var(--background)
  );
  color: var(--onBackground);
  text-shadow: var(--backgroundTextElevation);
`;

export const backgroundStyles = css`
  :host {
    ${backgroundMix}
  }
`;
