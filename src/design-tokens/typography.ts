import { CSSDirective, cssPartial } from "@microsoft/fast-element";
import { DesignToken } from "@microsoft/fast-foundation";

const defaultFontStack =
  '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const baseFontSize = "16px";

// We scale the typescale automatically according to device formfactor
// const scaleFast = 1.414;
const scaleNormal = 1.2;
// const scaleSlow = 1.125;

export const typeScale =
  DesignToken.create<number>("type-scale").withDefault(scaleNormal);

export const bodyFontStack =
  DesignToken.create<string>("body-font-stack").withDefault(defaultFontStack);

export const titleFontStack =
  DesignToken.create<string>("title-font-stack").withDefault(defaultFontStack);

export const lineHeight =
  DesignToken.create<number>("line-height").withDefault(1.5);

export const bodyTextSize =
  DesignToken.create<string>("body-text-size").withDefault(baseFontSize);

export const textScale =
  DesignToken.create<number>("text-scale").withDefault(scaleNormal);

export const h5TextSize = DesignToken.create<string>(
  "h5-text-size"
).withDefault("calc(var(--body-text-size) * var(--text-scale))");

export const h4TextSize = DesignToken.create<string>(
  "h4-text-size"
).withDefault("calc(var(--h5-text-size) * var(--text-scale))");

export const h3TextSize = DesignToken.create<string>(
  "h3-text-size"
).withDefault("calc(var(--h4-text-size) * var(--text-scale))");

export const h2TextSize = DesignToken.create<string>(
  "h2-text-size"
).withDefault("calc(var(--h3-text-size) * var(--text-scale))");

export const h1TextSize = DesignToken.create<string>(
  "h1-text-size"
).withDefault("calc(var(--h2-text-size) * var(--text-scale))");

export const body2TextSize = DesignToken.create<string>(
  "body2-text-size"
).withDefault("calc(var(--body-text-size) / var(--text-scale))");

export const captionTextSize = DesignToken.create<string>(
  "caption-text-size"
).withDefault("calc(var(--body2-text-size) / var(--text-scale))");

export const smallCaptionTextSize = DesignToken.create<string>(
  "small=caption-text-size"
).withDefault("calc(var(--caption-text-size) / var(--text-scale))");

export const maxLineWidth =
  DesignToken.create<string>("max-line-width").withDefault("72ch");

export const bodyText = cssPartial`
  font-family: ${defaultFontStack};
  font-size: ${bodyTextSize};
  line-height: ${lineHeight};
`;

export const captionText = cssPartial`
  font-family: ${defaultFontStack};
  font-size: ${captionTextSize};
  line-height: ${lineHeight};
`;

export class HeaderText extends CSSDirective {
  private readonly _level: number;

  constructor(level: number) {
    super();
    this._level = level;
  }

  createCSS() {
    const level = Math.max(Math.max(this._level, 5), 1);

    return `
      font-family: ${titleFontStack};
      font-size: var(--h${level}-text-size);
    `;
  }
}
