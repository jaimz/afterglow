import { element, escapeHTML } from "../../stories/fixtures";

export default {
  title: "Interact/Textarea",
  args: { label: "Text area…", value: "", disabled: false, readOnly: false },
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
};

export const Default = ({
  label,
  value,
  disabled,
  readOnly,
}: {
  label: string;
  value: string;
  disabled: boolean;
  readOnly: boolean;
}) => {
  const root =
    element(`<form class="ag-body" style="padding:24px;max-width:343px">
    <div class="ag-textarea-field">
      <textarea id="notes" name="notes" class="ag-textarea" placeholder=" " ${
        disabled ? "disabled" : ""
      } ${readOnly ? "readonly" : ""}>${escapeHTML(value)}</textarea>
      <label class="ag-textarea-field__label" for="notes">${escapeHTML(
        label
      )}</label>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px">
      <button class="ag-button" type="submit" data-variant="primary">Save</button>
      <button class="ag-button" type="reset">Reset</button>
    </div>
    <p><output>Ready</output></p>
  </form>`);
  root.onsubmit = (event) => {
    event.preventDefault();
    root.querySelector("output")!.textContent = `Saved: ${
      new FormData(root as HTMLFormElement).get("notes") ?? "(field disabled)"
    }`;
  };
  return root;
};

export const WithContent = Object.assign(Default.bind({}), {
  args: { value: "A larger text area." },
});

export const States = () =>
  element(`<section class="ag-body" style="display:grid;gap:24px;padding:24px;max-width:343px">
  <label>Disabled<textarea class="ag-textarea" disabled>Unavailable for editing.</textarea></label>
  <label>Read only<textarea class="ag-textarea" readonly>You can still select and copy this text.</textarea></label>
  <label>Invalid<textarea class="ag-textarea" aria-invalid="true" aria-describedby="notes-error">Needs revision.</textarea><span id="notes-error">Please include a description.</span></label>
</section>`);
States.parameters = { controls: { disable: true } };

const nativeMarkup = `<label class="ag-body" for="plain-notes">Notes</label>
<textarea id="plain-notes" class="ag-textarea" name="notes" placeholder="Text area…"></textarea>`;
export const HTMLOnly = () =>
  element(`<div style="padding:24px;max-width:343px">${nativeMarkup}</div>`);
HTMLOnly.parameters = {
  controls: { disable: true },
  docs: { source: { code: nativeMarkup } },
};
