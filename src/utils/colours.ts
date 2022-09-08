/**
 * Change the opacity of a given colour. The colour returned will
 * have the same r,g,b values but its alpha value will be multiplied
 * by alphaAdjust
 *
 * @param color The colour to opacify
 * @param alphaAdjust Multiply the existing opacity by this.
 */
export function opacify(color: string, alphaAdjust: number) {
  let alpha = 1;
  let r = 0;
  let g = 0;
  let b = 0;

  if (color.startsWith("rgb")) {
    // This mess wil capture the r,g,b and alpha values from an rgb/rgba string
    // including spaced (rgb(155 155  155 / 0.5) strings
    const re =
      /rgba*\((?<r>\d{1,3}),*\s*(?<g>\d{1,3}),*\s*(?<b>\d{1,3}),*\s*(?:\/\s*(?<alphaFunc>\d\.*\d*)|(?<alphaRgba>\d\.*\d*))*\)/;
    const capture = re.exec(color);
    if (capture && capture.groups) {
      const { groups } = capture;
      r = parseInt(groups.r);
      g = parseInt(groups.g);
      b = parseInt(groups.b);

      const aStr = groups.alphaFunc ?? groups.alphaRgba ?? "1";
      alpha = parseFloat(aStr);

      if (isNaN(r)) throw TypeError(`${groups.r} is not a valid red value`);
      if (isNaN(g)) throw TypeError(`${groups.g} is not a valid green value`);
      if (isNaN(b)) throw TypeError(`${groups.b} is not a valid blue value`);
      if (isNaN(alpha)) throw TypeError(`${aStr} is not a valid alpha value`);
    } else {
      throw new TypeError("Could not capture anything from rgb color");
    }
  } else if (color.startsWith("#")) {
    const colorHex = color.substring(1);
    if (colorHex.length < 6) {
      throw new TypeError(
        `Hex numbers must have at least six digits: ${color}`
      );
    }

    r = parseInt(colorHex.substring(0, 2), 16);
    g = parseInt(colorHex.substring(2, 4), 16);
    b = parseInt(colorHex.substring(4, 6), 16);
    if (colorHex.length > 6)
      alpha = 255 / parseInt(colorHex.substring(6, 8), 16);

    if (isNaN(r))
      throw TypeError(`${colorHex.substring(0, 2)} is not a valid red value`);
    if (isNaN(g))
      throw TypeError(`${colorHex.substring(2, 4)} is not a valid green value`);
    if (isNaN(b))
      throw TypeError(`${colorHex.substring(4, 6)} is not a valid blue value`);
    if (isNaN(alpha))
      throw TypeError(`${colorHex.substring(6, 8)} is not a valid alpha value`);
  } else {
    throw new TypeError(`Could not parse rgba color: ${color}`);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha * alphaAdjust})`;
}
