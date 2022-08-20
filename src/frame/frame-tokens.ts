import { DesignToken } from "@microsoft/fast-foundation";

// Layout grid values
const GridDefault = 8;
const GridType = Math.floor(GridDefault / 2);

export const gridX = DesignToken.create<string>("grid-x").withDefault(
  `${GridDefault}px`
);
export const gridY = DesignToken.create<string>("grid-y").withDefault(
  `${GridDefault}px`
);
export const gridType = DesignToken.create<string>("grid-type").withDefault(
  `${GridType}px`
);

// Palette
export const background =
  DesignToken.create<string>("background").withDefault("#695150");

export const backgroundLight =
  DesignToken.create<string>("backgroundLight").withDefault("#966A6A");

export const onBackground =
  DesignToken.create<string>("onBackground").withDefault("#E8C9C8");

export const onBackgroundAlt =
  DesignToken.create<string>("onBackgroundAlt").withDefault("#F3EEE6");

export const backGroundTextElevation = DesignToken.create<string>(
  "backgroundTextElevation"
).withDefault("0 1px 2px rgba(0,0,0,0.2)");

export const surface =
  DesignToken.create<string>("surface").withDefault("#E5E5E3");

export const onSurface =
  DesignToken.create<string>("onSurface").withDefault("#53534a");

export const onSurfaceAlt =
  DesignToken.create<string>("onSurfaceAlt").withDefault("#64788C");

export const panel = DesignToken.create<string>("panel").withDefault("#F9F9F6");

export const onPanel =
  DesignToken.create<string>("onPanel").withDefault("#53534a");

export const onPanelAlt =
  DesignToken.create<string>("onPanelAlt").withDefault("#64788C");

export const paper = DesignToken.create<string>("paper").withDefault("#FFFFFF");

export const onPaper =
  DesignToken.create<string>("onPaper").withDefault("#53534a");

export const onPaperAlt =
  DesignToken.create<string>("onPaperAlt").withDefault("#64788C");

export const modalScrimFill =
  DesignToken.create<string>("modalScrimFill").withDefault("#4653614c");

export const modalScrimFilter =
  DesignToken.create<string>("modalScrimFilter").withDefault("blur(8px)");

export const elevationShadow = DesignToken.create<string>(
  "elevationShadow"
).withDefault("0 1px 4px rgba(0,0,0,0.2)");
