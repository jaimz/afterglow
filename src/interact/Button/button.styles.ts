import { css } from "@microsoft/fast-element";
import { display } from "@microsoft/fast-foundation";

import { typography, frame, indicate, interact } from "../../design-tokens";
import { ctrlFillLo } from "../interact-tokens";

const BaseButtonStyles = css`
  ${display("inline-flex")} :host {
    outline: none;
    font-family: ${typography.bodyFontStack};
    line-height: ${typography.lineHeight};
    cursor: pointer;
    background: ${interact.ctrlFill};
    color: ${interact.ctrlText};
    border: 1px solid ${interact.ctrlBorder};
    border-radius: ${frame.gridType};
  }

  .control {
    background: transparent;
    height: inherit;
    flex-grow: 1;
    box-sizing: border-box;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 8px;
    white-space: nowrap;
    outline: none;
    text-decoration: none;
    border: none;
    color: inherit;
    border-radius: inherit;
    cursor: inherit;
    font-family: inherit;
    max-width: 300px;
  }

  :host(:hover) {
    background: ${interact.ctrlFillHover};
  }

  :host(:active) {
    background: ${interact.ctrlFillActive};
  }

  :host(:focus-visible) {
    box-shadow: 0 2px 4px ${interact.ctrlBorder};
  }

  :host([dangerous]) {
    color: ${indicate.error};
  }

  :host([disabled]),
  :host([disabled]:hover) {
    opacity: ${interact.disabledOpacity};
    background: ${ctrlFillLo};
    cursor: default;
  }
`;

const FlatButtonStyles = css`
  :host([variant="flat"]) {
    background: transparent;
    border-color: transparent;
  }

  :host([variant="flat"]:active) {
    background: ${interact.ctrlFillLo};
  }

  :host([variant="flat"]:hover) {
    background: ${interact.ctrlFillHi};
  }

  :host([variant="flat"][dangerous]) {
    color: ${indicate.error};
  }

  :host([variant="flat"][disabled]),
  :host([variant="flat"][disabled]:hover) {
    opacity: ${interact.disabledOpacity};
    background: ${interact.ctrlFillLo};
  }
`;

const PrimaryButtonStyles = css`
  :host([variant="primary"]) {
    background: ${interact.ctrlFillSolid};
    color: ${interact.onCtrlFillSolid};
    border-color: transparent;
  }

  :host([variant="primary"]:hover) {
    background: ${interact.ctrlFillSolidHi};
  }

  :host([variant="primary"]:active) {
    background: ${interact.ctrlFillSolidLo};
  }

  :host([variant="primary"][dangerous]) {
    background: ${indicate.error};
    color: ${indicate.onError};
  }

  :host([variant="primary"][disabled]),
  :host([variant="primary"][disabled]:hover) {
    opacity: ${interact.disabledOpacity};
    background: ${interact.ctrlFillSolid};
    cursor: default;
  }
`;

const OutlineButtonStyles = css`
  :host([variant="outline"]) {
    background: transparent;
  }

  :host([variant="outline"]:hover) {
    background: ${interact.ctrlFillHover};
  }

  :host([variant="outline"]:active) {
    background: ${interact.ctrlFillActive};
  }

  :host([variant="outline"][dangerous]) {
    border-color: ${indicate.error};
    color: ${indicate.error};
  }

  :host([variant="outline"][disabled]),
  :host([variant="outline"][disabled]:hover) {
    opacity: ${interact.disabledOpacity};
  }
`;

export const buttonStyles = () => css`
  ${BaseButtonStyles}
  ${FlatButtonStyles}
  ${PrimaryButtonStyles}
  ${OutlineButtonStyles}
`;
