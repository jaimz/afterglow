import { enhanceTextField, type TextFieldOptions } from "../../../main";
import { element, escapeHTML, track } from "../../../stories/fixtures";

export interface TextFieldArgs {
  label: string;
  value?: string;
  hint?: string;
  type?: "text" | "search" | "password" | "email" | "url" | "tel" | "number";
  variant?: "default" | "backdrop";
  compact?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
  showValidationIcon?: boolean;
  status?: "none" | "success" | "error";
  errorMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  autocomplete?: string;
}

let nextFieldId = 0;

/** Create accessible native markup; a blank placeholder lets CSS position the label. */
export function createTextField(
  {
    label,
    value = "",
    hint = "",
    type = "text",
    variant = "default",
    compact = false,
    leadingIcon = "",
    trailingIcon = "",
    showValidationIcon = false,
    status = "none",
    errorMessage = "",
    disabled = false,
    readOnly = false,
    required = false,
    name = "field",
    autocomplete = "off",
  }: TextFieldArgs,
  validation?: TextFieldOptions
) {
  const id = `text-field-${++nextFieldId}`;
  const icon = (name: string, position: string) =>
    name
      ? `<span class="ag-text-field__${position}" aria-hidden="true"><span class="ag-icon" data-icon="${escapeHTML(
          name
        )}"></span></span>`
      : "";
  const descriptions = [
    hint ? `${id}-hint` : "",
    status === "error" && errorMessage ? `${id}-error` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const root = element(`<div class="ag-text-field" data-variant="${variant}" ${
    compact ? "data-compact" : ""
  } ${status === "none" ? "" : `data-status="${status}"`}>
    <div class="ag-text-field__control">
      ${icon(leadingIcon, "leading")}
      <input id="${id}" class="ag-text-field__input" type="${type}" name="${escapeHTML(
    name
  )}"
        value="${escapeHTML(value)}" placeholder=" " ${
    descriptions ? `aria-describedby="${descriptions}"` : ""
  }
        autocomplete="${escapeHTML(autocomplete)}"
        ${status === "error" ? 'aria-invalid="true"' : ""}
        ${disabled ? "disabled" : ""} ${readOnly ? "readonly" : ""} ${
    required ? "required" : ""
  }>
      <label class="ag-text-field__label" for="${id}">${escapeHTML(
    label
  )}</label>
      ${icon(trailingIcon, "trailing")}
      ${
        showValidationIcon
          ? '<span class="ag-text-field__status" aria-hidden="true"></span>'
          : ""
      }
    </div>
    ${
      hint
        ? `<p class="ag-text-field__hint" id="${id}-hint">${escapeHTML(
            hint
          )}</p>`
        : ""
    }
    ${
      status === "error" && errorMessage
        ? `<p class="ag-text-field__error" id="${id}-error">${escapeHTML(
            errorMessage
          )}</p>`
        : ""
    }
  </div>`);
  const input = root.querySelector("input")!;
  const controller = validation
    ? track(enhanceTextField(root, validation))
    : undefined;
  return { root, input, controller };
}
