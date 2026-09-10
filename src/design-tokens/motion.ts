import { token } from "./token";
import { css, unsafeCSS } from "lit";

export const motionFastDuration = 50;
export const motionMediumDuration = 125;
export const motionSlowDuration = 250;

// export const motionFastDuration = 1000;
// export const motionMediumDuration = 125;
// export const motionSlowDuration = 5000;

export const motionEntryCurve = "ease-in";
export const motionExitCurve = "ease-out";

export const motionPush = 16;

export const motionFastDurationToken = token(
  "motionFastDuration",
  `${motionFastDuration}ms`
);
export const motionMediumDurationToken = token(
  "motionMediumDuration",
  `${motionMediumDuration}ms`
);
export const motionSlowDurationToken = token(
  "motionSlowDuration",
  `${motionSlowDuration}ms`
);
export const motionPushToken = token("motionPush", `${motionPush}px`);

export const motionEntryCurveToken = token(
  "motionEntryCurve",
  motionEntryCurve
);

export const motionExitCurveToken = token("motionExitCurve", motionExitCurve);

type MotionDirection = "entrance" | "exit";

const directionToSpeed = (d: MotionDirection): number => {
  switch (d) {
    case "entrance":
      return motionSlowDuration;
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

/** A transition value suitable for interpolation in a Lit stylesheet. */
export function motionTransition(
  properties: string | string[],
  direction: MotionDirection = "entrance"
) {
  const curve =
    direction === "entrance" ? motionEntryCurveToken : motionExitCurveToken;
  return css`
    ${unsafeCSS(
      (Array.isArray(properties) ? properties : [properties])
        .map((p) => `${p} ${motionSlowDurationToken} ${curve}`)
        .join(", ")
    )}
  `;
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
    duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : directionToSpeed(direction),
    easing: directionToCurve(direction),
    iterations: 1,
    fill: "forwards",
  });
};
