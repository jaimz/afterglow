import { element } from "../../stories/fixtures";

export default {
  title: "Present/Card Content",
  parameters: { controls: { disable: true } },
};

export const Variants = () =>
  element(`<section class="ag-surface" style="display:flex;flex-wrap:wrap;align-items:start;gap:24px;padding:24px">
  ${["complete", "no-overline", "no-title"]
    .map(
      (
        variant
      ) => `<article class="ag-card-content ag-paper" style="width:344px;max-width:100%">
    ${
      variant === "complete"
        ? '<p class="ag-card-content__overline">Field notes</p>'
        : ""
    }
    ${
      variant !== "no-title"
        ? '<h2 class="ag-card-content__title">A new perspective</h2>'
        : ""
    }
    <div class="ag-card-content__body"><p>Some secondary text that's long enough to span multiple lines.</p><p>And maybe multiple paragraphs.</p></div>
    <div class="ag-card-content__actions"><button class="ag-button" data-variant="flat" type="button">action one</button><button class="ag-button" data-variant="flat" type="button">action two</button></div>
  </article>`
    )
    .join("")}
</section>`);
