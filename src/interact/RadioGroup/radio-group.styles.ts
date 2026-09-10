import { css } from "lit";

import { frame, typography, designGrid } from "../../design-tokens";

export const radioGroupStyles = css`
  :host([hidden]) {
    display: none;
  }
  :host {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
  }

  .positioning-region {
    display: flex;
    flex-wrap: wrap;
    gap: calc(${designGrid.gridX} * 2px);
  }

  :host([orientation="vertical"]) .positioning-region {
    flex-direction: column;
  }

  :host([orientation="horizontal"]) .positioning-region {
    flex-direction: row;
  }

  :host([variant="backdrop"]) {
    color: ${frame.onBackdrop};
  }

  ::slotted([slot="label"]) {
    color: currentColor;
    ${typography.captionText};
    margin-bottom: calc(${designGrid.gridY} * 2px);
  }
`;
