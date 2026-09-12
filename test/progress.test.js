import { expect } from "@esm-bundle/chai";
import { emulateMedia } from "@web/test-runner-commands";

let root;
const style = (element, pseudo) => getComputedStyle(element, pseudo);
const bounds = (element) => element.getBoundingClientRect();
const fixture = (
  attributes = 'value="25" max="100"',
  label = "Uploading files"
) => {
  root.innerHTML = `<label class="ag-progress"><progress class="ag-progress__bar" ${attributes}></progress><span class="ag-progress__label">${label}</span></label>`;
  return {
    component: root.firstElementChild,
    progress: root.querySelector("progress"),
    label: root.querySelector(".ag-progress__label"),
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
afterEach(() => root.remove());

it("uses native progress values and label association without adding keyboard interaction", () => {
  const { component, progress } = fixture();
  expect(progress).to.be.instanceOf(HTMLProgressElement);
  expect(progress.labels[0]).to.equal(component);
  expect(component.control).to.equal(progress);
  expect(progress.value).to.equal(25);
  expect(progress.max).to.equal(100);
  expect(progress.position).to.equal(0.25);
  expect(progress.tabIndex).to.equal(-1);
  progress.value = 70;
  expect(progress.position).to.equal(0.7);
  progress.max = 200;
  expect(progress.position).to.equal(0.35);
  expect(progress.hasAttribute("role")).to.equal(false);
  expect(progress.hasAttribute("aria-valuenow")).to.equal(false);
});

it("retains native bounds, distinguishes zero from indeterminate and reacts to property writes", () => {
  const { component, progress } = fixture();
  progress.value = -10;
  expect(progress.value).to.equal(0);
  expect(progress.matches(":indeterminate")).to.equal(false);
  progress.value = 150;
  expect(progress.value).to.equal(100);
  progress.max = 0;
  expect(progress.max).to.equal(100);
  progress.setAttribute("max", "0");
  expect(progress.max).to.equal(1);
  progress.removeAttribute("value");
  expect(progress.position).to.equal(-1);
  expect(progress.matches(":indeterminate")).to.equal(true);
  expect(style(component, "::before").content).to.equal('""');
  expect(style(component, "::before").animationName).to.equal(
    "ag-progress-indeterminate"
  );
  progress.max = 100;
  progress.value = 40;
  expect(progress.position).to.equal(0.4);
  expect(style(component, "::before").content).to.equal("none");
});

it("uses the specified bar dimensions, caption treatment and three variant colours", () => {
  const { component, progress, label } = fixture();
  expect(bounds(component).width).to.equal(142);
  expect(bounds(progress).height).to.equal(3);
  expect(style(progress).backgroundSize).to.equal("100% 1px");
  expect(style(component).gap).to.equal("3px");
  expect(parseFloat(style(label).fontSize)).to.be.closeTo(11.11, 0.01);
  expect(style(label).fontWeight).to.equal("700");
  expect(style(label).textAlign).to.equal("center");
  for (const [variant, colour] of [
    ["default", "rgb(94, 140, 151)"],
    ["error", "rgb(207, 53, 88)"],
    ["caution", "rgb(236, 187, 91)"],
  ]) {
    component.dataset.variant = variant;
    expect(style(component).color).to.equal(colour);
    expect(style(progress).color).to.equal(colour);
    expect(style(label).color).to.equal(colour);
    expect(progress.value).to.equal(25);
  }
});

it("inherits local theme values and wraps long labels without overflowing a narrow container", () => {
  root.className = "ag-theme";
  root.style.cssText =
    "width:90px;--progress-width:100%;--progress-height:5px;--progress-label-gap:8px;--ctrlTextDesat:rgb(10,20,30);--body-text-size:20px";
  const { component, progress, label } = fixture(
    'value="5" max="10"',
    "Averylongfilenamethatneedstowrapwithintheavailablewidth.zip"
  );
  expect(bounds(component).width).to.equal(90);
  expect(bounds(progress).height).to.equal(5);
  expect(bounds(label).height).to.be.greaterThan(20);
  expect(component.scrollWidth).to.be.at.most(90);
  expect(style(progress).color).to.equal("rgb(10, 20, 30)");
  expect(style(component).gap).to.equal("8px");
  expect(parseFloat(style(label).fontSize)).to.be.closeTo(20 / 1.2 ** 2, 0.01);
});

it("honours hidden on the wrapper, the label and an indeterminate bar", () => {
  const { component, progress, label } = fixture('max="100"');
  progress.hidden = true;
  expect(style(progress).display).to.equal("none");
  expect(style(component, "::before").content).to.equal("none");
  progress.hidden = false;
  label.hidden = true;
  expect(style(label).display).to.equal("none");
  expect(bounds(component).height).to.equal(3);
  component.hidden = true;
  expect(style(component).display).to.equal("none");
});

it("uses RTL direction and leaves indeterminate errors stationary", () => {
  root.dir = "rtl";
  const { component, progress } = fixture('max="100"');
  expect(style(progress).direction).to.equal("rtl");
  expect(
    style(component).getPropertyValue("--ag-progress-travel").trim()
  ).to.equal("-300%");
  expect(style(component, "::before").animationName).to.equal(
    "ag-progress-indeterminate"
  );
  component.dataset.variant = "error";
  expect(style(component, "::before").animationName).to.equal("none");
  expect(parseFloat(style(component, "::before").right)).to.be.closeTo(
    142 * 0.375,
    0.1
  );
  expect(progress.position).to.equal(-1);
});

it("shows stationary indeterminate progress when reduced motion is requested", async () => {
  await emulateMedia({ reducedMotion: "reduce" });
  try {
    const { component, progress } = fixture('max="100"');
    expect(style(component, "::before").animationName).to.equal("none");
    expect(parseFloat(style(component, "::before").left)).to.be.closeTo(
      142 * 0.375,
      0.1
    );
    expect(progress.position).to.equal(-1);
  } finally {
    await emulateMedia({ reducedMotion: "no-preference" });
  }
});

it("keeps the track and fill visible with system colours in forced-colour mode", async function () {
  await emulateMedia({ forcedColors: "active" });
  try {
    if (!matchMedia("(forced-colors: active)").matches) this.skip();
    const { component, progress } = fixture('max="100"');
    if (CSS.supports("forced-color-adjust", "none"))
      expect(style(progress).getPropertyValue("forced-color-adjust")).to.equal(
        "none"
      );
    expect(
      style(progress).getPropertyValue("--ag-progress-track").trim()
    ).to.equal("GrayText");
    expect(style(component, "::before").backgroundColor).to.equal(
      style(progress).color
    );
    if (CSS.supports("forced-color-adjust", "none"))
      expect(
        style(component, "::before").getPropertyValue("forced-color-adjust")
      ).to.equal("none");
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});
