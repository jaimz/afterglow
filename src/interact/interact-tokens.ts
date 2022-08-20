import { DesignToken } from "@microsoft/fast-foundation";

export const ctrlText =
  DesignToken.create<string>("ctrlText").withDefault("#007693");

const CtrlFillHi = "#ffffff";
const CtrlFillLo = "#f0f0ed";
const CtrlFillDark = "#e6e6e6";

export const ctrlFillHi =
  DesignToken.create<string>("ctrl-fill-hi").withDefault(CtrlFillHi);
export const ctrlFillLo =
  DesignToken.create<string>("ctrl-fill-lo").withDefault(CtrlFillLo);
export const ctrlFillDark =
  DesignToken.create<string>("ctrl-fill-dark").withDefault(CtrlFillDark);

export const ctrlFill = DesignToken.create<string>("ctrl-fill").withDefault(
  `radial-gradient(102.33% 168.95% at 50% 0%, ${CtrlFillHi} 0%, ${CtrlFillHi} 37.77%, ${CtrlFillDark} 100%)`
);

export const ctrlFillHover = DesignToken.create<string>(
  "ctrl-fill-hover"
).withDefault(
  `radial-gradient(272.33% 168.95% at 50% 0%,) ${CtrlFillHi} 0%, ${CtrlFillHi} 40.96%, ${CtrlFillDark} 100%)`
);

export const ctrlFillActive = DesignToken.create<string>(
  "ctrl-fill-active"
).withDefault(
  `radial-gradient(272.33% 168.95% at 50% 0%, ${CtrlFillDark} 0%, ${CtrlFillHi} 90.96%, ${CtrlFillLo} 100%)`
);

export const ctrlFillSolid =
  DesignToken.create<string>("ctrl-fill-solid").withDefault("#007693");

export const onCtrlFillSolid =
  DesignToken.create<string>("on-ctrl-fill-solid").withDefault("#f3eee6");

export const ctrlFillSolidHi =
  DesignToken.create<string>("ctrl-fill-solid-hi").withDefault("#149cbd");

export const ctrlFillSolidLo =
  DesignToken.create<string>("ctrl-fill-solid-lo").withDefault("#004c5e");

export const ctrlBorder = DesignToken.create<string>("ctrl-border").withDefault(
  "rgba(110, 163, 176, 0.6)"
);

export const disabledOpacity =
  DesignToken.create<number>("disabled-opacity").withDefault(0.5);
