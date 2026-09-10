import { css, html } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FormControl } from "../form-control";
import { buttonStyles } from "./button.styles";
import { registerElement } from "../../utils/register";

export type Variant = "default" | "flat" | "primary" | "outline" | "fab";

export class Button extends FormControl {
  static styles = [
    FormControl.styles,
    buttonStyles,
    css`
      :host(:focus-within) {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
      :host(:focus-within) .control {
        outline: none;
      }
      :host(.disabled) {
        opacity: var(--disabled-opacity, 0.5);
        cursor: default;
      }
      .content {
        display: inline-flex;
        align-items: center;
      }
      ::slotted([slot="start"]) {
        margin-inline-end: 8px;
      }
      ::slotted([slot="end"]) {
        margin-inline-start: 8px;
      }
    `,
  ];
  @property({ reflect: true }) variant: Variant = "default";
  @property({ type: Boolean, reflect: true }) dangerous = false;
  @property() type: "button" | "submit" | "reset" = "button";
  @property({ attribute: "form", reflect: true }) formId: string | undefined;
  @property() formaction: string | undefined;
  @property() formenctype: string | undefined;
  @property() formmethod: string | undefined;
  @property({ type: Boolean }) formnovalidate = false;
  @property() formtarget: string | undefined;
  @property({ attribute: "aria-expanded" }) ariaExpanded: string | null = null;
  @property({ attribute: "aria-pressed" }) ariaPressed: string | null = null;
  @property({ attribute: "aria-controls" }) ariaControls: string | null = null;
  @property({ attribute: "aria-haspopup" }) ariaHaspopup: string | null = null;

  protected syncForm() {
    this.internals.setFormValue(null);
  }

  private activate(event: MouseEvent) {
    // Allow consumer click handlers to cancel the default action first.
    queueMicrotask(() => {
      if (event.defaultPrevented || this.effectiveDisabled || !this.form)
        return;
      if (this.type === "reset") this.form.reset();
      if (this.type !== "submit") return;
      // A custom element isn't a valid requestSubmit submitter. A temporary native
      // button preserves name/value, validation and per-button overrides.
      const submitter = document.createElement("button");
      submitter.type = "submit";
      submitter.hidden = true;
      submitter.name = this.name;
      submitter.value = this.value;
      for (const attribute of [
        "formaction",
        "formenctype",
        "formmethod",
        "formtarget",
      ] as const) {
        const value = this[attribute];
        if (value !== undefined) submitter.setAttribute(attribute, value);
      }
      submitter.formNoValidate = this.formnovalidate;
      const form = this.form;
      form.append(submitter);
      try {
        form.requestSubmit(submitter);
      } finally {
        submitter.remove();
      }
    });
  }

  protected render() {
    return html`<button
        class="control"
        part="control"
        type="button"
        ?disabled=${this.effectiveDisabled}
        ?autofocus=${this.autofocus}
        aria-label=${ifDefined(this.accessibleLabel)}
        aria-describedby=${ifDefined(
          this.ariaDescribedby ? "description" : undefined
        )}
        aria-expanded=${ifDefined(this.ariaExpanded ?? undefined)}
        aria-pressed=${ifDefined(this.ariaPressed ?? undefined)}
        aria-controls=${ifDefined(this.ariaControls ?? undefined)}
        aria-haspopup=${ifDefined(this.ariaHaspopup ?? undefined)}
        @click=${this.activate}
      >
        <slot name="start"></slot
        ><span class="content" part="content"
          ><slot @slotchange=${() => this.requestUpdate()}></slot></span
        ><slot name="end"></slot></button
      >${this.renderDescription()}`;
  }
}

export const agButton = () => registerElement("ag-button", Button);
agButton();
declare global {
  interface HTMLElementTagNameMap {
    "ag-button": Button;
  }
}
