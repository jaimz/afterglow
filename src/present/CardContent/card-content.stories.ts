import { element, escapeHTML } from "../../stories/fixtures";

interface CardContentArgs {
  overlineText?: string;
  title?: string;
  textContent?: string;
  actionOneLabel?: string;
  actionTwoLabel?: string;
}

const exampleContent: CardContentArgs = {
  overlineText: "Overline",
  title: "Card...",
  textContent: "Some text for the card.",
  actionOneLabel: "action one",
  actionTwoLabel: "action two",
};

let nextCardId = 0;

/** Compose native content; omit empty sections so they leave no spacing behind. */
function createCardContent({
  overlineText = "",
  title = "",
  textContent = "",
  actionOneLabel = "",
  actionTwoLabel = "",
}: CardContentArgs = {}) {
  // Whitespace-only values are empty; callers need no separate visibility flags.
  overlineText = overlineText.trim();
  title = title.trim();
  textContent = textContent.trim();
  actionOneLabel = actionOneLabel.trim();
  actionTwoLabel = actionTwoLabel.trim();

  const titleId = `card-title-${++nextCardId}`;
  return element(`<article class="ag-card-content" style="width:311px;max-width:100%" ${
    title ? `aria-labelledby="${titleId}"` : ""
  }>
    ${
      overlineText
        ? `<p class="ag-card-content__overline">${escapeHTML(overlineText)}</p>`
        : ""
    }
    ${
      title || textContent
        ? `<div class="ag-card-content__main">
      ${
        title
          ? `<h2 class="ag-card-content__title" id="${titleId}">${escapeHTML(
              title
            )}</h2>`
          : ""
      }
      ${
        textContent
          ? `<div class="ag-card-content__body">${textContent
              .split(/\n\s*\n/)
              .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
              .join("")}</div>`
          : ""
      }
    </div>`
        : ""
    }
    ${
      actionOneLabel || actionTwoLabel
        ? `<footer class="ag-card-content__actions">
      ${
        actionOneLabel
          ? `<button type="button" class="ag-button" data-variant="flat">${escapeHTML(
              actionOneLabel
            )}</button>`
          : ""
      }
      ${
        actionTwoLabel
          ? `<button type="button" class="ag-button" data-variant="flat">${escapeHTML(
              actionTwoLabel
            )}</button>`
          : ""
      }
    </footer>`
        : ""
    }
  </article>`);
}

export default {
  title: "Present/Card Content",
  render: (args: CardContentArgs) => {
    const root = element('<section style="padding:24px"></section>');
    root.append(createCardContent(args));
    return root;
  },
  args: exampleContent,
  argTypes: {
    overlineText: { control: "text" },
    title: { control: "text" },
    textContent: { control: "text" },
    actionOneLabel: { control: "text" },
    actionTwoLabel: { control: "text" },
  },
};

export const Default = {};

export const ContentOptions = {
  render: () => {
    const root = element(
      '<section style="display:flex;flex-wrap:wrap;align-items:start;gap:24px;padding:24px"></section>'
    );
    for (const args of [
      {},
      { overlineText: "" },
      { title: "" },
      { textContent: "", actionTwoLabel: "" },
      { actionOneLabel: "", actionTwoLabel: "" },
      {
        overlineText: "",
        title: "",
        actionOneLabel: "",
        actionTwoLabel: "",
      },
    ])
      root.append(createCardContent({ ...exampleContent, ...args }));
    return root;
  },
  parameters: { controls: { disable: true } },
};

export const Layouts = {
  render: () => {
    const root = element(
      '<section style="display:flex;flex-wrap:wrap;align-items:start;gap:24px;padding:24px"></section>'
    );
    const paper = createCardContent({
      ...exampleContent,
      title: "A new perspective",
      textContent:
        "Some secondary text that's long enough to span multiple lines.\n\nAnd maybe multiple paragraphs.",
    });
    paper.classList.add("ag-paper");
    const narrow = createCardContent({
      ...exampleContent,
      title: "A longer title in a narrow space",
      textContent:
        "The content grows with its container and keeps long words readable: anespeciallylongunbrokenword.",
      actionOneLabel: "Open this collection",
      actionTwoLabel: "View related notes",
    });
    narrow.classList.add("ag-panel");
    narrow.style.width = "180px";
    const rtl = createCardContent({
      ...exampleContent,
      overlineText: "ملاحظات",
      title: "فكرة جديدة",
      textContent: "بعض النصوص لهذه البطاقة.",
      actionOneLabel: "فتح",
      actionTwoLabel: "حفظ",
    });
    rtl.dir = "rtl";
    root.append(paper, narrow, rtl);
    return root;
  },
  parameters: { controls: { disable: true } },
};
