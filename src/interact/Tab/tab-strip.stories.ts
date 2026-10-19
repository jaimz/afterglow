import { enhanceTabbedView } from "../../main";
import { element, track } from "../../stories/fixtures";
let nextStripId = 0;

export default {
  title: "Interact/Tab Strip",
  parameters: { controls: { disable: true } },
};

/** A live strip with associated panels; controls never demonstrate inert tab semantics. */
export const Default = () => {
  const id = `strip-example-${++nextStripId}`;
  const root =
    element(`<section class="ag-tabbed-view" style="width:669px;max-width:100%;margin:24px">
    <div class="ag-tab-strip" aria-label="Example views">
      ${[0, 1, 2]
        .map(
          (index) =>
            `<button type="button" class="ag-tab" aria-controls="${id}-${index}">A Tab</button>`
        )
        .join("")}
    </div>
    ${[0, 1, 2]
      .map(
        (index) =>
          `<section class="ag-tabbed-view__panel" id="${id}-${index}"><p class="ag-body" style="padding:24px">View ${
            index + 1
          }</p></section>`
      )
      .join("")}
  </section>`);
  track(enhanceTabbedView(root));
  return root;
};
