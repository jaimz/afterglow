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
    display: flex;
    justify-content: center;
    align-items: center;

    width: var(--diameter);
    height: var(--diameter);

    box-sizing: border-box;
    border-radius: 50%;
    border: 1px solid ${interact.ctrlBorder};

    color: ${interact.ctrlTextDesat};
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
    display: inline-block;
    background: currentColor;
    width: calc(var(--diameter) - 10px);
    height: calc(var(--diameter) - 10px);
    border-radius: 50%;
  }

  :host(.checked) .checked-indicator {
    opacity: 1;
  }

  :host([variant="backdrop"]) .control {
    color: ${frame.onBackdrop};
    border-color: ${frame.onBackdrop};
  }

  :host([variant="backdrop"]) .label {
    color: ${frame.onBackdrop};
  }

  :host(.disabled) .label,
  :host(.readonly) .label,
  :host(.disabled) .control,
  :host(.readonly) .control {
    cursor: not-allowed;
  }

  :host(.disabled) {
    opacity: ${interact.disabledOpacity};
  }

  :host(:focus-visible) .control {
    box-shadow: 0 2px 4px ${interact.ctrlBorder};
  }
`;
