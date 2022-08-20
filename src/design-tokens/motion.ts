import { DesignToken } from "@microsoft/fast-foundation";
import { CSSDirective } from "@microsoft/fast-element";

export const motionFastDuration = 50;
export const motionMediumDuration = 125;
export const motionSlowDuration = 250;

export const motionEntryCurve = "ease-in";
export const motionExitCurve = "ease-out";

export const motionFastDurationToken = DesignToken.create<string>(
  "motionFastDuration"
).withDefault(`${motionFastDuration}ms`);
export const motionMediumDurationToken = DesignToken.create<string>(
  "motionMediumDuration"
).withDefault(`${motionMediumDuration}ms`);
export const motionSlowDurationToken = DesignToken.create<string>(
  "motionSlowDuration"
).withDefault(`${motionSlowDuration}ms`);

export const motionEntryCurveToken =
  DesignToken.create<string>("motionEntryCurve").withDefault(motionEntryCurve);

export const motionExitCurveToken =
  DesignToken.create<string>("motionExitCurve").withDefault(motionExitCurve);

type MotionDirection = "entrance" | "exit";

const directionToSpeed = (d: MotionDirection): number => {
  switch (d) {
    case "entrance":
      return motionFastDuration;
    case "exit":
      return motionSlowDuration;
  }
};

const directionToCurve = (d: MotionDirection) => {
  switch (d) {
    case "entrance":
      return motionEntryCurve;
    case "exit":
      return motionExitCurve;
  }
};

export class Motion extends CSSDirective {
  private readonly _properties: string | string[];
  private readonly _direction: MotionDirection;

  constructor(
    properties: string | string[],
    direction: MotionDirection = "entrance"
  ) {
    super();
    this._properties = properties;
    this._direction = direction;
  }

  createCSS() {
    const props = Array.isArray(this._properties)
      ? this._properties.join(" ")
      : this._properties;
    const speed = directionToSpeed(this._direction);
    const curve = directionToCurve(this._direction);

    return `t${props} ${speed} ${curve}`;
  }
}

export const animateEntry = (el: Element, keyframes: Keyframe[]) => {
  return animateTransition(el, keyframes, "entrance");
};

export const animateExit = (el: Element, keyframes: Keyframe[]) => {
  return animateTransition(el, keyframes, "exit");
};

const animateTransition = (
  el: Element,
  keyframes: Keyframe[],
  direction: MotionDirection
) => {
  return el.animate(keyframes, {
    duration: directionToSpeed(direction),
    easing: directionToCurve(direction),
    iterations: 1,
    fill: "forwards",
  });
};
