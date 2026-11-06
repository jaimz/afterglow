export interface MarkupIssue {
  element: Element;
  message: string;
}

/** Check hand-authored recipes before enhancement, or in application development/tests. */
export function validateMarkup(root: ParentNode): MarkupIssue[] {
  const issues: MarkupIssue[] = [];
  const selector =
    ".ag-checkbox,.ag-radio,.ag-switch,.ag-slider,.ag-text-field,.ag-token-field,.ag-tabbed-view,.ag-index-detail";
  const elements = [
    ...(root instanceof Element && root.matches(selector) ? [root] : []),
    ...root.querySelectorAll(selector),
  ];
  for (const element of elements) {
    const require = (selector: string, message: string) => {
      if (!element.querySelector(selector)) issues.push({ element, message });
    };
    if (element.matches(".ag-checkbox,.ag-radio,.ag-switch")) {
      const radio = element.matches(".ag-radio"),
        toggle = element.matches(".ag-switch");
      require(`:scope > input.ag-check__input[type="${
        radio ? "radio" : "checkbox"
      }"]`, "A checkable needs a direct native input.ag-check__input of the matching type.");
      const input = element.querySelector(":scope > input.ag-check__input");
      const decoration = element.querySelector(
        toggle ? ":scope > .ag-switch__track" : ":scope > .ag-check__control"
      );
      if (
        !decoration ||
        (input &&
          !(
            input.compareDocumentPosition(decoration) &
            Node.DOCUMENT_POSITION_FOLLOWING
          ))
      )
        issues.push({
          element,
          message:
            "Put the checkable input before its direct decorative control/track sibling.",
        });
      if (toggle)
        require(":scope > .ag-switch__track > .ag-switch__thumb", "A switch track needs an ag-switch__thumb child.");
      else
        require(":scope > .ag-check__control .ag-check__tick", "A checkbox/radio control needs an ag-check__tick decoration.");
    }
    if (element.matches(".ag-slider")) {
      require(":scope > .ag-slider__control > input[type=range]", "A slider needs a direct control containing a native range input.");
      require(":scope > .ag-slider__control > .ag-slider__track > .ag-slider__fill", "A slider track needs an ag-slider__fill child.");
      if (element.hasAttribute("data-marks"))
        require(".ag-slider__marks", "A marked slider needs an ag-slider__marks container.");
    }
    if (element.matches(".ag-text-field,.ag-token-field"))
      require(":scope > .ag-text-field__control > input.ag-text-field__input", "A text field needs a direct control containing input.ag-text-field__input.");
    if (element.matches(".ag-tabbed-view"))
      require(":scope > .ag-tab-strip", "A tabbed view needs a direct ag-tab-strip child.");
    if (element.matches(".ag-index-detail")) {
      require(":scope > .ag-index-detail__index", "Index-Detail needs a direct Index pane.");
      require(":scope > .ag-index-detail__detail", "Index-Detail needs a direct Detail pane.");
    }
  }
  return issues;
}

export function assertMarkup(root: ParentNode): void {
  const issues = validateMarkup(root);
  if (issues.length)
    throw new Error(
      `Invalid Afterglow markup: ${issues
        .map((issue) => issue.message)
        .join(" ")}`
    );
}
