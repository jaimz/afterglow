import { expect } from "@esm-bundle/chai";
import { sendKeys, setViewport } from "@web/test-runner-commands";
import {
  enhanceSlider,
  enhanceControls,
  enhancePopover,
  enhancePopupMenu,
  enhanceDialog,
  enhanceNotification,
  enhanceTextField,
  enhanceTabbedView,
  enhanceTokenField,
  validateMarkup,
} from "../src/main.ts";
import { sliderMarkup, checkableMarkup } from "../src/stories/fixtures.ts";

let host, controllers;
const wait = () => new Promise((resolve) => setTimeout(resolve, 180));
const use = (controller) => {
  controllers.push(controller);
  return controller;
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
beforeEach(async () => {
  await setViewport({ width: 900, height: 700 });
  host = document.createElement("section");
  host.style.cssText =
    "padding:80px;--motion-slow-duration:80ms;--motion-medium-duration:40ms";
  document.body.append(host);
  controllers = [];
});
afterEach(() => {
  controllers.reverse().forEach((c) => c.destroy());
  host.remove();
});

it("uses one length-valued grid across layout, checkables and sliders", () => {
  host.style.cssText += ";--grid-x:10px;--grid-y:12px;--grid-type:6px";
  host.innerHTML = checkableMarkup("checkbox") + sliderMarkup();
  const check = host.querySelector(".ag-check__control");
  expect(getComputedStyle(check).width).to.equal("30px");
  expect(getComputedStyle(check).height).to.equal("36px");
  expect(getComputedStyle(check).borderRadius).to.equal("6px");
  expect(
    getComputedStyle(host.querySelector(".ag-slider")).getPropertyValue(
      "--ag-track-width"
    )
  ).to.contain("6px");
  expect(getComputedStyle(host).getPropertyValue("--gridX")).to.equal("");
});

it("derives typography locally without a theme class and inherits explicit size overrides", () => {
  host.style.cssText += ";--body-text-size:20px;--text-scale:1.5";
  host.innerHTML =
    '<h3 class="ag-h3">Heading</h3><span class="ag-caption">Caption</span><section style="--text-scale:1.25"><h3 class="ag-h3">Nested</h3></section>';
  const headings = host.querySelectorAll("h3");
  expect(parseFloat(getComputedStyle(headings[0]).fontSize)).to.be.closeTo(
    20 * 1.5 ** 3,
    0.02
  );
  expect(parseFloat(getComputedStyle(headings[1]).fontSize)).to.be.closeTo(
    20 * 1.25 ** 3,
    0.02
  );
  host.style.setProperty("--h3-text-size", "31px");
  expect(getComputedStyle(headings[1]).fontSize).to.equal("31px");
});

it("resolves relative and calculated popover gaps through CSS layout", async () => {
  host.innerHTML =
    '<button>Open</button><div class="ag-popover" aria-label="Info" style="--popover-gap:calc(1rem + 7px)"><div class="ag-popover__body">Details</div></div>';
  const trigger = host.querySelector("button"),
    panel = host.querySelector(".ag-popover");
  const c = use(enhancePopover(panel, { trigger }));
  c.show({ focus: false });
  await wait();
  const expected =
    parseFloat(getComputedStyle(document.documentElement).fontSize) + 7;
  expect(
    panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom
  ).to.be.closeTo(expected, 1);
  panel.style.setProperty("font-size", "20px");
  panel.style.setProperty("--popover-gap", "2em");
  c.refresh();
  expect(
    panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom
  ).to.be.closeTo(40, 1);
});

it("uses the same resolved gap for popup-menu fallback positioning", async () => {
  host.innerHTML =
    '<button>Actions</button><div class="ag-popup-menu" style="--popup-menu-gap:calc(1rem + 9px)"><button class="ag-menu-item">Copy</button></div>';
  const supports = CSS.supports;
  let c;
  const trigger = host.querySelector("button"),
    menu = host.querySelector(".ag-popup-menu");
  try {
    CSS.supports = () => false;
    c = use(enhancePopupMenu(menu, { trigger }));
  } finally {
    CSS.supports = supports;
  }
  c.show();
  await wait();
  expect(
    menu.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom
  ).to.be.closeTo(
    parseFloat(getComputedStyle(document.documentElement).fontSize) + 9,
    1
  );
});

it("reconfigures an existing helper and exposes immediate reconciliation", () => {
  host.innerHTML = sliderMarkup();
  const root = host.firstElementChild;
  const c = use(enhanceSlider(root));
  const same = enhanceSlider(root, {
    value: 70,
    formatValue: (value) => `${value} points`,
  });
  expect(same === c).to.equal(true);
  expect(c.input.value).to.equal("70");
  expect(c.input.getAttribute("aria-valuetext")).to.equal("70 points");
  c.input.value = "30";
  c.refresh();
  expect(c.input.getAttribute("aria-valuetext")).to.equal("30 points");
  c.update({ formatValue: undefined });
  expect(c.input.hasAttribute("aria-valuetext")).to.equal(false);
});

it("composes slider read-only state safely with an enclosing control scope", async () => {
  host.innerHTML = `<form>${sliderMarkup({ isReadOnly: true })}</form>`;
  const form = host.querySelector("form"),
    input = host.querySelector("input");
  input.required = true;
  const slider = use(enhanceSlider(host.querySelector(".ag-slider")));
  const controls = use(enhanceControls(form));
  expect(input.getAttribute("aria-readonly")).to.equal("true");
  expect(input.required).to.equal(false);
  controls.destroy();
  expect(input.getAttribute("aria-readonly")).to.equal("true");
  input.focus();
  const value = input.value;
  await sendKeys({ press: "ArrowRight" });
  expect(input.value).to.equal(value);
  slider.destroy();
  expect(input.hasAttribute("aria-readonly")).to.equal(false);
  expect(input.required).to.equal(true);
});

it("updates text-field values and validation without rebuilding the helper", () => {
  host.innerHTML =
    '<div class="ag-text-field"><div class="ag-text-field__control"><input class="ag-text-field__input" aria-label="Name"></div></div>';
  const c = use(enhanceTextField(host.firstElementChild));
  c.update({
    value: "Good",
    validation: (input) => (input.value === "Good" ? null : "Bad value"),
  });
  expect(c.validate()).to.equal(true);
  enhanceTextField(host.firstElementChild, { value: "Other" });
  expect(c.validate()).to.equal(false);
});

it("closes dialogs by default but honours a canceled dismissal", async () => {
  host.innerHTML =
    '<button>Open</button><dialog class="ag-dialog" aria-label="Details"><button>Done</button></dialog>';
  const dialog = host.querySelector("dialog"),
    c = use(enhanceDialog(dialog));
  host.querySelector("button").focus();
  await c.show();
  const prevent = (event) => event.preventDefault();
  dialog.addEventListener("dismiss", prevent);
  await sendKeys({ press: "Escape" });
  await wait();
  expect(dialog.open).to.equal(true);
  dialog.removeEventListener("dismiss", prevent);
  await sendKeys({ press: "Escape" });
  await wait();
  expect(dialog.open).to.equal(false);
  expect(document.activeElement === host.querySelector("button")).to.equal(
    true
  );
});

it("uses shared entry/exit speeds and delays in dialogs and notifications", async () => {
  host.style.cssText +=
    ";--motion-slow-duration:100ms;--motion-medium-duration:50ms;--motion-entry-delay:10ms;--motion-exit-delay:20ms";
  host.innerHTML =
    '<dialog class="ag-dialog" aria-label="Details">Details</dialog><div class="ag-notification"><span class="ag-notification__message">Saved</span><button class="ag-notification__close" aria-label="Close"></button></div>';
  const dialog = host.querySelector("dialog"),
    notice = host.querySelector(".ag-notification");
  const d = use(enhanceDialog(dialog)),
    n = use(enhanceNotification(notice));
  await d.show();
  let timing = dialog
    .getAnimations()
    .find((a) => a.constructor.name === "Animation")
    .effect.getTiming();
  expect(timing.duration).to.equal(100);
  expect(timing.delay).to.equal(10);
  const close = d.hide();
  timing = dialog
    .getAnimations()
    .find((a) => a.constructor.name === "Animation")
    .effect.getTiming();
  expect(timing.duration).to.equal(50);
  expect(timing.delay).to.equal(20);
  await close;
  const open = n.show();
  timing = notice.getAnimations()[0].effect.getTiming();
  expect(timing.duration).to.equal(100);
  expect(timing.delay).to.equal(10);
  await open;
  const hide = n.hide();
  timing = notice.getAnimations()[0].effect.getTiming();
  expect(timing.duration).to.equal(50);
  expect(timing.delay).to.equal(20);
  await hide;
});

it("diagnoses malformed decorative markup before mutating the component", () => {
  host.innerHTML =
    '<label class="ag-checkbox"><span class="ag-check__control"></span><input class="ag-check__input" type="checkbox"></label>';
  expect(
    validateMarkup(host).some((issue) => issue.message.includes("before"))
  ).to.equal(true);
  const original = host.innerHTML;
  expect(() => enhanceControls(host)).to.throw("Invalid Afterglow markup");
  expect(host.innerHTML).to.equal(original);
});

it("automatically reconciles tab availability and supports configuration updates", async () => {
  host.innerHTML =
    '<div class="ag-tabbed-view"><div class="ag-tab-strip" aria-label="Views"><button class="ag-tab" aria-controls="a">A</button><button class="ag-tab" aria-controls="b">B</button></div><div class="ag-tabbed-view__panel" id="a">A</div><div class="ag-tabbed-view__panel" id="b">B</div></div>';
  const c = use(enhanceTabbedView(host.firstElementChild));
  c.update({ selectedPanelId: "b", activation: "manual" });
  expect(c.selectedPanelId).to.equal("b");
  host.querySelector('[aria-controls="b"]').disabled = true;
  await wait();
  expect(c.selectedPanelId).to.equal("a");
});

it("validates an initial text value before returning the controller", () => {
  host.innerHTML =
    '<div class="ag-text-field"><div class="ag-text-field__control"><input class="ag-text-field__input" aria-label="Name"></div></div>';
  const c = use(
    enhanceTextField(host.firstElementChild, {
      value: "Ready",
      validation: (input) => (input.value === "Ready" ? null : "Not ready"),
    })
  );
  expect(c.input.value).to.equal("Ready");
  expect(c.input.validity.valid).to.equal(true);
});

it("keeps an enclosing read-only scope active when the slider is destroyed first", async () => {
  host.innerHTML = `<form>${sliderMarkup({ isReadOnly: true })}</form>`;
  const input = host.querySelector("input");
  input.required = true;
  const controls = use(enhanceControls(host.querySelector("form")));
  const slider = use(enhanceSlider(host.querySelector(".ag-slider")));
  slider.destroy();
  expect(input.getAttribute("aria-readonly")).to.equal("true");
  input.focus();
  const value = input.value;
  await sendKeys({ press: "ArrowRight" });
  expect(input.value).to.equal(value);
  controls.destroy();
  expect(input.required).to.equal(true);
  expect(input.hasAttribute("aria-readonly")).to.equal(false);
});

it("updates token catalogues, selection and submitted names atomically", () => {
  host.innerHTML =
    '<form><div class="ag-text-field ag-token-field"><div class="ag-text-field__control"><input class="ag-text-field__input" type="text" name="people" aria-label="People"></div></div></form>';
  const root = host.querySelector(".ag-token-field");
  const c = use(
    enhanceTokenField(root, {
      items: [{ value: "a", label: "Alex" }],
      values: ["a"],
    })
  );
  const same = enhanceTokenField(root, {
    items: [{ value: "b", label: "Bea" }],
    values: ["b"],
    name: "guests",
    required: true,
  });
  expect(same === c).to.equal(true);
  expect(c.values).to.deep.equal(["b"]);
  expect(
    new FormData(host.querySelector("form")).getAll("guests")
  ).to.deep.equal(["b"]);
  expect(() => c.update({ values: ["missing"], name: "broken" })).to.throw();
  expect(c.values).to.deep.equal(["b"]);
  expect(
    new FormData(host.querySelector("form")).getAll("guests")
  ).to.deep.equal(["b"]);
});

it("repositions an open popover when configuration changes and rejects trigger replacement", async () => {
  host.innerHTML =
    '<button>Open</button><div class="ag-popover" aria-label="Info">Details</div><button>Other</button>';
  const trigger = host.firstElementChild,
    panel = host.querySelector(".ag-popover");
  const c = use(enhancePopover(panel, { trigger }));
  c.show();
  await wait();
  expect(panel.dataset.side).to.equal("bottom");
  expect(
    enhancePopover(panel, { trigger, placement: "inline-end" }) === c
  ).to.equal(true);
  expect(panel.dataset.side).to.equal("right");
  expect(() => c.update({ trigger: host.lastElementChild })).to.throw(
    "changing its trigger"
  );
  c.hide();
});
