import { css } from "@microsoft/fast-element";
import { display } from "@microsoft/fast-foundation";
import { designGrid, typography } from "../../design-tokens";

export const sliderLabelStyles = css`
  ${display("block")} :host {
    ${typography.captionText};
  }
  .root {
    position: absolute;
    display: grid;
  }

  .container {
    display: grid;
    justify-self: center;
  }

  .label {
    justify-self: center;
    align-self: center;
    white-space: nowrap;
    max-width: calc(${designGrid.gridY} * 4px);
    margin: 2px 0;
  }
  .mark {
    width: calc(${designGrid.gridType} * 1px);
    height: calc(${designGrid.gridType} * 1px);
    background: currentColor;
    justify-self: center;
  }

  :host(.horizontal) {
    align-self: start;
    grid-row: 2;
    margin-top: -4px;
  }

  :host(.vertical) {
    justify-self: start;
    margin-left: calc(${designGrid.gridY} * 1px);
  }

  :host(.vertical) .label {
    margin-left: calc(${designGrid.gridY} * 1px);
    align-self: center;
  }

  :host(.horizontal) .container {
    grid-template-rows: auto auto;
    grid-template-columns: 0;
  }

  :host(.vertical) .container {
    grid-template-columns: auto auto;
    grid-template-rows: 0;
    min-width: calc(var(--thumb-diameter) * 1px);
    height: calc(var(--thumb-diameter) * 1px);
  }
`;
