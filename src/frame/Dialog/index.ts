import { Dialog, dialogTemplate as template } from "@microsoft/fast-foundation";
import { attr } from "@microsoft/fast-element";
import { modalStyles as styles } from "./dialog.styles";
import {
  animateEntry,
  animateExit,
  motionPush,
} from "../../design-tokens/motion";

export type ContentAnchor = "left" | "right" | "top" | "bottom" | "center";
export type ContentStretch = "vertical" | "horizontal" | "full" | "none";

export class AGDialog extends Dialog {
  // @ts-ignore
  @attr public anchor: ContentAnchor;
  // @ts-ignore
  @attr public stretch: ContentStretch;

  // @ts-ignore
  private overlay: Element | null;
  // @ts-ignore
  private control: Element | null;

  constructor() {
    super();
  }

  public connectedCallback() {
    super.connectedCallback();

    if (!this.anchor) {
      const anchorValue = this.getAttribute("anchor");
      this.anchor = anchorValue as ContentAnchor;
    }

    if (!this.stretch) {
      const stretchValue = this.getAttribute("stretch");
      this.stretch = stretchValue as ContentStretch;
    }

    this.overlay = this.shadowRoot?.querySelector(".overlay") || null;
    this.control = this.shadowRoot?.querySelector(".control") || null;
  }

  // Play the animation to show the dialog
  private animateEntry() {
    if (this.overlay) animateEntry(this.overlay, [{ opacity: 1 }]);
    if (this.control)
      animateEntry(this.control, [{ opacity: 1, transform: "none" }]);
  }

  private controlExitFrame(): Keyframe[] {
    const frame: Keyframe = { opacity: 0 };
    switch (this.anchor) {
      case "center":
        frame.transform = "scale(0.9)";
        break;
      case "top":
        frame.transform = `translateY(${0 - motionPush}px)`;
        break;
      case "bottom":
        frame.transform = `translateY(${motionPush}px)`;
        break;
      case "left":
        frame.transform = `translateX(${0 - motionPush}px)`;
        break;
      case "right":
        frame.transform = `translateX(${motionPush}px)`;
        break;
    }

    return [frame];
  }

  // Play the animation to hide the dialog
  // Returns the animation so we can call super.hide on completion.
  private animateExit(): Animation | null {
    let a = null;
    if (this.overlay) a = animateExit(this.overlay, [{ opacity: 0 }]);
    if (this.control) a = animateExit(this.control, this.controlExitFrame());

    return a;
  }

  show() {
    super.show();
    this.animateEntry();
  }

  hide() {
    const a = this.animateExit();

    if (a) a.addEventListener("finish", () => super.hide());
    else super.hide();
  }
}

export const agDialog = AGDialog.compose({
  baseName: "dialog",
  template,
  styles,
});
