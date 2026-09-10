import { checkableMarkup, element, sliderMarkup, track } from "./fixtures";
import { enhanceControls, enhanceSlider } from "../main";
export default { title: "Afterglow/Native HTML" };

const cssOnlyMarkup = `<form class="ag-panel ag-body" style="padding:24px;display:grid;gap:24px;max-width:500px">
  <h2>Native controls</h2>
  ${checkableMarkup("checkbox", {
    label: "Receive updates",
    name: "updates",
    isChecked: true,
  })}
  ${checkableMarkup("switch", {
    label: "Notifications",
    name: "notifications",
  })}
  <fieldset class="ag-radio-group"><legend>Frequency</legend><div class="ag-radio-group__options">
    ${checkableMarkup("radio", {
      name: "frequency",
      value: "daily",
      label: "Daily",
    })}
    ${checkableMarkup("radio", {
      name: "frequency",
      value: "weekly",
      label: "Weekly",
      isChecked: true,
    })}
  </div></fieldset>
  <button class="ag-button" type="reset">Reset</button>
</form>`;
// This story deliberately attaches no listeners or Afterglow helpers.
export const CSSOnly = () => element(cssOnlyMarkup);
CSSOnly.parameters = {
  docs: {
    source: { code: cssOnlyMarkup },
    description: {
      story:
        "Selection, keyboard activation, labels and form reset use native HTML. No Afterglow JavaScript is required.",
    },
  },
};

export const States = () => {
  const root =
    element(`<div class="ag-body" style="display:grid;gap:24px;padding:24px;min-width:0;color:var(--onPanel,#53534a)">
    <h2>Checkbox states</h2>
    ${["default", "solid", "backdrop"]
      .map(
        (variant) => `<div ${
          variant === "backdrop" ? 'class="ag-background"' : 'class="ag-panel"'
        } style="padding:16px;display:flex;flex-wrap:wrap;gap:24px;align-items:center">
      ${checkableMarkup("checkbox", { label: "Unchecked", variant })}
      ${checkableMarkup("checkbox", {
        label: "Checked",
        variant,
        isChecked: true,
      })}
      ${checkableMarkup("checkbox", { label: "Mixed", variant })}
      ${checkableMarkup("checkbox", {
        label: "Disabled",
        variant,
        isChecked: true,
        isDisabled: true,
      })}
    </div>`
      )
      .join("")}
    <h2>Optional read-only behaviour</h2>
    ${checkableMarkup("switch", {
      label: "Read-only notifications",
      isReadOnly: true,
      isChecked: true,
    })}
    <h2>Vertical range</h2>
    ${sliderMarkup({
      orientation: "vertical",
      withLabels: true,
      withMarks: true,
    })}
  </div>`);
  root.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    if (input.closest("label")?.textContent?.includes("Mixed"))
      input.indeterminate = true;
  });
  track(enhanceControls(root));
  track(enhanceSlider(root.querySelector<HTMLElement>(".ag-slider")!));
  return root;
};

const dialogMarkup = `<div class="ag-body">
  <button class="ag-button" type="button" commandfor="native-settings" command="show-modal">Open native dialog</button>
  <dialog class="ag-dialog" id="native-settings" aria-labelledby="native-settings-title">
    <div style="padding:32px">
      <h2 id="native-settings-title">Native dialog</h2>
      <p>This example uses HTML invoker commands.</p>
      <button class="ag-button" type="button" commandfor="native-settings" command="close">Close</button>
    </div>
  </dialog>
</div>`;
export const DeclarativeDialog = () => element(dialogMarkup);
DeclarativeDialog.parameters = { docs: { source: { code: dialogMarkup } } };
