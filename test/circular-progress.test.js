import { expect } from "@esm-bundle/chai";
import { emulateMedia } from "@web/test-runner-commands";
import { enhanceCircularProgress } from "../src/main.ts";

let root;
let controller;
const style = (element, pseudo) => getComputedStyle(element, pseudo);
const flush = () => new Promise((resolve) => requestAnimationFrame(resolve));
const fixture = (options = {}, attributes = 'value="0" max="100"') => {
  root.innerHTML = `<label class="ag-circular-progress">
    <progress class="ag-circular-progress__native" ${attributes}></progress>
    <span class="ag-circular-progress__title">Upload</span>
  </label>`;
  const component = root.firstElementChild;
  controller = enhanceCircularProgress(component, options);
  return {
    component,
    progress: controller.progress,
    ring: component.querySelector(".ag-circular-progress__ring"),
    title: component.querySelector(".ag-circular-progress__title"),
  };
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
  document.body.append(root);
});
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  root.remove();
});

it("keeps one labelled native progress element and a decorative ring", () => {
  const { component, progress, ring, title } = fixture();
  expect(progress).to.be.instanceOf(HTMLProgressElement);
  expect(progress.labels[0]).to.equal(component);
  expect(progress.getAttribute("aria-label")).to.equal("Upload");
  expect(progress.hasAttribute("role")).to.equal(false);
  expect(progress.hasAttribute("aria-valuenow")).to.equal(false);
  expect(ring.getAttribute("aria-hidden")).to.equal("true");
  expect(progress.tabIndex).to.equal(-1);
  expect(style(progress).display).not.to.equal("none");
  expect(style(progress).clipPath).to.equal("inset(50%)");
  expect(ring.getBoundingClientRect().width).to.equal(24);
  expect(ring.getBoundingClientRect().height).to.equal(24);
  expect(style(component).gap).to.equal("4px");
  expect(parseFloat(style(title).fontSize)).to.be.closeTo(16 / 1.2 ** 3, 0.01);
});

it("derives all four states and recovers from an error without losing the amount", () => {
  const { component, progress, ring } = fixture();
  expect(controller.state).to.equal("not-started");
  expect(progress.getAttribute("aria-valuetext")).to.equal("Not started");
  expect(style(ring, "::before").borderTopWidth).to.equal("1px");

  controller.value = 38;
  expect(controller.state).to.equal("in-progress");
  expect(component.dataset.state).to.equal("in-progress");
  expect(ring.style.getPropertyValue("--ag-circular-progress-value")).to.equal(
    "38%"
  );
  expect(progress.getAttribute("aria-valuetext")).to.equal("In progress: 38%");

  controller.value = 100;
  expect(controller.state).to.equal("complete");
  expect(style(ring, "::before").borderTopWidth).to.equal("2px");
  expect(style(ring, "::after").maskImage).to.include("check.svg");
  expect(progress.getAttribute("aria-valuetext")).to.equal("Complete");

  controller.update({ value: 38, error: true });
  expect(controller.state).to.equal("error");
  expect(controller.value).to.equal(38);
  expect(style(component).color).to.equal("rgb(207, 53, 88)");
  expect(style(ring, "::after").maskImage).to.include("alert-circle.svg");
  expect(progress.getAttribute("aria-valuetext")).to.equal("Error: 38%");

  controller.error = false;
  expect(controller.state).to.equal("in-progress");
  expect(controller.value).to.equal(38);
  expect(style(component).color).to.equal("rgb(94, 140, 151)");
});

it("observes native property, attribute, title and error updates", async () => {
  const { component, progress, ring, title } = fixture();
  progress.value = 50;
  progress.max = 200;
  title.textContent = "Download";
  await flush();
  expect(ring.style.getPropertyValue("--ag-circular-progress-value")).to.equal(
    "25%"
  );
  expect(progress.getAttribute("aria-label")).to.equal("Download");

  component.setAttribute("data-error", "");
  await flush();
  expect(component.dataset.state).to.equal("error");
  component.removeAttribute("data-error");
  progress.setAttribute("value", "200");
  await flush();
  expect(component.dataset.state).to.equal("complete");
});

it("uses native clamping and updates value and max together without synthetic events", () => {
  const { progress, ring } = fixture();
  let events = 0;
  progress.addEventListener("input", () => events++);
  progress.addEventListener("change", () => events++);
  controller.value = -10;
  expect(controller.value).to.equal(0);
  controller.update({ max: 8, value: 2.5 });
  expect(controller.max).to.equal(8);
  expect(ring.style.getPropertyValue("--ag-circular-progress-value")).to.equal(
    "31.25%"
  );
  controller.value = 20;
  expect(controller.value).to.equal(8);
  expect(controller.state).to.equal("complete");
  expect(events).to.equal(0);
});

it("supports unknown amounts and stops the indeterminate animation on error", () => {
  const { progress, ring } = fixture({ value: null });
  expect(controller.value).to.equal(null);
  expect(progress.matches(":indeterminate")).to.equal(true);
  expect(controller.state).to.equal("in-progress");
  expect(progress.getAttribute("aria-valuetext")).to.equal("In progress");
  expect(style(ring, "::after").animationName).to.equal(
    "ag-circular-progress-spin"
  );

  controller.error = true;
  expect(style(ring, "::after").animationName).to.equal("none");
  expect(progress.getAttribute("aria-valuetext")).to.equal("Error");
  controller.update({ value: 0, error: false });
  expect(controller.state).to.equal("not-started");
  expect(style(ring, "::after").animationName).to.equal("none");
});

it("assigns titles as text, supports translated states and preserves external label references", () => {
  const { progress, title } = fixture({ title: "<b>Upload</b>" });
  expect(title.textContent).to.equal("<b>Upload</b>");
  expect(title.children.length).to.equal(0);
  controller.title = "Téléversement";
  expect(controller.title).to.equal("Téléversement");
  controller.update({ value: 100, stateLabels: { complete: "Terminé" } });
  expect(progress.getAttribute("aria-valuetext")).to.equal("Terminé");
  progress.setAttribute("aria-labelledby", "external-label");
  controller.title = "";
  expect(progress.getAttribute("aria-labelledby")).to.equal("external-label");
  expect(style(title).display).to.equal("none");
  expect(progress.getAttribute("aria-label")).to.equal("Progress");
});

it("rejects invalid options without partly applying an update", () => {
  const { component } = fixture();
  expect(() => controller.update({ title: "Changed", max: 0 })).to.throw(
    RangeError
  );
  expect(controller.title).to.equal("Upload");
  expect(() => (controller.max = Infinity)).to.throw(RangeError);
  expect(() => (controller.value = NaN)).to.throw(RangeError);
  expect(enhanceCircularProgress(component)).to.equal(controller);

  const invalid = document.createElement("div");
  expect(() => enhanceCircularProgress(invalid)).to.throw("requires");
  invalid.innerHTML =
    '<progress></progress><span class="ag-circular-progress__title">Test</span>';
  expect(() => enhanceCircularProgress(invalid, { max: -1 })).to.throw(
    RangeError
  );
  expect(invalid.querySelector(".ag-circular-progress__ring")).to.equal(null);
});

it("cleans up and can enhance again while preserving the latest title and native value", async () => {
  const { component, progress } = fixture(
    {},
    'value="0" max="100" aria-label="Original" aria-valuetext="Waiting"'
  );
  controller.update({ title: "Updated", value: 45 });
  controller.destroy();
  controller.destroy();
  expect(component.querySelector(".ag-circular-progress__ring")).to.equal(null);
  expect(component.hasAttribute("data-enhanced")).to.equal(false);
  expect(progress.value).to.equal(45);
  expect(progress.getAttribute("aria-label")).to.equal("Original");
  expect(progress.getAttribute("aria-valuetext")).to.equal("Waiting");
  expect(style(progress).position).not.to.equal("absolute");
  progress.value = 90;
  await flush();
  expect(component.hasAttribute("data-state")).to.equal(false);
  controller = enhanceCircularProgress(component);
  expect(controller.title).to.equal("Updated");
  expect(controller.value).to.equal(90);
  expect(
    component.querySelectorAll(".ag-circular-progress__ring").length
  ).to.equal(1);
});

it("inherits theme overrides, keeps a circle in RTL and wraps long titles", () => {
  root.className = "ag-theme";
  root.dir = "rtl";
  root.style.cssText =
    "width:80px;--circular-progress-size:40px;--circular-progress-title-gap:8px;--ctrlTextDesat:rgb(10,20,30)";
  const { component, ring, title } = fixture({
    value: 25,
    title: "Averylongfilenamethatneedstowrap.zip",
  });
  expect(ring.getBoundingClientRect().width).to.equal(40);
  expect(ring.getBoundingClientRect().height).to.equal(40);
  expect(style(component).color).to.equal("rgb(10, 20, 30)");
  expect(style(component).gap).to.equal("8px");
  expect(component.scrollWidth).to.be.at.most(80);
  expect(title.getBoundingClientRect().height).to.be.greaterThan(14);
  expect(style(ring, "::after").backgroundImage).to.include("25%");
});

it("honours hidden on the wrapper and title", () => {
  const { component, title } = fixture();
  title.hidden = true;
  expect(style(title).display).to.equal("none");
  expect(component.getBoundingClientRect().height).to.equal(24);
  component.hidden = true;
  expect(style(component).display).to.equal("none");
});

it("keeps unknown progress stationary with reduced motion", async () => {
  await emulateMedia({ reducedMotion: "reduce" });
  try {
    const { ring } = fixture({ value: null });
    expect(style(ring, "::after").animationName).to.equal("none");
    expect(controller.state).to.equal("in-progress");
  } finally {
    await emulateMedia({ reducedMotion: "no-preference" });
  }
});

it("keeps ring and state glyphs visible in forced colours", async function () {
  await emulateMedia({ forcedColors: "active" });
  try {
    if (!matchMedia("(forced-colors: active)").matches) this.skip();
    const { ring } = fixture({ value: 25 });
    if (CSS.supports("forced-color-adjust", "none"))
      expect(style(ring).getPropertyValue("forced-color-adjust")).to.equal("none");
    expect(style(ring, "::after").backgroundImage).not.to.equal("none");
    controller.value = 100;
    expect(style(ring, "::after").maskImage).to.include("check.svg");
    controller.error = true;
    expect(style(ring, "::after").maskImage).to.include("alert-circle.svg");
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});
