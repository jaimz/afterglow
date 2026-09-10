import { modalScrimFill, modalScrimFilter } from "../frame-tokens";
import { css } from "lit";
import { panelMix } from "../Panel/panel.styles";

export const modalStyles = css`
  :host([hidden]) {
    display: none;
  }

  :host([hidden]) .overlay {
    opacity: 0;
  }

  :host([hidden]) .control {
    opacity: 0;
  }

  :host([anchor="left"]) .positioning-region {
    justify-content: left;
  }

  :host([anchor="right"]) .positioning-region {
    justify-content: right;
  }

  :host([anchor="top"]) .positioning-region {
    align-items: flex-start;
  }

  :host([anchor="bottom"]) .positioning-region {
    align-items: flex-end;
  }

  :host([anchor="top"]) .control,
  :host([anchor="bottom"]) .control {
    margin-top: inherit;
    margin-bottom: inherit;
  }

  :host([stretch="vertical"]) .control,
  :host([stretch="full"]) .control {
    height: 100%;
  }

  :host([stretch="horizontal"]) .control,
  :host([stretch="full"]) .control {
    width: 100%;
  }

  :host {
    --default-width: 640px;
    --default-height: 480px;

    display: block;
  }

  .positioning-region {
    display: none;
    justify-content: center;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: auto;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    pointer-events: none;
  }
  .positioning-region[open] {
    display: flex;
  }
  .positioning-region::backdrop {
    background: transparent;
  }

  .overlay {
    pointer-events: auto;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    background: ${modalScrimFill};
    backdrop-filter: ${modalScrimFilter};

    touch-action: none;
  }

  .control {
    pointer-events: auto;
    flex-shrink: 0;
    max-width: 100%;
    box-sizing: border-box;
    margin-top: auto;
    margin-bottom: auto;
    width: var(--default-width);
    height: var(--default-height);
    z-index: 1;
    ${panelMix}
  }
`;
