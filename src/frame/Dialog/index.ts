import { LitElement, html, PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { modalStyles } from "./dialog.styles";
import {
  animateEntry,
  animateExit,
  motionPush,
} from "../../design-tokens/motion";
import { registerElement } from "../../utils/register";

export type ContentAnchor = "left" | "right" | "top" | "bottom" | "center";
export type ContentStretch = "vertical" | "horizontal" | "full" | "none";

export class AGDialog extends LitElement {
  static styles = modalStyles;
  @property({ reflect: true }) anchor: ContentAnchor = "center";
  @property({ reflect: true }) stretch: ContentStretch = "none";
  @property({ type: Boolean, reflect: true }) hidden = false;
  @property({ type: Boolean }) modal = true;
  @property({ type: Boolean, attribute: "trap-focus" }) trapFocus = true;
  @property({ attribute: "aria-label" }) ariaLabel: string | null = null;
  @property({ attribute: "aria-labelledby" }) ariaLabelledby: string | null =
    null;
  @property({ attribute: "aria-describedby" }) ariaDescribedby: string | null =
    null;
  private transition = 0;
  private animations: Animation[] = [];
  private get dialog() {
    return this.shadowRoot?.querySelector("dialog");
  }
  private get control() {
    return this.shadowRoot?.querySelector<HTMLElement>(".control");
  }
  private get overlay() {
    return this.shadowRoot?.querySelector<HTMLElement>(".overlay");
  }

  private stopAnimations() {
    this.animations.forEach((animation) => animation.cancel());
    this.animations = [];
  }
  private get exitTransform() {
    switch (this.anchor) {
      case "left":
        return `translateX(-${motionPush}px)`;
      case "right":
        return `translateX(${motionPush}px)`;
      case "top":
        return `translateY(-${motionPush}px)`;
      case "bottom":
        return `translateY(${motionPush}px)`;
      default:
        return "scale(0.9)";
    }
  }
  async show() {
    ++this.transition;
    this.stopAnimations();
    this.hidden = false;
    await this.updateComplete;
  }
  async hide() {
    const transition = ++this.transition;
    this.stopAnimations();
    if (this.control && this.dialog?.open) {
      this.animations.push(
        animateExit(this.control, [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: this.exitTransform },
        ])
      );
      if (this.overlay)
        this.animations.push(
          animateExit(this.overlay, [{ opacity: 1 }, { opacity: 0 }])
        );
      await Promise.all(
        this.animations.map((animation) =>
          animation.finished.catch(() => undefined)
        )
      );
    }
    if (transition !== this.transition) return;
    this.hidden = true;
    await this.updateComplete;
    this.stopAnimations();
  }
  /** FAST's dismissal contract: request closure; the consumer calls hide(). */
  dismiss() {
    this.dispatchEvent(
      new Event("dismiss", { bubbles: true, composed: true, cancelable: true })
    );
    this.dispatchEvent(
      new Event("cancel", { bubbles: true, composed: true, cancelable: true })
    );
  }
  protected updated(changed: PropertyValues) {
    const dialog = this.dialog;
    if (!dialog || !this.isConnected) return;
    if (this.hidden) {
      if (dialog.open) dialog.close();
      return;
    }
    if (changed.has("modal") && dialog.open) dialog.close();
    if (!dialog.open) {
      if (this.modal) dialog.showModal();
      else dialog.show();
      if (this.control)
        this.animations.push(
          animateEntry(this.control, [
            { opacity: 0, transform: this.exitTransform },
            { opacity: 1, transform: "none" },
          ])
        );
      if (this.overlay)
        this.animations.push(
          animateEntry(this.overlay, [{ opacity: 0 }, { opacity: 1 }])
        );
    }
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("focusin", this.keepFocus);
    this.addEventListener("keydown", this.handleKeyDown);
    this.requestUpdate();
  }
  disconnectedCallback() {
    document.removeEventListener("focusin", this.keepFocus);
    this.removeEventListener("keydown", this.handleKeyDown);
    ++this.transition;
    this.stopAnimations();
    this.dialog?.close();
    super.disconnectedCallback();
  }
  private focusableElements(): HTMLElement[] {
    const collect = (root: Element | ShadowRoot): HTMLElement[] =>
      Array.from(root.querySelectorAll<HTMLElement>("*")).flatMap((element) => [
        ...(element.tabIndex >= 0 &&
        !element.matches(":disabled, [disabled], [hidden]") &&
        element.getClientRects().length
          ? [element]
          : []),
        ...(element.shadowRoot ? collect(element.shadowRoot) : []),
      ]);
    return collect(this);
  }
  private keepFocus = (event: FocusEvent) => {
    // Native modal dialogs handle containment themselves. Non-modal dialogs can
    // retain FAST's optional trap-focus behaviour without making the page inert.
    if (
      !this.modal &&
      this.trapFocus &&
      !this.hidden &&
      !event.composedPath().includes(this)
    ) {
      (this.focusableElements()[0] ?? this.control)?.focus();
    }
  };
  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.hidden || this.modal) return;
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      this.dismiss();
    }
    if (event.key !== "Tab" || !this.trapFocus) return;
    const items = this.focusableElements();
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement)
      active = active.shadowRoot.activeElement;
    const next = event.shiftKey ? items[items.length - 1] : items[0];
    if (
      !items.length ||
      (event.shiftKey
        ? active === items[0]
        : active === items[items.length - 1])
    ) {
      event.preventDefault();
      (next ?? this.control)?.focus();
    }
  };
  private referencedText(ids: string | null) {
    const root = this.getRootNode() as Document | ShadowRoot;
    return (
      ids
        ?.split(/\s+/)
        .map((id) => root.getElementById?.(id)?.textContent ?? "")
        .join(" ")
        .trim() || undefined
    );
  }
  private onClose(event: Event) {
    event.stopPropagation();
    if (this.dialog?.open || !this.isConnected) return;
    this.hidden = true;
    this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
  }
  protected render() {
    return html`<dialog
      class="positioning-region"
      part="positioning-region"
      aria-label=${ifDefined(
        this.ariaLabel || this.referencedText(this.ariaLabelledby)
      )}
      aria-describedby=${ifDefined(
        this.ariaDescribedby ? "description" : undefined
      )}
      @cancel=${(event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        this.dismiss();
      }}
      @close=${this.onClose}
    >
      ${this.modal
        ? html`<div
            class="overlay"
            part="overlay"
            @click=${() => this.dismiss()}
            aria-hidden="true"
          ></div>`
        : null}
      <div class="control" part="control" tabindex="-1"><slot></slot></div>
      <span id="description" hidden
        >${this.referencedText(this.ariaDescribedby)}</span
      >
    </dialog>`;
  }
}
export const agDialog = () => registerElement("ag-dialog", AGDialog);
agDialog();
declare global {
  interface HTMLElementTagNameMap {
    "ag-dialog": AGDialog;
  }
}
