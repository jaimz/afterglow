import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse } from "@web/test-runner-commands";
import { enhanceControls, enhanceDialog, enhanceSlider } from "../src/main.ts";
import { checkableMarkup, sliderMarkup } from "../src/stories/fixtures.ts";

let root;
let cleanups;
const settle = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const use = (controller) => {
  cleanups.push(() => controller.destroy());
  return controller;
};
const fixture = (markup) => {
  root.innerHTML = markup;
  return root.firstElementChild;
};
// Firefox rounds some computed font sizes. Compare token calculations with the
// browser's rendering of the equivalent literal size, not unrounded JS numbers.
const renderedFontSize = (pixels) => {
  const reference = document.createElement("span");
  reference.style.fontSize = `${pixels}px`;
  root.append(reference);
  const size = parseFloat(getComputedStyle(reference).fontSize);
  reference.remove();
  return size;
};
before(async () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/afterglow.css";
  const loaded = new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = reject;
  });
  document.head.append(link);
  await loaded;
});
beforeEach(() => {
  root = document.createElement("div");
  root.className = "ag-body";
  document.body.append(root);
  cleanups = [];
});
afterEach(() => {
  cleanups.reverse().forEach((cleanup) => cleanup());
  root.remove();
});

it("leaves the custom element registry empty and uses native element interfaces", () => {
  for (const name of [
    "appframe",
    "background",
    "surface",
    "panel",
    "paper",
    "button",
    "checkbox",
    "radio",
    "radio-group",
    "switch",
    "slider",
    "slider-label",
    "dialog",
  ])
    expect(customElements.get(`ag-${name}`)).to.equal(undefined);
  fixture(
    `<form><button class="ag-button" type="submit">Save</button>${checkableMarkup(
      "checkbox"
    )}</form>`
  );
  expect(root.querySelector("button")).to.be.instanceOf(HTMLButtonElement);
  expect(root.querySelector("input")).to.be.instanceOf(HTMLInputElement);
  expect(root.querySelector("input").shadowRoot).to.equal(null);
});

it("preserves frame colours, hidden semantics and inherited scoped theme overrides", () => {
  const panel = fixture(
    '<section class="ag-panel"><button class="ag-button" type="button">Action</button></section>'
  );
  expect(getComputedStyle(panel).backgroundColor).to.equal(
    "rgb(249, 249, 246)"
  );
  panel.style.setProperty("--panel", "rgb(20, 30, 40)");
  panel.style.setProperty("--ctrlText", "rgb(10, 20, 30)");
  expect(getComputedStyle(panel).backgroundColor).to.equal("rgb(20, 30, 40)");
  expect(getComputedStyle(panel.firstElementChild).color).to.equal(
    "rgb(10, 20, 30)"
  );
  panel.hidden = true;
  expect(getComputedStyle(panel).display).to.equal("none");
});
it("makes default tokens available to consumer CSS without fallbacks", () => {
  const sample = fixture(
    `<div style="background:var(--panel);color:var(--ctrlText);font-size:var(--h1-text-size);padding:calc(var(--gridX) * 1px)">Consumer content</div>`
  );
  const styles = getComputedStyle(sample);
  expect(styles.backgroundColor).to.equal("rgb(249, 249, 246)");
  expect(styles.color).to.equal("rgb(0, 118, 147)");
  expect(styles.paddingTop).to.equal("8px");
  expect(parseFloat(styles.fontSize)).to.be.closeTo(16 * 1.2 ** 5, 0.02);
  const defaults = getComputedStyle(document.documentElement);
  expect(defaults.getPropertyValue("--panel").trim()).to.equal("#f9f9f6");
  expect(defaults.getPropertyValue("--motionSlowDuration").trim()).to.equal(
    "250ms"
  );
});
it("allows root overrides and restores default values when removed", () => {
  const html = document.documentElement;
  const original = html.getAttribute("style");
  const sample = fixture(
    '<div style="background:var(--panel);font-size:var(--h1-text-size)">Consumer heading</div>'
  );
  try {
    html.style.setProperty("--panel", "rgb(12, 34, 56)");
    html.style.setProperty("--body-text-size", "20px");
    html.style.setProperty("--text-scale", "1.5");
    expect(getComputedStyle(sample).backgroundColor).to.equal(
      "rgb(12, 34, 56)"
    );
    expect(parseFloat(getComputedStyle(sample).fontSize)).to.equal(
      renderedFontSize(20 * 1.5 ** 5)
    );
  } finally {
    if (original === null) html.removeAttribute("style");
    else html.setAttribute("style", original);
  }
  expect(getComputedStyle(sample).backgroundColor).to.equal(
    "rgb(249, 249, 246)"
  );
  expect(parseFloat(getComputedStyle(sample).fontSize)).to.be.closeTo(
    16 * 1.2 ** 5,
    0.02
  );
});
it("keeps dependent typography tokens responsive to local theme changes", () => {
  root.classList.add("ag-theme");
  fixture(
    '<div class="ag-caption">Caption</div><h1 class="ag-h1">Heading</h1>'
  );
  const caption = root.querySelector(".ag-caption");
  const before = parseFloat(getComputedStyle(caption).fontSize);
  root.style.setProperty("--body-text-size", "32px");
  expect(parseFloat(getComputedStyle(caption).fontSize)).to.be.closeTo(
    before * 2,
    0.01
  );
  expect(
    parseFloat(getComputedStyle(root.querySelector("h1")).fontSize)
  ).to.be.closeTo(32 * 1.2 ** 5, 0.02);
});
it("recalculates nested themes while inheriting base tokens and explicit type overrides", () => {
  fixture(`<section class="ag-theme" style="--body-text-size:20px;--text-scale:1.5;--panel:rgb(20,30,40);--h5-text-size:36px">
    <div><h1 class="ag-h1" id="outer-heading">Outer</h1><span class="ag-caption" id="outer-caption">Caption</span></div>
    <section class="ag-theme" style="--text-scale:1.25">
      <div class="ag-body"><h1 class="ag-h1" id="inner-heading">Inner</h1><span class="ag-caption" id="inner-caption">Caption</span></div>
      <div id="consumer" style="background:var(--panel);font-size:var(--body2-text-size)">Consumer content</div>
    </section>
  </section>`);
  const size = (id) =>
    parseFloat(getComputedStyle(root.querySelector(id)).fontSize);
  expect(size("#outer-heading")).to.equal(renderedFontSize(36 * 1.5 ** 4));
  expect(size("#outer-caption")).to.equal(renderedFontSize(20 / 1.5 ** 2));
  expect(size("#inner-heading")).to.equal(renderedFontSize(20 * 1.25 ** 5));
  expect(size("#inner-caption")).to.equal(renderedFontSize(20 / 1.25 ** 2));
  expect(size("#consumer")).to.equal(renderedFontSize(20 / 1.25));
  expect(
    getComputedStyle(root.querySelector("#consumer")).backgroundColor
  ).to.equal("rgb(20, 30, 40)");
});
it("preserves native button activation, disabled state and the actual submitter", async () => {
  const form = fixture(
    '<form><button class="ag-button" type="submit" name="action" value="save">Save</button></form>'
  );
  const button = form.querySelector("button");
  let submissions = 0;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submissions++;
    expect(event.submitter === button).to.equal(true);
    expect(new FormData(form, event.submitter).get("action")).to.equal("save");
  });
  button.focus();
  await sendKeys({ press: "Enter" });
  expect(submissions).to.equal(1);
  button.disabled = true;
  button.click();
  expect(submissions).to.equal(1);
  button.disabled = false;
  button.addEventListener("click", (event) => event.preventDefault());
  button.click();
  expect(submissions).to.equal(1);
});
it("honours external forms and per-button validation overrides without a proxy", () => {
  fixture(
    '<form id="external"><input name="required" required></form><button class="ag-button" type="submit" form="external" formnovalidate formaction="/save">Save</button>'
  );
  const form = root.querySelector("form");
  const button = root.querySelector("button");
  let submissions = 0;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submissions++;
    expect(event.submitter.formAction).to.equal(location.origin + "/save");
  });
  button.click();
  expect(submissions).to.equal(1);
});
it("submits, validates and resets checkbox state without enhancements", () => {
  const form = fixture(
    `<form>${checkableMarkup("checkbox", {
      name: "accept",
      value: "yes",
      isChecked: true,
    })}<button type="reset" class="ag-button">Reset</button></form>`
  );
  const input = form.querySelector("input");
  input.required = true;
  expect(new FormData(form).get("accept")).to.equal("yes");
  input.click();
  expect(input.checkValidity()).to.equal(false);
  expect(new FormData(form).has("accept")).to.equal(false);
  form.querySelector("button").click();
  expect(input.checked).to.equal(true);
  expect(input.checkValidity()).to.equal(true);
});
it("keeps native mixed state and delivers one input and change event on Space", async () => {
  fixture(checkableMarkup("checkbox"));
  const input = root.querySelector("input");
  input.indeterminate = true;
  expect(
    getComputedStyle(root.querySelector(".ag-check__mixed")).opacity
  ).to.equal("1");
  let inputs = 0,
    changes = 0;
  root.addEventListener("input", () => inputs++);
  root.addEventListener("change", () => changes++);
  input.focus();
  await sendKeys({ press: "Space" });
  expect(input.checked).to.equal(true);
  expect(input.indeterminate).to.equal(false);
  expect(inputs).to.equal(1);
  expect(changes).to.equal(1);
});
it("uses native external labels, defaultChecked and boolean presence semantics", () => {
  fixture(
    '<label for="terms">Accept terms</label><input class="ag-check__input" id="terms" type="checkbox" checked="false">'
  );
  const input = root.querySelector("input");
  expect(input.checked).to.equal(true);
  expect(input.labels).to.have.length(1);
  root.querySelector("label").click();
  expect(input.checked).to.equal(false);
  input.removeAttribute("checked");
  input.setAttribute("checked", "");
  expect(input.checked).to.equal(false);
  expect(input.defaultChecked).to.equal(true);
});
it("inherits disabled fieldsets, preserves the legend exception and updates after reparenting", () => {
  const form = fixture(
    `<form><fieldset disabled><legend>${checkableMarkup("checkbox", {
      name: "legend",
      isChecked: true,
    })}</legend>${checkableMarkup("checkbox", {
      name: "option",
      isChecked: true,
    })}</fieldset></form>`
  );
  const input = form.querySelector("input[name=option]");
  expect(input.disabled).to.equal(false);
  expect(input.matches(":disabled")).to.equal(true);
  expect(new FormData(form).has("option")).to.equal(false);
  expect(new FormData(form).has("legend")).to.equal(true);
  form.append(input);
  expect(input.matches(":disabled")).to.equal(false);
  expect(new FormData(form).get("option")).to.equal("on");
});
it("switches visual messages and submits the checked state without JavaScript", async () => {
  const form = fixture(
    `<form>${checkableMarkup("switch", {
      name: "notifications",
      label: "Notifications",
    })}</form>`
  );
  const input = form.querySelector("input");
  input.focus();
  await sendKeys({ press: "Space" });
  expect(input.checked).to.equal(true);
  expect(input.getAttribute("role")).to.equal("switch");
  expect(
    getComputedStyle(root.querySelector(".ag-switch__on")).display
  ).to.equal("block");
  expect(
    getComputedStyle(root.querySelector(".ag-switch__off")).display
  ).to.equal("none");
  expect(new FormData(form).get("notifications")).to.equal("on");
});
it("protects read-only checkboxes from label and keyboard activation while retaining submission", async () => {
  const form = fixture(
    `<form>${checkableMarkup("checkbox", {
      name: "option",
      isChecked: true,
      isReadOnly: true,
    })}</form>`
  );
  const input = form.querySelector("input");
  const controls = use(enhanceControls(form));
  form.querySelector("label").click();
  input.focus();
  await sendKeys({ press: "Space" });
  expect(input.checked).to.equal(true);
  expect(new FormData(form).get("option")).to.equal("on");
  input.removeAttribute("data-readonly");
  controls.update();
  input.click();
  expect(input.checked).to.equal(false);
});
it("exempts read-only required fields and restores validation and ARIA on cleanup", async () => {
  fixture(checkableMarkup("checkbox", { isReadOnly: true }));
  const input = root.querySelector("input");
  input.required = true;
  const controls = use(enhanceControls(root));
  expect(input.required).to.equal(false);
  expect(input.checkValidity()).to.equal(true);
  input.removeAttribute("data-readonly");
  await settle();
  expect(input.required).to.equal(true);
  expect(input.checkValidity()).to.equal(false);
  input.dataset.readonly = "";
  await settle();
  controls.destroy();
  expect(input.required).to.equal(true);
  expect(input.hasAttribute("aria-readonly")).to.equal(false);
});
const radioForm = () =>
  fixture(
    `<form><fieldset class="ag-radio-group"><legend>Choice</legend><div class="ag-radio-group__options">${[
      "a",
      "b",
      "c",
    ]
      .map((value) =>
        checkableMarkup("radio", {
          name: "choice",
          value,
          label: value,
          isChecked: value === "a",
          isDisabled: value === "b",
        })
      )
      .join("")}</div></fieldset></form>`
  );
it("uses native grouping, validation, exclusive selection and reset", () => {
  const form = radioForm();
  const [a, , c] = form.querySelectorAll("input");
  a.required = true;
  c.click();
  expect(a.checked).to.equal(false);
  expect(c.checked).to.equal(true);
  expect(a.checkValidity()).to.equal(true);
  expect(new FormData(form).getAll("choice")).to.deep.equal(["c"]);
  form.reset();
  expect(a.checked).to.equal(true);
  expect(c.checked).to.equal(false);
});
it("preserves Home/End, skips disabled radios and emits one native change", async () => {
  radioForm();
  use(enhanceControls(root));
  const [a, , c] = root.querySelectorAll("input");
  let changes = 0;
  root.addEventListener("change", () => changes++);
  a.focus();
  await sendKeys({ press: "End" });
  expect(c.checked).to.equal(true);
  expect(document.activeElement === c).to.equal(true);
  expect(changes).to.equal(1);
  await sendKeys({ press: "Home" });
  expect(a.checked).to.equal(true);
  await sendKeys({ press: "ArrowRight" });
  expect(c.checked).to.equal(true);
});
it("keeps read-only group navigation focusable without changing its value", async () => {
  radioForm();
  root.querySelector("fieldset").dataset.readonly = "";
  use(enhanceControls(root));
  const [a, , c] = root.querySelectorAll("input");
  a.focus();
  await sendKeys({ press: "End" });
  expect(document.activeElement === c).to.equal(true);
  expect(a.checked).to.equal(true);
  expect(c.checked).to.equal(false);
});
it("handles right-to-left radio-group navigation", async () => {
  radioForm();
  root.dir = "rtl";
  use(enhanceControls(root));
  const [a, , c] = root.querySelectorAll("input");
  a.focus();
  await sendKeys({ press: "ArrowLeft" });
  expect(c.checked).to.equal(true);
});
it("works as a native range before enhancement and leaves programmatic changes event-free", async () => {
  const slider = fixture(sliderMarkup({ value: 20 }));
  const input = slider.querySelector("input");
  input.focus();
  await sendKeys({ press: "ArrowRight" });
  expect(input.value).to.equal("30");
  let events = 0;
  input.addEventListener("input", () => events++);
  const controller = use(enhanceSlider(slider));
  controller.setValue(70);
  expect(input.value).to.equal("70");
  expect(events).to.equal(0);
});
it("updates slider fill, labels and marks with nonzero bounds and changing orientation", async () => {
  const slider = fixture(
    sliderMarkup({
      min: 20,
      max: 40,
      step: 5,
      value: 30,
      withLabels: true,
      withMarks: true,
    })
  );
  const controller = use(enhanceSlider(slider));
  expect(slider.style.getPropertyValue("--ag-slider-progress")).to.equal("50%");
  expect(slider.querySelectorAll(".ag-slider__marks > span")).to.have.length(5);
  const labels = slider.querySelectorAll(".ag-slider__label");
  expect(labels[1].style.getPropertyValue("--ag-slider-position")).to.equal(
    "25%"
  );
  controller.input.step = "10";
  slider.dataset.orientation = "vertical";
  await settle();
  expect(slider.querySelectorAll(".ag-slider__marks > span")).to.have.length(3);
  expect(controller.input.getAttribute("aria-orientation")).to.equal(
    "vertical"
  );
  slider.removeAttribute("data-marks");
  await settle();
  expect(slider.querySelectorAll(".ag-slider__marks > span")).to.have.length(0);
});
it("keeps slider reset, dynamic values, stepping and accessible formatting synchronised", async () => {
  const form = fixture(`<form>${sliderMarkup({ value: 20, step: 10 })}</form>`);
  const slider = form.querySelector(".ag-slider");
  const controller = use(
    enhanceSlider(slider, { formatValue: (value) => `${value} percent` })
  );
  controller.input.focus();
  await sendKeys({ press: "ArrowRight" });
  expect(controller.input.getAttribute("aria-valuetext")).to.equal(
    "30 percent"
  );
  expect(new FormData(form).get("volume")).to.equal("30");
  form.reset();
  await settle();
  expect(slider.style.getPropertyValue("--ag-slider-progress")).to.equal("20%");
  controller.input.max = "95";
  controller.setValue(95);
  expect(controller.input.value).to.equal("90");
  expect(controller.input.getAttribute("aria-valuetext")).to.equal(
    "90 percent"
  );
});
it("bounds generated ticks, supports step any and avoids invalid zero-span styles", async () => {
  const slider = fixture(
    sliderMarkup({ min: 10, max: 10, step: 0, withMarks: true })
  );
  const controller = use(enhanceSlider(slider));
  expect(slider.style.getPropertyValue("--ag-slider-progress")).to.equal("0%");
  controller.input.max = "100";
  controller.input.step = ".000001";
  await settle();
  expect(
    slider.querySelectorAll(".ag-slider__marks > span").length
  ).to.be.at.most(1001);
  controller.input.step = "any";
  await settle();
  expect(slider.querySelectorAll(".ag-slider__marks > span")).to.have.length(0);
});
it("protects a read-only range from pointer and keyboard changes without blocking Tab", async () => {
  const slider = fixture(sliderMarkup({ value: 20, isReadOnly: true }));
  const controller = use(enhanceSlider(slider));
  use(enhanceControls(root));
  const input = controller.input;
  input.focus();
  await sendKeys({ press: "ArrowRight" });
  expect(input.value).to.equal("20");
  const rect = input.getBoundingClientRect();
  await sendMouse({
    type: "click",
    position: [
      Math.round(rect.right - 12),
      Math.round(rect.top + rect.height / 2),
    ],
  });
  expect(input.value).to.equal("20");
  // Safari's default macOS Tab order skips buttons; text inputs are always stops.
  const next = document.createElement("input");
  next.type = "text";
  root.append(next);
  input.focus();
  await sendKeys({ press: "Tab" });
  expect(document.activeElement === next).to.equal(true);
});
it("supports vertical native range input and RTL filled-track direction", async () => {
  const slider = fixture(sliderMarkup({ value: 20, orientation: "vertical" }));
  const controller = use(enhanceSlider(slider));
  controller.input.focus();
  await sendKeys({ press: "ArrowDown" });
  expect(controller.input.value).to.equal("30");
  slider.dataset.orientation = "horizontal";
  slider.dir = "rtl";
  await settle();
  controller.input.focus();
  await sendKeys({ press: "ArrowLeft" });
  expect(controller.input.value).to.equal("40");
  const track = slider
    .querySelector(".ag-slider__track")
    .getBoundingClientRect();
  const fill = slider.querySelector(".ag-slider__fill").getBoundingClientRect();
  expect(fill.right).to.be.closeTo(track.right, 1);
});
it("keeps optional custom thumb content aligned to native range progress", () => {
  const slider = fixture(sliderMarkup({ value: 50 }));
  const thumb = document.createElement("span");
  thumb.className = "ag-slider__thumb";
  thumb.textContent = "◆";
  slider.querySelector(".ag-slider__control").append(thumb);
  const controller = use(enhanceSlider(slider));
  controller.setValue(100);
  const track = slider
      .querySelector(".ag-slider__track")
      .getBoundingClientRect(),
    bounds = thumb.getBoundingClientRect();
  expect(bounds.left + bounds.width / 2).to.be.closeTo(track.right, 1);
});
it("enhances idempotently and stops observing a destroyed slider", async () => {
  const slider = fixture(sliderMarkup());
  const controller = use(enhanceSlider(slider));
  expect(enhanceSlider(slider)).to.equal(controller);
  controller.destroy();
  controller.input.value = "80";
  controller.input.dispatchEvent(new Event("input"));
  await settle();
  expect(slider.style.getPropertyValue("--ag-slider-progress")).to.equal("50%");
  expect(slider.hasAttribute("data-enhanced")).to.equal(false);
});
const dialogFixture = () => {
  fixture(
    '<button type="button" id="opener">Open</button><dialog class="ag-dialog" aria-labelledby="dialog-title"><h2 id="dialog-title">Settings</h2><button type="button">First</button><button type="button">Last</button></dialog>'
  );
  return root.querySelector("dialog");
};
it("provides modal behaviour with native HTML before enhancement", async () => {
  const dialog = dialogFixture();
  dialog.showModal();
  expect(dialog.matches(":modal")).to.equal(true);
  await sendKeys({ press: "Escape" });
  expect(dialog.open).to.equal(false);
});
it("opens declaratively using commandfor when the browser supports invoker commands", async function () {
  if (!("commandForElement" in HTMLButtonElement.prototype)) this.skip();
  const dialog = dialogFixture();
  dialog.id = "declarative-dialog";
  const opener = root.querySelector("#opener");
  opener.setAttribute("commandfor", dialog.id);
  opener.setAttribute("command", "show-modal");
  opener.click();
  expect(dialog.open).to.equal(true);
  dialog.close();
});
it("preserves dismissal requests, modal state through exit, and focus restoration", async () => {
  const dialog = dialogFixture();
  const controller = use(enhanceDialog(dialog));
  const opener = root.querySelector("#opener");
  opener.focus();
  let dismissals = 0,
    closes = 0;
  dialog.addEventListener("dismiss", () => dismissals++);
  dialog.addEventListener("close", () => closes++);
  await controller.show();
  await sendKeys({ press: "Escape" });
  expect(dismissals).to.equal(1);
  expect(dialog.open).to.equal(true);
  const hiding = controller.hide("saved");
  expect(dialog.matches(":modal")).to.equal(true);
  await hiding;
  await settle();
  expect(dialog.open).to.equal(false);
  expect(dialog.returnValue).to.equal("saved");
  expect(document.activeElement === opener).to.equal(true);
  expect(closes).to.equal(1);
});
it("requests dismissal from backdrop clicks without treating interior clicks as outside", async () => {
  const dialog = dialogFixture();
  const controller = use(enhanceDialog(dialog));
  let dismissed = 0;
  dialog.addEventListener("dismiss", () => dismissed++);
  await controller.show();
  await settle();
  dialog.querySelector("h2").click();
  expect(dismissed).to.equal(0);
  await sendMouse({ type: "click", position: [2, 2] });
  expect(dismissed).to.equal(1);
});
it("keeps the dialog open when showing interrupts an exit and permits later closure", async () => {
  const dialog = dialogFixture();
  const controller = use(enhanceDialog(dialog));
  await controller.show();
  const hiding = controller.hide();
  await controller.show();
  await hiding;
  expect(dialog.open).to.equal(true);
  expect(dialog.hasAttribute("data-closing")).to.equal(false);
  await controller.hide();
  expect(dialog.open).to.equal(false);
});
it("supports non-modal focus containment and an explicit opt-out", async () => {
  const dialog = dialogFixture();
  const controller = use(enhanceDialog(dialog));
  await controller.show({ modal: false });
  expect(dialog.matches(":modal")).to.equal(false);
  root.querySelector("#opener").focus();
  expect(dialog.contains(document.activeElement)).to.equal(true);
  const [first, last] = dialog.querySelectorAll("button");
  last.focus();
  await sendKeys({ press: "Tab" });
  expect(document.activeElement === first).to.equal(true);
  await controller.show({ modal: false, trapFocus: false });
  root.querySelector("#opener").focus();
  expect(document.activeElement === root.querySelector("#opener")).to.equal(
    true
  );
});
it("preserves native custom validity until the application clears it", () => {
  fixture(checkableMarkup("checkbox"));
  const input = root.querySelector("input");
  input.setCustomValidity("Unavailable");
  input.checked = true;
  expect(input.checkValidity()).to.equal(false);
  expect(input.validationMessage).to.equal("Unavailable");
  input.setCustomValidity("");
  expect(input.checkValidity()).to.equal(true);
});
it("clears mixed state on enhanced form reset and honours a cancelled reset", async () => {
  const form = fixture(
    `<form>${checkableMarkup("checkbox", { isChecked: true })}</form>`
  );
  use(enhanceControls(form));
  const input = form.querySelector("input");
  input.indeterminate = true;
  form.reset();
  await settle();
  expect(input.indeterminate).to.equal(false);
  input.indeterminate = true;
  form.addEventListener("reset", (event) => event.preventDefault());
  form.reset();
  await settle();
  expect(input.indeterminate).to.equal(true);
});
it("can enhance an already non-modal dialog and change it to a modal", async () => {
  const dialog = dialogFixture();
  dialog.show();
  const controller = use(enhanceDialog(dialog));
  await controller.show();
  expect(dialog.matches(":modal")).to.equal(true);
  await controller.hide();
});
it("supports enhancement cleanup followed by a new controller", () => {
  const slider = fixture(sliderMarkup());
  const first = enhanceSlider(slider);
  first.destroy();
  const second = use(enhanceSlider(slider));
  first.destroy();
  expect(enhanceSlider(slider) === second).to.equal(true);
});
