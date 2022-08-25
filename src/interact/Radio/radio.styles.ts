import { css } from "@microsoft/fast-element";
import { display } from "@microsoft/fast-foundation";

import { frame, interact, designGrid, typography } from "../../design-tokens";

export const radioStyles = css`
  ${display("inline-flex")} :host {
    --diameter: calc(${designGrid.gridX} * 3px);
    align-items: center;
    outline: none;
    user-select: none;
    gap: calc(${designGrid.gridX} * 2px);
  }

  .control {
    position: relative;
    width: var(--diameter);
    height: var(--diameter);

    box-sizing: border-box;
    border-radius: 50%;
    border: 1px solid ${interact.ctrlBorder};
  }

  .label {
    font-family: ${typography.bodyFontStack};
    color: currentColor;
    cursor: pointer;
  }

  .label__hidden {
    display: none;
    visibility: hidden;
  }

  .control,
  .checked-indicator {
    flex-shrink: 0;
  }

  .checked-indicator {
    opacity: 0;
    pointer-events: none;
  }
`;
