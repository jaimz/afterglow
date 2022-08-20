import { Dialog, dialogTemplate as template } from "@microsoft/fast-foundation";
import { attr } from "@microsoft/fast-element";
import { modalStyles as styles } from "./dialog.styles";
import { animateEntry, animateExit } from "../../design-tokens/motion";

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

  show() {
    super.show();

    if (this.overlay) animateEntry(this.overlay, [{ opacity: 1 }]);
    if (this.control) animateEntry(this.control, [{ opacity: 1 }]);
  }

  hide() {
    let a = null;
    if (this.overlay) a = animateExit(this.overlay, [{ opacity: 0 }]);
    if (this.control) a = animateExit(this.control, [{ opacity: 0 }]);

    if (a) a.addEventListener("finish", () => super.hide());
    else super.hide();
  }
}

export const agDialog = AGDialog.compose({
  baseName: "dialog",
  template,
  styles,
});
