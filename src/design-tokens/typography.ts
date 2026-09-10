import { css } from "lit";
import { token } from "./token";

const defaultFontStack =
  '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const baseFontSize = "16px";

// We scale the typescale automatically according to device formfactor
// const scaleFast = 1.414;
const scaleNormal = 1.2;
// const scaleSlow = 1.125;

export const typeScale = token("type-scale", scaleNormal);

export const bodyFontStack = token("body-font-stack", defaultFontStack);

export const titleFontStack = token("title-font-stack", defaultFontStack);

export const lineHeight = token("line-height", 1.5);

export const bodyTextSize = token("body-text-size", baseFontSize);

export const textScale = token("text-scale", scaleNormal);

export const h5TextSize = token(
  "h5-text-size",
  css`calc(${bodyTextSize} * ${textScale})`
);

export const h4TextSize = token(
  "h4-text-size",
  css`calc(${h5TextSize} * ${textScale})`
);

export const h3TextSize = token(
  "h3-text-size",
  css`calc(${h4TextSize} * ${textScale})`
);

export const h2TextSize = token(
  "h2-text-size",
  css`calc(${h3TextSize} * ${textScale})`
);

export const h1TextSize = token(
  "h1-text-size",
  css`calc(${h2TextSize} * ${textScale})`
);

export const body2TextSize = token(
  "body2-text-size",
  css`calc(${bodyTextSize} / ${textScale})`
);

export const captionTextSize = token(
  "caption-text-size",
  css`calc(${body2TextSize} / ${textScale})`
);

export const smallCaptionTextSize = token(
  "small-caption-text-size",
  css`calc(${captionTextSize} / ${textScale})`
);

export const maxLineWidth = token("max-line-width", "72ch");

export const bodyText = css`
  font-family: ${bodyFontStack};
  font-size: ${bodyTextSize};
  line-height: ${lineHeight};
`;

export const captionText = css`
  font-family: ${bodyFontStack};
  font-size: ${captionTextSize};
  line-height: ${lineHeight};
`;

/** Reusable heading styles; level 1 is the largest heading. */
export function headerText(level: number) {
  const sizes = [h1TextSize, h2TextSize, h3TextSize, h4TextSize, h5TextSize];
  return css`
    font-family: ${titleFontStack};
    font-size: ${sizes[Math.max(0, Math.min(4, Math.trunc(level) - 1))]};
  `;
}
