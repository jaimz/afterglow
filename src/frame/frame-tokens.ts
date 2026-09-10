import { token } from "../design-tokens/token";

// Layout grid values
const GridDefault = 8;
const GridType = Math.floor(GridDefault / 2);

export const gridX = token("grid-x", `${GridDefault}px`);
export const gridY = token("grid-y", `${GridDefault}px`);
export const gridType = token("grid-type", `${GridType}px`);

// Palette
export const backdrop = token("backdrop", "#695150");

export const backdropLight = token("backdropLight", "#966A6A");

export const onBackdrop = token("onBackdrop", "#E8C9C8");

export const onBackdropAlt = token("onBackdropAlt", "#F3EEE6");

export const backdropKeyline = token("backdropKeyline", "#B59897");

export const backdropTextElevation = token(
  "backdropTextElevation",
  "0 1px 2px rgba(0,0,0,0.2)"
);

export const surface = token("surface", "#E5E5E3");

export const onSurface = token("onSurface", "#53534a");

export const onSurfaceAlt = token("onSurfaceAlt", "#64788C");

export const panel = token("panel", "#F9F9F6");

export const onPanel = token("onPanel", "#53534a");

export const onPanelAlt = token("onPanelAlt", "#64788C");

export const paper = token("paper", "#FFFFFF");

export const onPaper = token("onPaper", "#53534a");

export const onPaperAlt = token("onPaperAlt", "#64788C");

export const modalScrimFill = token("modalScrimFill", "#4653614c");

export const modalScrimFilter = token("modalScrimFilter", "blur(8px)");

export const elevationShadow = token(
  "elevationShadow",
  "0 1px 4px rgba(0,0,0,0.2)"
);
