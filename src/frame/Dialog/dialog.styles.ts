import { css } from "@microsoft/fast-element";
import { surfaceMix } from "../Surface/surface.styles";

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
    display: flex;
    justify-content: center;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: auto;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    background: var(--modalScrimFill);
    backdrop-filter: var(--modalScrimFilter);

    touch-action: none;
  }

  .control {
    margin-top: auto;
    margin-bottom: auto;
    width: var(--default-width);
    height: var(--default-height);
    z-index: 1;
    ${surfaceMix}
  }
`;
