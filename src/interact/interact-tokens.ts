import { token } from "../design-tokens/token";

export const ctrlText = token("ctrlText", "#007693");

// Slightly desaturated version of control text - use at your discretion
export const ctrlTextDesat = token("ctrlTextDesat", "#5e8c97");
export const ctrlTextDesat40 = token("ctrlTextDesat40", "#5e8c97");

// Desaturated ctrlText for control hint or subtitle text
export const ctrlHint = token("ctrlHint", "#6EA3B0");
export const ctrlHint50 = token("ctrlHint50", "#6EA3B088");

const CtrlFillHi = "#ffffff";
const CtrlFillLo = "#f0f0ed";
const CtrlFillDark = "#e6e6e6";

export const ctrlFillHi = token("ctrl-fill-hi", CtrlFillHi);
export const ctrlFillLo = token("ctrl-fill-lo", CtrlFillLo);
export const ctrlFillDark = token("ctrl-fill-dark", CtrlFillDark);

export const ctrlFill = token(
  "ctrl-fill",
  `radial-gradient(102.33% 168.95% at 50% 0%, ${CtrlFillHi} 0%, ${CtrlFillHi} 37.77%, ${CtrlFillDark} 100%)`
);

export const ctrlFillHover = token(
  "ctrl-fill-hover",
  `radial-gradient(272.33% 168.95% at 50% 0%, ${CtrlFillHi} 0%, ${CtrlFillHi} 40.96%, ${CtrlFillDark} 100%)`
);

export const ctrlFillActive = token(
  "ctrl-fill-active",
  `radial-gradient(272.33% 168.95% at 50% 0%, ${CtrlFillDark} 0%, ${CtrlFillHi} 90.96%, ${CtrlFillLo} 100%)`
);

export const ctrlFillSolid = token("ctrl-fill-solid", "#007693");

export const onCtrlFillSolid = token("on-ctrl-fill-solid", "#f3eee6");

export const ctrlFillSolidHi = token("ctrl-fill-solid-hi", "#149cbd");

export const ctrlFillSolidLo = token("ctrl-fill-solid-lo", "#004c5e");

export const ctrlFillSolidDesaturate = token(
  "ctrlFillSolidDesaturate",
  "#5E8C97"
);

export const ctrlFillSolidDesaturate40 = token(
  "ctrlFillSolidDesaturate40",
  "rgba(94,140,151,0.4)"
);

export const ctrlBorder = token("ctrl-border", "rgba(110, 163, 176, 0.6)");

export const disabledOpacity = token("disabled-opacity", 0.5);
