import { css } from "@microsoft/fast-element";
import { DesignToken, display } from "@microsoft/fast-foundation";
import { designGrid, interact, frame } from "../../design-tokens";
import { opacify } from "../../utils/colours";

const backdropTrack = DesignToken.create<string>("backdrop-track");
backdropTrack.withDefault((element) => {
  const original = frame.onBackdrop.getValueFor(element);
  return opacify(original, 0.4);
});

export const sliderStyles = css`
  ${display("inline-grid")} :host {
    --thumb-diameter: 20px;
    --track-width: calc(calc(${designGrid.gridType} - 1) * 1px);
    --track-corner-radius: calc(var(--track-width) / 2 * 1px);
    align-items: center;
    width: 100%;
    user-select: none;
    box-sizing: border-box;
    outline: none;
    cursor: pointer;
  }

  :host(.vertical) {
    height: 100%;
    min-height: calc(${designGrid.gridY} * 60px);
  }

  :host(.disabled),
  :host(.readonly) {
    cursor: not-allowed;
  }

  :host(.disabled) {
    opacity: ${interact.disabledOpacity};
  }

  .positioning-region {
    position: relative;
    margin: 0 calc(${designGrid.gridY} * 1px);
    display: grid;
  }

  :host(.horizontal) .positioning-region {
    grid-template-rows: var(--thumb-diameter) 1fr;
    align-items: center;
  }

  :host(.vertical) .positioning-region {
    height: 100%;
    grid-template-columns: calc(var(--thumb-diameter) * 1px) 1fr;
  }

  .thumb {
    box-sizing: border-box;
    border: 1px solid ${interact.ctrlTextDesat};
    background: ${interact.ctrlFill};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    height: var(--thumb-diameter);
    width: var(--thumb-diameter);
    border-radius: 50%;
  }

  .thumb-container {
    position: absolute;
    height: var(--thumb-diameter);
    width: var(--thumb-diameter);
  }

  :host(.horizontal) .thumb-container {
    margin-right: calc(var(--thumb-diameter) / -2);
  }

  :host(.vertical) .thumb-container {
    margin-bottom: calc(var(--thumb-diameter) / -2);
    margin-left: calc(${designGrid.gridY} * -1px);
  }

  .track {
    background: ${interact.ctrlFillSolidDesaturate40};
    border-radius: var(--track-corner-radius);
    position: absolute;
  }

  :host([marks]) .track .mark {
    display: inline-block;
    position: absolute;
    background: ${interact.ctrlFillSolidDesaturate};
    width: var(--track-width);
    height: var(--track-width);
  }

  :host(.horizontal) .track {
    right: 0;
    left: 0;
    height: var(--track-width);
  }

  :host(.vertical) .track {
    top: 0;
    bottom: 0;
    width: var(--track-width);
  }

  .track-start {
    background: ${interact.ctrlFillSolidDesaturate};
    position: absolute;
    height: 100%;
    left: 0;
    border-radius: var(--track-corner-radius);
  }

  :host(.vertical) .track-start {
    height: auto;
    width: 100%;
    top: 0;
  }

  :host([variant="backdrop"]) {
    color: ${frame.onBackdrop};
  }

  :host([variant="backdrop"]) .track {
    background: ${backdropTrack};
  }

  :host([variant="backdrop"]) .track-start {
    background: ${frame.onBackdrop};
  }

  :host([variant="backdrop"]) .thumb {
    background: ${frame.onBackdrop};
    border: 1px solid ${frame.backdrop};
  }

  :host([marks][variant="backdrop"]) .track .mark {
    background: ${frame.onBackdrop};
  }
`;
