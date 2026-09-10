import { CSSResult, unsafeCSS } from "lit";

/** A themeable CSS variable with a built-in default, including in shadow DOM. */
export function token(
  name: string,
  fallback: string | number | CSSResult
): CSSResult {
  return unsafeCSS(`var(--${name}, ${fallback})`);
}
