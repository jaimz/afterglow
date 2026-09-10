import { expect } from "@esm-bundle/chai";
import { sendKeys } from "@web/test-runner-commands";
import { LitElement } from "lit";
import { registerAfterglow } from "../src/main.ts";

let root;
async function settle() {
  for (let pass = 0; pass < 4; pass++) {
    await Promise.all(
      Array.from(root.querySelectorAll("*")).map(
        (element) => element.updateComplete
      )
    );
  }
}
async function fixture(markup) {
  root.innerHTML = markup;
  await settle();
  return root.firstElementChild;
}
beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
});
afterEach(() => root.remove());

it("registers every component as a Lit element and permits repeated registration", () => {
  registerAfterglow();
  registerAfterglow();
  for (const name of [
    "appframe",
    "background",
    "surface",
    "panel",
    "paper",
    "dialog",
    "button",
    "checkbox",
    "radio",
    "radio-group",
    "switch",
    "slider",
    "slider-label",
  ]) {
    expect(document.createElement(`ag-${name}`)).to.be.instanceOf(LitElement);
  }
});

it("projects frame content and supports inherited, scoped theme overrides", async () => {
  const panel = await fixture(
    "<ag-panel><span>Panel content</span><ag-button>Action</ag-button></ag-panel>"
  );
  expect(panel.shadowRoot.querySelector("slot").assignedNodes()).to.have.length(
    2
  );
  expect(getComputedStyle(panel).backgroundColor).to.equal(
    "rgb(249, 249, 246)"
  );
  panel.style.setProperty("--panel", "rgb(20, 30, 40)");
  panel.style.setProperty("--ctrlText", "rgb(10, 20, 30)");
  expect(getComputedStyle(panel).backgroundColor).to.equal("rgb(20, 30, 40)");
  expect(getComputedStyle(panel.querySelector("ag-button")).color).to.equal(
    "rgb(10, 20, 30)"
  );
});

it("updates button attributes and blocks disabled activation", async () => {
  const button = await fixture(
    '<ag-button aria-label="Save"><span slot="start">+</span>Save</ag-button>'
  );
  let clicks = 0;
  button.addEventListener("click", () => clicks++);
  button.click();
  expect(clicks).to.equal(1);
  button.disabled = true;
  button.variant = "primary";
  button.dangerous = true;
  await settle();
  expect(button.control.disabled).to.equal(true);
  expect(button.getAttribute("variant")).to.equal("primary");
  expect(button.hasAttribute("dangerous")).to.equal(true);
  button.click();
  expect(clicks).to.equal(1);
  button.removeAttribute("disabled");
  button.setAttribute("aria-label", "Save changes");
  await settle();
  expect(button.control.getAttribute("aria-label")).to.equal("Save changes");
  button.focus();
  await sendKeys({ press: "Enter" });
  expect(clicks).to.equal(2);
});

it("submits with button name/value and honours prevented clicks", async () => {
  const form = await fixture(
    '<form><ag-button type="submit" name="action" value="save">Save</ag-button></form>'
  );
  const button = form.querySelector("ag-button");
  let submitted = 0;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitted++;
    expect(new FormData(form, event.submitter).get("action")).to.equal("save");
  });
  button.click();
  await settle();
  expect(submitted).to.equal(1);
  button.addEventListener("click", (event) => event.preventDefault());
  button.click();
  await settle();
  expect(submitted).to.equal(1);
  expect(form.querySelector("button")).to.equal(null);
});

it("associates a button with an external form", async () => {
  await fixture(
    '<form id="external"></form><ag-button type="submit" form="external">Save</ag-button>'
  );
  const form = root.querySelector("form");
  let submitted = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitted = true;
  });
  root.querySelector("ag-button").click();
  await settle();
  expect(submitted).to.equal(true);
});

it("integrates checked state, validation and reset with native forms", async () => {
  const form = await fixture(
    '<form><ag-checkbox name="accept" value="yes" checked required>Accept</ag-checkbox><ag-button type="reset">Reset</ag-button></form>'
  );
  const checkbox = form.querySelector("ag-checkbox");
  expect(checkbox.checked).to.equal(true);
  expect(new FormData(form).get("accept")).to.equal("yes");
  expect(checkbox.checkValidity()).to.equal(true);
  checkbox.click();
  await settle();
  expect(new FormData(form).has("accept")).to.equal(false);
  expect(checkbox.checkValidity()).to.equal(false);
  form.querySelector("ag-button").click();
  await settle();
  expect(checkbox.checked).to.equal(true);
  expect(new FormData(form).get("accept")).to.equal("yes");
});

it("uses boolean attribute presence, and distinguishes default checked from current state", async () => {
  const checkbox = await fixture(
    '<ag-checkbox checked="false">Option</ag-checkbox>'
  );
  expect(checkbox.checked).to.equal(true);
  checkbox.checked = false;
  checkbox.removeAttribute("checked");
  checkbox.setAttribute("checked", "");
  await settle();
  expect(checkbox.checked).to.equal(false);
  checkbox.formResetCallback();
  await settle();
  expect(checkbox.checked).to.equal(true);
});

it("supports mixed checkboxes and keyboard switching with one event per change", async () => {
  const checkbox = await fixture("<ag-checkbox>Option</ag-checkbox>");
  checkbox.indeterminate = true;
  await settle();
  expect(checkbox.control.indeterminate).to.equal(true);
  let changes = 0;
  let inputs = 0;
  root.addEventListener("change", () => changes++);
  root.addEventListener("input", () => inputs++);
  checkbox.focus();
  await sendKeys({ press: "Space" });
  await settle();
  expect(checkbox.checked).to.equal(true);
  expect(checkbox.indeterminate).to.equal(false);
  expect(changes).to.equal(1);
  expect(inputs).to.equal(1);
});

it("keeps read-only toggles unchanged and renders switch slots", async () => {
  const control = await fixture(
    '<ag-switch readonly>Notifications<span slot="checked-message">On</span><span slot="unchecked-message">Off</span></ag-switch>'
  );
  control.click();
  await settle();
  expect(control.checked).to.equal(false);
  control.readOnly = false;
  await settle();
  control.click();
  await settle();
  expect(control.checked).to.equal(true);
  expect(control.control.getAttribute("role")).to.equal("switch");
  expect(
    getComputedStyle(control.shadowRoot.querySelector(".checked-message"))
      .display
  ).to.equal("block");
});

it("inherits disabled fieldset state without changing the control's own disabled attribute", async () => {
  const form = await fixture(
    '<form><fieldset disabled><ag-checkbox checked name="option">Option</ag-checkbox></fieldset></form>'
  );
  const checkbox = form.querySelector("ag-checkbox");
  expect(checkbox.control.disabled).to.equal(true);
  expect(checkbox.disabled).to.equal(false);
  expect(new FormData(form).has("option")).to.equal(false);
  form.querySelector("fieldset").disabled = false;
  await settle();
  expect(checkbox.control.disabled).to.equal(false);
  expect(new FormData(form).get("option")).to.equal("on");
});

it("activates from external labels and gives the inner input their accessible name", async () => {
  await fixture(
    '<label for="terms">Accept terms</label><ag-checkbox id="terms"></ag-checkbox>'
  );
  const checkbox = root.querySelector("ag-checkbox");
  expect(checkbox.control.getAttribute("aria-label")).to.equal("Accept terms");
  root.querySelector("label").click();
  await settle();
  expect(checkbox.checked).to.equal(true);
});

it("coordinates radio selection, keyboard focus, disabled options and form value", async () => {
  const form = await fixture(
    '<form><ag-radio-group name="choice" value="a"><label slot="label">Choice</label><ag-radio value="a">A</ag-radio><ag-radio value="b" disabled>B</ag-radio><ag-radio value="c">C</ag-radio></ag-radio-group></form>'
  );
  const group = form.querySelector("ag-radio-group");
  const [a, b, c] = group.radios;
  expect(a.checked).to.equal(true);
  expect(new FormData(form).get("choice")).to.equal("a");
  let changes = 0;
  group.addEventListener("change", () => changes++);
  a.focus();
  await sendKeys({ press: "ArrowRight" });
  await settle();
  expect(c.checked).to.equal(true);
  expect(a.checked).to.equal(false);
  expect(b.checked).to.equal(false);
  expect(group.value).to.equal("c");
  expect(changes).to.equal(1);
  expect(new FormData(form).getAll("choice")).to.deep.equal(["c"]);
  expect(c.control.tabIndex).to.equal(0);
  expect(a.control.tabIndex).to.equal(-1);
  group.value = "a";
  await settle();
  expect(a.checked).to.equal(true);
  expect(c.checked).to.equal(false);
  form.reset();
  await settle();
  expect(group.value).to.equal("a");
});

it("enforces exclusive selection for standalone radios in the same form", async () => {
  const form = await fixture(
    '<form><ag-radio name="choice" value="a">A</ag-radio><ag-radio name="choice" value="b">B</ag-radio></form>'
  );
  const [a, b] = form.querySelectorAll("ag-radio");
  a.click();
  await settle();
  b.click();
  await settle();
  expect(a.checked).to.equal(false);
  expect(b.checked).to.equal(true);
  expect(new FormData(form).getAll("choice")).to.deep.equal(["b"]);
});

it("renders slider marks reactively and positions labels relative to nonzero minimum", async () => {
  const slider = await fixture(
    '<ag-slider min="20" max="40" step="5" value="30" marks><ag-slider-label position="30">Middle</ag-slider-label></ag-slider>'
  );
  expect(slider.shadowRoot.querySelectorAll(".track > .mark")).to.have.length(
    5
  );
  expect(
    slider.shadowRoot.querySelector(".thumb-container").style.insetInlineStart
  ).to.equal("50%");
  const label = slider.querySelector("ag-slider-label");
  expect(
    label.shadowRoot.querySelector(".root").style.insetInlineStart
  ).to.equal("50%");
  slider.step = 10;
  slider.orientation = "vertical";
  await settle();
  expect(slider.shadowRoot.querySelectorAll(".track > .mark")).to.have.length(
    3
  );
  expect(label.shadowRoot.querySelector(".root").style.top).to.equal("50%");
  slider.remove();
  root.append(slider);
  await settle();
  expect(slider.shadowRoot.querySelectorAll(".track > .mark")).to.have.length(
    3
  );
  slider.marks = false;
  await settle();
  expect(slider.shadowRoot.querySelectorAll(".track > .mark")).to.have.length(
    0
  );
});

it("updates slider values using the keyboard and honours readonly, bounds and reset", async () => {
  const form = await fixture(
    '<form><ag-slider aria-label="Volume" name="volume" min="0" max="100" step="10" value="20"></ag-slider></form>'
  );
  const slider = form.querySelector("ag-slider");
  slider.focus();
  await sendKeys({ press: "ArrowRight" });
  await settle();
  expect(slider.value).to.equal("30");
  expect(new FormData(form).get("volume")).to.equal("30");
  slider.readOnly = true;
  await settle();
  await sendKeys({ press: "ArrowRight" });
  expect(slider.value).to.equal("30");
  slider.value = "500";
  await settle();
  expect(slider.value).to.equal("100");
  form.reset();
  await settle();
  expect(slider.value).to.equal("20");
});

it("handles zero slider ranges and invalid steps without unbounded markup", async () => {
  const slider = await fixture(
    '<ag-slider min="10" max="10" step="0" marks></ag-slider>'
  );
  expect(slider.value).to.equal("10");
  expect(
    slider.shadowRoot.querySelector(".thumb-container").style.insetInlineStart
  ).to.equal("0%");
  slider.max = 100;
  slider.step = 0.000001;
  await settle();
  expect(slider.shadowRoot.querySelectorAll(".mark").length).to.be.at.most(
    1001
  );
});

it("opens a native modal dialog, requests dismissal on Escape, and restores focus on hide", async () => {
  await fixture(
    '<button id="opener">Open</button><ag-dialog hidden aria-label="Settings"><ag-button>Close</ag-button></ag-dialog>'
  );
  const dialog = root.querySelector("ag-dialog");
  const opener = root.querySelector("#opener");
  opener.focus();
  let dismissed = 0;
  let closed = 0;
  dialog.addEventListener("dismiss", () => dismissed++);
  dialog.addEventListener("close", () => closed++);
  await dialog.show();
  expect(dialog.shadowRoot.querySelector("dialog").matches(":modal")).to.equal(
    true
  );
  await sendKeys({ press: "Escape" });
  expect(dismissed).to.equal(1);
  expect(dialog.hidden).to.equal(false);
  await dialog.hide();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  expect(dialog.hidden).to.equal(true);
  expect(dialog.shadowRoot.querySelector("dialog").open).to.equal(false);
  expect(document.activeElement).to.equal(opener);
  expect(closed).to.equal(1);
});

it("keeps a dialog open when show interrupts its exit animation", async () => {
  const dialog = await fixture(
    "<ag-dialog hidden><button>Content</button></ag-dialog>"
  );
  await dialog.show();
  const hiding = dialog.hide();
  await dialog.show();
  await hiding;
  expect(dialog.hidden).to.equal(false);
  expect(dialog.shadowRoot.querySelector("dialog").open).to.equal(true);
});

it("honours initially checked radios and updates a required group when cleared", async () => {
  const form = await fixture(
    '<form><ag-radio-group name="choice" required><ag-radio value="a" checked>A</ag-radio><ag-radio value="b">B</ag-radio></ag-radio-group></form>'
  );
  const group = form.querySelector("ag-radio-group");
  expect(group.value).to.equal("a");
  expect(group.checkValidity()).to.equal(true);
  group.radios[0].checked = false;
  await settle();
  expect(group.value).to.equal("");
  expect(group.checkValidity()).to.equal(false);
  expect(new FormData(form).has("choice")).to.equal(false);
});

it("keeps a single selection even when radio values are identical", async () => {
  const group = await fixture(
    "<ag-radio-group><ag-radio>A</ag-radio><ag-radio>B</ag-radio></ag-radio-group>"
  );
  group.radios[1].click();
  await settle();
  expect(group.radios.map((radio) => radio.checked)).to.deep.equal([
    false,
    true,
  ]);
});

it("releases a radio from group-disabled state when moved out of the group", async () => {
  const group = await fixture(
    '<ag-radio-group disabled><ag-radio value="a">A</ag-radio></ag-radio-group>'
  );
  const radio = group.radios[0];
  expect(radio.control.disabled).to.equal(true);
  root.append(radio);
  await settle();
  expect(radio.control.disabled).to.equal(false);
  radio.click();
  await settle();
  expect(radio.checked).to.equal(true);
});

it("supports non-modal dialogs with optional focus containment", async () => {
  await fixture(
    '<button id="outside">Outside</button><ag-dialog hidden><ag-button>Inside</ag-button></ag-dialog>'
  );
  const dialog = root.querySelector("ag-dialog");
  dialog.modal = false;
  await dialog.show();
  expect(dialog.shadowRoot.querySelector("dialog").matches(":modal")).to.equal(
    false
  );
  root.querySelector("#outside").focus();
  expect(document.activeElement).to.equal(dialog.querySelector("ag-button"));
  dialog.trapFocus = false;
  await settle();
  root.querySelector("#outside").focus();
  expect(document.activeElement).to.equal(root.querySelector("#outside"));
});

it("keeps slider state aligned with native range stepping at an uneven maximum", async () => {
  const slider = await fixture(
    '<ag-slider min="0" max="95" step="10" value="95"></ag-slider>'
  );
  expect(slider.value).to.equal(slider.control.value);
  expect(Number(slider.value) % 10).to.equal(0);
});

it("preserves custom validity through updates until it is cleared", async () => {
  const checkbox = await fixture("<ag-checkbox>Option</ag-checkbox>");
  checkbox.setCustomValidity("This option is unavailable.");
  checkbox.checked = true;
  await settle();
  expect(checkbox.checkValidity()).to.equal(false);
  expect(checkbox.validationMessage).to.equal("This option is unavailable.");
  checkbox.setCustomValidity("");
  expect(checkbox.checkValidity()).to.equal(true);
});

it("aligns a right-to-left slider's graphics with its native input", async () => {
  const slider = await fixture(
    '<ag-slider dir="rtl" min="0" max="100" value="0" marks><ag-slider-label position="0">Minimum</ag-slider-label></ag-slider>'
  );
  const track = slider.shadowRoot
    .querySelector(".track")
    .getBoundingClientRect();
  const thumb = slider.shadowRoot
    .querySelector(".thumb-container")
    .getBoundingClientRect();
  expect(Math.abs(thumb.left + thumb.width / 2 - track.right)).to.be.lessThan(
    1
  );
  slider.focus();
  await sendKeys({ press: "ArrowLeft" });
  await settle();
  expect(slider.value).to.equal("1");
  expect(
    slider.shadowRoot.querySelector(".thumb-container").getBoundingClientRect()
      .left
  ).to.be.lessThan(thumb.left);
});
