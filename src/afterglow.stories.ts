import "./main";
import { AGDialog } from "./frame/Dialog";

export default {
  title: "Afterglow/Overview",
  parameters: { layout: "fullscreen" },
};

/** An integration example for the design system's components and native forms. */
export const Overview = () => {
  const page = document.createElement("div");
  page.innerHTML = `
    <style>
      .ag-overview { padding: 32px; background: #e5e5e3; color: #53534a; font: 16px/1.5 Lato, system-ui, sans-serif; min-height: 100vh; box-sizing: border-box; }
      .ag-overview h1 { margin: 0 0 8px; font-size: 32px; }
      .ag-overview h2 { font-size: 20px; margin: 0 0 16px; }
      .ag-overview p { margin: 0 0 24px; }
      .ag-overview .panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1100px; }
      .ag-overview ag-panel, .ag-overview ag-background { display: block; padding: 24px; box-sizing: border-box; border-radius: 8px; }
      .ag-overview .row { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-bottom: 24px; }
      .ag-overview .fields { display: grid; gap: 24px; }
      .ag-overview ag-slider { margin-bottom: 32px; }
      .ag-overview output { display: block; min-height: 24px; font-size: 14px; overflow-wrap: anywhere; }
      .ag-overview .dialog-content { padding: 32px; }
    </style>
    <main class="ag-overview">
      <h1>Afterglow</h1><p>Colour, depth, and familiar controls.</p>
      <div class="panels">
        <ag-panel>
          <h2>Actions</h2>
          <div class="row"><ag-button>Default</ag-button><ag-button variant="primary">Primary</ag-button><ag-button variant="outline">Outline</ag-button><ag-button variant="flat">Flat</ag-button></div>
          <div class="row"><ag-button dangerous>Delete</ag-button><ag-button variant="primary" disabled>Disabled</ag-button><ag-button id="open-dialog">Open dialog</ag-button></div>
          <h2>Preferences</h2>
          <form class="fields">
            <ag-checkbox name="newsletter" value="yes" checked>Receive updates</ag-checkbox>
            <ag-switch name="notifications" value="enabled">Notifications<span slot="checked-message">On</span><span slot="unchecked-message">Off</span></ag-switch>
            <ag-radio-group name="frequency" value="weekly"><label slot="label">Frequency</label><ag-radio value="daily">Daily</ag-radio><ag-radio value="weekly">Weekly</ag-radio><ag-radio value="monthly">Monthly</ag-radio></ag-radio-group>
            <ag-slider name="volume" aria-label="Volume" min="0" max="100" step="10" value="40" marks><ag-slider-label position="0">Quiet</ag-slider-label><ag-slider-label position="100">Loud</ag-slider-label></ag-slider>
            <div class="row"><ag-button variant="primary" type="submit">Save preferences</ag-button><ag-button type="reset">Reset</ag-button></div>
            <output aria-live="polite">Change your preferences, then save.</output>
          </form>
        </ag-panel>
        <ag-background>
          <h2>On the backdrop</h2>
          <div class="fields">
            <ag-checkbox variant="backdrop" checked>Selected option</ag-checkbox>
            <ag-switch variant="backdrop" checked>Notifications<span slot="checked-message">On</span><span slot="unchecked-message">Off</span></ag-switch>
            <ag-radio-group variant="backdrop" value="a"><label slot="label">Choose an option</label><ag-radio variant="backdrop" value="a">First</ag-radio><ag-radio variant="backdrop" value="b">Second</ag-radio></ag-radio-group>
            <ag-slider variant="backdrop" aria-label="Backdrop volume" min="0" max="100" step="10" value="60" marks><ag-slider-label position="0">0</ag-slider-label><ag-slider-label position="100">100</ag-slider-label></ag-slider>
          </div>
        </ag-background>
      </div>
      <ag-dialog hidden aria-label="Afterglow dialog"><div class="dialog-content"><h2>A moment of focus</h2><p>Afterglow's dialog keeps the surrounding page out of the way.</p><ag-button id="close-dialog" variant="primary">Close dialog</ag-button></div></ag-dialog>
    </main>`;
  const dialog = page.querySelector<AGDialog>("ag-dialog")!;
  page
    .querySelector("#open-dialog")!
    .addEventListener("click", () => dialog.show());
  page
    .querySelector("#close-dialog")!
    .addEventListener("click", () => dialog.hide());
  dialog.addEventListener("dismiss", () => dialog.hide());
  const form = page.querySelector("form")!;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    page.querySelector("output")!.textContent = `Saved: ${JSON.stringify(
      Object.fromEntries(new FormData(form))
    )}`;
  });
  return page;
};
