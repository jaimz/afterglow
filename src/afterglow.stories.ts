import {
  enhanceControls,
  enhanceDialog,
  enhanceNotification,
  enhanceSlider,
} from "./main";
import { notificationMarkup } from "./indicate/Notification/fixtures/createNotification";
import {
  checkableMarkup,
  element,
  sliderMarkup,
  track,
} from "./stories/fixtures";
export default {
  title: "Afterglow/Overview",
  parameters: { layout: "fullscreen" },
};
export const Overview = () => {
  const page = element(`<main class="ag-overview ag-body">
    <style>
      .ag-overview { padding:32px; background:#e5e5e3; color:#53534a; min-height:100vh; box-sizing:border-box; }
      .ag-overview h1 { margin:0 0 8px; font-size:32px; }
      .ag-overview h2 { font-size:20px; margin:0 0 16px; }
      .ag-overview p { margin:0 0 24px; }
      .ag-overview .panels { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:24px; max-width:1100px; }
      .ag-overview .ag-panel, .ag-overview .ag-background { display:block; padding:24px; box-sizing:border-box; border-radius:8px; }
      .ag-overview .row { display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin-bottom:24px; }
      .ag-overview .fields { display:grid; gap:24px; }
      .ag-overview .ag-slider { margin-bottom:32px; }
      .ag-overview output { display:block; min-height:24px; font-size:14px; overflow-wrap:anywhere; }
      .ag-overview .dialog-content { padding:32px; }
    </style>
    <h1>Afterglow</h1><p>Colour, depth, and familiar controls.</p>
    <div class="panels">
      <section class="ag-panel">
        <h2>Actions</h2>
        <div class="row"><button type="button" class="ag-button">Default</button><button type="button" class="ag-button" data-variant="primary">Primary</button><button type="button" class="ag-button" data-variant="outline">Outline</button><button type="button" class="ag-button" data-variant="flat">Flat</button></div>
        <div class="row"><button type="button" class="ag-button" data-dangerous>Delete</button><button type="button" class="ag-button" data-variant="primary" disabled>Disabled</button><button type="button" class="ag-button" id="open-dialog">Open dialog</button></div>
        <h2>Preferences</h2>
        <form class="fields">
          ${checkableMarkup("checkbox", {
            name: "newsletter",
            value: "yes",
            label: "Receive updates",
            isChecked: true,
          })}
          ${checkableMarkup("switch", {
            name: "notifications",
            value: "enabled",
            label: "Notifications",
          })}
          <fieldset class="ag-radio-group"><legend>Frequency</legend><div class="ag-radio-group__options">
            ${["daily", "weekly", "monthly"]
              .map((value) =>
                checkableMarkup("radio", {
                  name: "frequency",
                  value,
                  label: value[0].toUpperCase() + value.slice(1),
                  isChecked: value === "weekly",
                })
              )
              .join("")}
          </div></fieldset>
          ${sliderMarkup({
            value: 40,
            withLabels: true,
            withMarks: true,
            labels: [
              { position: 0, label: "Quiet" },
              { position: 100, label: "Loud" },
            ],
          })}
          <div class="row"><button class="ag-button" data-variant="primary" type="submit">Save preferences</button><button class="ag-button" type="reset">Reset</button></div>
          <output aria-live="polite">Change your preferences, then save.</output>
        </form>
      </section>
      <section class="ag-background">
        <h2>On the backdrop</h2>
        <div class="fields">
          ${checkableMarkup("checkbox", {
            variant: "backdrop",
            isChecked: true,
            label: "Selected option",
          })}
          ${checkableMarkup("switch", {
            variant: "backdrop",
            isChecked: true,
            label: "Notifications",
          })}
          <fieldset class="ag-radio-group" data-variant="backdrop"><legend>Choose an option</legend><div class="ag-radio-group__options">
            ${checkableMarkup("radio", {
              name: "backdrop-choice",
              value: "a",
              label: "First",
              variant: "backdrop",
              isChecked: true,
            })}
            ${checkableMarkup("radio", {
              name: "backdrop-choice",
              value: "b",
              label: "Second",
              variant: "backdrop",
            })}
          </div></fieldset>
          ${sliderMarkup({
            variant: "backdrop",
            value: 60,
            withLabels: true,
            withMarks: true,
            labels: [
              { position: 0, label: "0" },
              { position: 100, label: "100" },
            ],
          })}
        </div>
      </section>
    </div>
    <dialog class="ag-dialog" aria-labelledby="overview-dialog-title"><div class="dialog-content"><h2 id="overview-dialog-title">A moment of focus</h2><p>Afterglow's dialog keeps the surrounding page out of the way.</p><button type="button" class="ag-button" id="close-dialog" data-variant="primary">Close dialog</button></div></dialog>
    ${notificationMarkup("overview-saved", "success", "Preferences saved.")}
  </main>`);
  page
    .querySelectorAll<HTMLElement>(".ag-slider")
    .forEach((slider) => track(enhanceSlider(slider)));
  track(enhanceControls(page));
  const dialog = page.querySelector("dialog")!;
  const controller = track(enhanceDialog(dialog));
  page.querySelector<HTMLButtonElement>("#open-dialog")!.onclick = () =>
    void controller.show();
  page.querySelector<HTMLButtonElement>("#close-dialog")!.onclick = () =>
    void controller.hide();
  dialog.addEventListener("dismiss", () => void controller.hide());
  const form = page.querySelector("form")!;
  const notification = track(
    enhanceNotification(page.querySelector<HTMLElement>("#overview-saved")!, {
      timeout: 5000,
    })
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    page.querySelector("output")!.textContent = `Saved: ${JSON.stringify(
      Object.fromEntries(new FormData(form))
    )}`;
    void notification.show();
  });
  return page;
};
