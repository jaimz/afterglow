export type MotionSpeed = "fast" | "medium" | "slow" | "very-slow";
export type MotionPhase = "entry" | "exit";

const durations: Record<MotionSpeed, string> = {
  fast: "motion-fast-duration",
  medium: "motion-medium-duration",
  slow: "motion-slow-duration",
  "very-slow": "motion-very-slow-duration",
};
const exitSpeeds: Record<MotionSpeed, MotionSpeed> = {
  fast: "fast",
  medium: "fast",
  slow: "medium",
  "very-slow": "slow",
};

/** CSS time values may use fractional seconds or milliseconds. */
function milliseconds(value: string): number {
  const match = value.trim().match(/^(\d*\.?\d+)\s*(ms|s)$/);
  return match ? Number(match[1]) * (match[2] === "s" ? 1000 : 1) : 0;
}

/** Resolve theme-local tokens at the moment an animation starts. */
export function getMotionOptions(
  element: HTMLElement,
  phase: MotionPhase = "entry",
  speed: MotionSpeed = "medium",
  staggerIndex = 0
): { duration: number; delay: number; easing: string } {
  const win = element.ownerDocument.defaultView!;
  const css = win.getComputedStyle(element);
  const read = (name: string) => css.getPropertyValue(`--${name}`).trim();
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const effectiveSpeed = phase === "exit" ? exitSpeeds[speed] : speed;
  return {
    duration: reduced ? 0 : milliseconds(read(durations[effectiveSpeed])),
    delay: reduced
      ? 0
      : milliseconds(
          read(phase === "entry" ? "motion-entry-delay" : "motion-exit-delay")
        ) +
        Math.max(0, staggerIndex) * milliseconds(read("motion-stagger-delay")),
    easing:
      read(phase === "entry" ? "motion-entry-curve" : "motion-exit-curve") ||
      "ease",
  };
}
