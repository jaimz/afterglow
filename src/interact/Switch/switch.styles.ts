import { css } from "@microsoft/fast-element";
import { display } from "@microsoft/fast-foundation";
import {
  designGrid,
  motion,
  interact,
  frame,
  typography,
} from "../../design-tokens";

export const switchStyles = css`
  ${display("inline-flex")} :host {
    --indicator-radius: 20px;
    align-items: center;
    outline: none;
    user-select: none;
    gap: calc(${designGrid.gridX} * 1px);
  }

  .switch {
    position: relative;
    outline: none;
    box-sizing: border-box;
    width: calc(${designGrid.gridX} * 5px);
  }

  .switch::before {
    box-sizing: border-box;
    content: " ";
    position: absolute;
    background: ${interact.ctrlHint50};
    height: calc(${designGrid.gridY} * 1px);
    border-radius: calc(${designGrid.gridY} / 2 * 1px);
    top: 50%;
    width: 100%;
    transform: translateY(-50%);
  }

  .indicator {
    position: relative;
    width: var(--indicator-radius);
    height: var(--indicator-radius);
    border-radius: 50%;
    background: ${interact.ctrlFill};
    border: 1px solid ${interact.ctrlHint50};
    z-index: 1;
    transition: left ${motion.motionSlowDurationToken} ease-out;
  }

  :host(.checked) .indicator {
    background: ${interact.ctrlText};
    left: calc(100% - var(--indicator-radius));
    border-color: ${interact.ctrlText};
  }

  :host([variant="backdrop"]) .switch::before {
    // height: calc(${designGrid.gridY} - 2 * 1px);
    border: 1px solid ${frame.backdropKeyline};
    background: none;
  }

  :host([variant="backdrop"]) .indicator {
    background: ${frame.backdropKeyline};
    border: none;
  }

  :host([variant="backdrop"].checked) .indicator {
    background: ${frame.onBackdrop};
  }

  :host([variant="backdrop"].checked) .switch::before {
    background: ${frame.backdropKeyline};
  }

  .label {
    color: currentColor;
    font-family: ${typography.bodyFontStack};
    flex-grow: 1;
    cursor: pointer;
  }
`;
