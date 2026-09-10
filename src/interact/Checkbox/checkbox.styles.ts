import { css } from "lit";

import { frame, interact, designGrid, typography } from "../../design-tokens";

export const checkboxStyles = css`
  :host([hidden]) {
    display: none;
  }
  :host {
    display: inline-flex;
    align-items: center;
    outline: none;
    user-select: none;
    gap: calc(${designGrid.gridX} * 2px);
  }

  .control {
    position: relative;
    width: calc(${designGrid.gridX} * 3px);
    height: calc(${designGrid.gridY} * 3px);
    border-radius: calc(${designGrid.gridType} * 1px);
    border: 1px solid ${interact.ctrlBorder};
    outline: none;
    cursor: pointer;
    color: ${interact.ctrlText};
    display: flex;
    justify-content: center;
    align-items: center;
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

  .checked-indicator {
    opacity: 0;
    pointer-events: none;
    stroke: currentcolor;
  }

  .indeterminate-indicator {
    border-radius: 2px;
    background: currentcolor;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    height: 2px;
    transform: translate(-50%, -50%);
    opacity: 0;
  }

  :host(:is([variant="solid"], [variant="filled"])) .checked-indicator,
  :host(:is([variant="solid"], [variant="filled"])) .indeterminate-indicator {
    color: ${interact.onCtrlFillSolid};
  }

  :host([variant="backdrop"]) .checked-indicator,
  :host([variant="backdrop"]) .indeterminate-indicator {
    color: ${frame.backdrop};
  }

  :host([variant="backdrop"]) .control {
    color: ${frame.backdrop};
    border-color: ${frame.backdropKeyline};
  }

  :host([variant="backdrop"]) .label {
    color: ${frame.onBackdrop};
  }

  :host(.checked:is([variant="solid"], [variant="filled"])) .control {
    border: 1px solid ${interact.ctrlFillSolid};
    background: ${interact.ctrlFillSolid};
  }

  :host(.checked[variant="backdrop"]) .control,
  :host(.indeterminate) .control {
    background: ${frame.onBackdrop};
    border-color: ${frame.onBackdrop};
  }

  :host(:focus-visible) .control {
    box-shadow: 0 2px 4px ${interact.ctrlBorder};
  }

  :host(.checked:not(.indeterminate)) .checked-indicator,
  :host(.indeterminate) .indeterminate-indicator {
    opacity: 1;
  }

  :host(.disabled) {
    opacity: ${interact.disabledOpacity};
  }

  :host(.disabled) .label,
  :host(.readonly) .label,
  :host(.readonly) .control,
  :host(.disabled) .control {
    cursor: not-allowed;
  }
`;
