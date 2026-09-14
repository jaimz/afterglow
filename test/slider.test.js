import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse, resetMouse } from "@web/test-runner-commands";
import { enhanceControls, enhanceSlider } from "../src/main.ts";
import { sliderMarkup } from "../src/stories/fixtures.ts";

let form, root, slider, controls;
const settle = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const fixture = (args = {}, options) => {
  form = document.createElement("form");
  form.style.cssText = "width:300px;margin:30px;";
  form.innerHTML = sliderMarkup(args);
  document.body.append(form);
  root = form.firstElementChild;
  slider = enhanceSlider(root, options);
  return slider;
};
const tips = () => [...root.querySelectorAll(".ag-slider__tooltip")];
const point = (percent) => {
  const track = root.querySelector(".ag-slider__track").getBoundingClientRect();
  const vertical = root.dataset.orientation === "vertical";
  const rtl = getComputedStyle(root).direction === "rtl";
  return vertical
    ? [
        Math.round(track.left + track.width / 2),
        Math.round(track.top + (track.height * percent) / 100),
      ]
    : [
        Math.round(
          rtl
            ? track.right - (track.width * percent) / 100
            : track.left + (track.width * percent) / 100
        ),
        Math.round(track.top + track.height / 2),
      ];
};
const drag = async (from, to) => {
  await sendMouse({ type: "move", position: point(from) });
  await sendMouse({ type: "down" });
  await sendMouse({ type: "move", position: point(to) });
  await sendMouse({ type: "up" });
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
afterEach(async () => {
  await resetMouse();
  controls?.destroy();
  controls = undefined;
  slider?.destroy();
  form?.remove();
});

it("shows a live formatted bubble only while the native thumb is held, including release outside", async () => {
  fixture({ value: 20 }, { formatValue: (value) => `${value}%` });
  expect(tips()[0].hidden).to.equal(true);
  await sendMouse({ type: "move", position: point(20) });
  expect(tips()[0].hidden).to.equal(true);
  await sendMouse({ type: "down" });
  expect(tips()[0].hidden).to.equal(false);
  await sendMouse({ type: "move", position: point(60) });
  expect(slider.input.value).to.equal("60");
  expect(tips()[0].textContent).to.equal("60%");
  const tip = tips()[0].getBoundingClientRect();
  expect(tip.left + tip.width / 2).to.be.closeTo(point(60)[0], 1);
  expect(tip.bottom).to.be.lessThan(point(60)[1] - 10);
  await sendMouse({ type: "move", position: [500, 250] });
  await sendMouse({ type: "up" });
  expect(tips()[0].hidden).to.equal(true);
});

it("supports held keyboard adjustment, cancellation and disabled/read-only states", async () => {
  fixture({ value: 30 });
  slider.input.focus();
  slider.input.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
  );
  expect(tips()[0].hidden).to.equal(false);
  slider.input.dispatchEvent(
    new KeyboardEvent("keyup", { key: "ArrowRight", bubbles: true })
  );
  expect(tips()[0].hidden).to.equal(true);
  slider.input.dispatchEvent(
    new PointerEvent("pointerdown", { pointerId: 7, bubbles: true })
  );
  expect(tips()[0].hidden).to.equal(false);
  document.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 7 }));
  expect(tips()[0].hidden).to.equal(true);
  slider.input.setAttribute("data-readonly", "");
  controls = enhanceControls(form);
  await sendKeys({ press: "ArrowRight" });
  await sendMouse({ type: "click", position: point(80) });
  expect(slider.input.value).to.equal("30");
  expect(tips()[0].hidden).to.equal(true);
  slider.input.disabled = true;
  await sendMouse({ type: "click", position: point(80) });
  expect(tips()[0].hidden).to.equal(true);
});

it("exposes two independently named form values and fills only the selected interval", () => {
  fixture({ isRange: true, value: 20, upperValue: 70 });
  expect(new FormData(form).get("lower")).to.equal("20");
  expect(new FormData(form).get("upper")).to.equal("70");
  expect(slider.input.getAttribute("aria-valuemax")).to.equal("70");
  expect(slider.upperInput.getAttribute("aria-valuemin")).to.equal("20");
  expect(slider.input.getAttribute("aria-label")).to.equal("Lower value");
  expect(slider.upperInput.getAttribute("aria-label")).to.equal("Upper value");
  const track = root.querySelector(".ag-slider__track").getBoundingClientRect();
  const fill = root.querySelector(".ag-slider__fill").getBoundingClientRect();
  expect(fill.left).to.be.closeTo(track.left + track.width * 0.2, 1);
  expect(fill.width).to.be.closeTo(track.width * 0.5, 1);
});

it("drags both native thumbs and clamps crossings before input listeners run", async () => {
  fixture({ isRange: true, value: 20, upperValue: 70 });
  const values = [];
  form.addEventListener("input", () =>
    values.push([slider.input.valueAsNumber, slider.upperInput.valueAsNumber])
  );
  await sendMouse({ type: "move", position: point(20) });
  await sendMouse({ type: "down" });
  expect(tips().map((tip) => tip.hidden)).to.deep.equal([false, true]);
  await sendMouse({ type: "move", position: point(90) });
  await sendMouse({ type: "up" });
  expect(slider.input.value).to.equal("70");
  slider.setValues(20, 70);
  await drag(70, 10);
  expect(slider.upperInput.value).to.equal("20");
  expect(values.length).to.be.greaterThan(0);
  expect(values.every(([lower, upper]) => lower <= upper)).to.equal(true);
  expect(tips().every((tip) => tip.hidden)).to.equal(true);
});

it("chooses the nearest handle for track clicks and dragging and emits a single commit", async () => {
  fixture({ isRange: true, value: 30, upperValue: 70 });
  let changes = 0;
  form.addEventListener("change", () => changes++);
  await sendMouse({ type: "click", position: point(10) });
  expect(slider.input.value).to.equal("10");
  expect(slider.upperInput.value).to.equal("70");
  expect(changes).to.equal(1);
  await drag(90, 80);
  expect(slider.upperInput.value).to.equal("80");
  expect(changes).to.equal(2);
});

it("lets coincident handles separate in either direction and retains keyboard order", async () => {
  fixture({ isRange: true, value: 50, upperValue: 50 });
  await sendMouse({ type: "click", position: point(20) });
  expect(slider.input.value).to.equal("20");
  slider.setValues(50, 50);
  await sendMouse({ type: "click", position: point(80) });
  expect(slider.upperInput.value).to.equal("80");
  slider.input.focus();
  await sendKeys({ press: "Tab" });
  expect(document.activeElement === slider.upperInput).to.equal(true);
});

it("limits keyboard input to the other thumb and updates accessible bounds", async () => {
  fixture({ isRange: true, value: 30, upperValue: 70 });
  slider.input.focus();
  await sendKeys({ press: "End" });
  expect(slider.input.value).to.equal("70");
  slider.upperInput.focus();
  await sendKeys({ press: "Home" });
  expect(slider.upperInput.value).to.equal("70");
  await sendKeys({ press: "ArrowRight" });
  expect(slider.upperInput.value).to.equal("80");
  expect(slider.input.getAttribute("aria-valuemax")).to.equal("80");
  expect(tips().every((tip) => tip.hidden)).to.equal(true);
});

it("synchronises bounds, decimal steps, formatted values and reset without emitting programmatic events", async () => {
  fixture(
    { isRange: true, min: 10, max: 20, step: 0.25, value: 12, upperValue: 18 },
    { formatValue: (value) => `$${value}` }
  );
  let events = 0;
  form.addEventListener("input", () => events++);
  form.addEventListener("change", () => events++);
  slider.setValues(16.8, 13.1);
  expect(slider.input.value).to.equal("13");
  expect(slider.upperInput.value).to.equal("16.75");
  slider.input.max = "15";
  slider.input.step = ".5";
  await settle();
  expect(slider.upperInput.max).to.equal("15");
  expect(slider.upperInput.step).to.equal(".5");
  expect(slider.upperInput.value).to.equal("15");
  expect(tips()[1].textContent).to.equal("$15");
  expect(slider.upperInput.getAttribute("aria-valuetext")).to.equal("$15");
  form.reset();
  await settle();
  expect(slider.input.value).to.equal("12");
  expect(slider.upperInput.value).to.equal("15");
  expect(events).to.equal(0);
});

it("supports continuous values, cancelled reset, and disabled or read-only pairs", async () => {
  fixture({ isRange: true, value: 20, upperValue: 80 });
  slider.input.step = "any";
  slider.update();
  slider.setValues(12.3, 78.9);
  form.addEventListener("reset", (event) => event.preventDefault());
  form.reset();
  await settle();
  expect(slider.input.value).to.equal("12.3");
  expect(slider.upperInput.value).to.equal("78.9");
  for (const input of [slider.input, slider.upperInput])
    input.setAttribute("data-readonly", "");
  controls = enhanceControls(form);
  await sendMouse({ type: "click", position: point(100) });
  slider.upperInput.focus();
  await sendKeys({ press: "ArrowLeft" });
  expect(slider.upperInput.value).to.equal("78.9");
  for (const input of [slider.input, slider.upperInput]) input.disabled = true;
  await sendMouse({ type: "click", position: point(0) });
  expect(slider.input.value).to.equal("12.3");
});

it("supports two handles and track clicks in RTL and vertical layouts", async () => {
  fixture({ isRange: true, value: 20, upperValue: 70, withMarks: true });
  root.dir = "rtl";
  await sendMouse({ type: "click", position: point(90) });
  expect(slider.upperInput.value).to.equal("90");
  root.dataset.orientation = "vertical";
  await settle();
  await drag(20, 40);
  expect(slider.input.value).to.equal("40");
  slider.upperInput.focus();
  await sendKeys({ press: "ArrowUp" });
  expect(slider.upperInput.value).to.equal("80");
  const track = root.querySelector(".ag-slider__track").getBoundingClientRect();
  const fill = root.querySelector(".ag-slider__fill").getBoundingClientRect();
  expect(fill.top).to.be.closeTo(track.top + track.height * 0.4, 1);
  expect(fill.height).to.be.closeTo(track.height * 0.4, 1);
});

it("cleans up bubbles, interaction handlers and ARIA on destroy and can be enhanced again", () => {
  fixture({ isRange: true, value: 20, upperValue: 70 });
  expect(enhanceSlider(root) === slider).to.equal(true);
  slider.destroy();
  expect(tips()).to.have.length(0);
  expect(slider.input.hasAttribute("aria-valuemax")).to.equal(false);
  slider.input.value = "90";
  slider.input.dispatchEvent(new Event("input", { bubbles: true }));
  expect(slider.input.value).to.equal("90");
  slider = enhanceSlider(root);
  expect(tips()).to.have.length(2);
  expect(slider.input.value).to.equal("70");
});
