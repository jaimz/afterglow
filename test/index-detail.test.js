import { expect } from "@esm-bundle/chai";
import { setViewport, sendKeys, emulateMedia } from "@web/test-runner-commands";
import { createIndexDetailExample } from "../src/frame/Layout/index-detail.stories.ts";
import { enhanceIndexDetail } from "../src/behaviors/index-detail.ts";
import { getMotionOptions } from "../src/behaviors/motion.ts";
import { cleanupStories } from "../src/stories/fixtures.ts";

let root;
const box = (node) => node.getBoundingClientRect();
const style = (node) => getComputedStyle(node);
const pane = (name) => root.querySelector(`.ag-index-detail__${name}`);
const tokenColor = (name) => {
  const probe = document.createElement("span");
  probe.style.color = `var(--${name})`;
  root.append(probe);
  const color = style(probe).color;
  probe.remove();
  return color;
};

before(async () => {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/afterglow.css";
  const ready = new Promise((resolve, reject) => {
    css.onload = resolve;
    css.onerror = reject;
  });
  document.head.append(css);
  await ready;
});
beforeEach(async () => {
  await setViewport({ width: 1200, height: 800 });
  root = createIndexDetailExample();
  root.style.setProperty("--motion-slow-duration", "0ms");
  root.style.setProperty("--motion-medium-duration", "0ms");
  document.body.append(root);
});
afterEach(() => {
  cleanupStories();
  root.remove();
});

it("adjoins the three surfaces with the sketch's inset, proportions and keyline", () => {
  const index = pane("index"),
    detail = pane("detail"),
    inspector = pane("inspector");
  expect(box(index).width / box(root).width).to.be.closeTo(405 / 2306, 0.001);
  expect(box(inspector).width / box(root).width).to.be.closeTo(
    522 / 2306,
    0.001
  );
  expect(box(index).top - box(detail).top).to.equal(8);
  expect(box(index).right).to.be.closeTo(box(detail).left, 0.1);
  expect(box(detail).right).to.be.closeTo(box(inspector).left, 0.1);
  expect(box(index).bottom).to.equal(box(detail).bottom);
  expect(style(index).backgroundColor).to.equal(tokenColor("surface"));
  expect(style(detail).backgroundColor).to.equal(tokenColor("panel"));
  expect(style(inspector).backgroundColor).to.equal(tokenColor("paper"));
  expect(style(inspector).borderLeftWidth).to.equal("1px");
});

it("gives the Inspector's space to Detail when hidden or omitted", () => {
  const inspector = pane("inspector");
  const initialWidth = box(pane("detail")).width;
  inspector.hidden = true;
  expect(style(inspector).display).to.equal("none");
  expect(box(pane("detail")).width).to.be.greaterThan(initialWidth);
  expect(box(pane("detail")).right).to.be.closeTo(box(root).right, 0.1);
  inspector.remove();
  expect(box(pane("detail")).right).to.be.closeTo(box(root).right, 0.1);
  root.hidden = true;
  expect(style(root).display).to.equal("none");
});

it("stacks inside a narrow container, including on desktop, without page overflow", () => {
  root.style.width = "360px";
  const index = pane("index"),
    detail = pane("detail"),
    inspector = pane("inspector");
  expect(box(detail).top).to.be.closeTo(box(index).bottom, 0.1);
  expect(box(inspector).top).to.be.closeTo(box(detail).bottom, 0.1);
  expect(box(detail).width).to.equal(box(root).width);
  expect(root.scrollWidth).to.equal(root.clientWidth);
  expect(style(inspector).borderLeftWidth).to.equal("0px");
  expect(style(inspector).borderTopWidth).to.equal("1px");
  root.style.width = "100%";
  root.dataset.orientation = "vertical";
  expect(box(detail).top).to.be.closeTo(box(index).bottom, 0.1);
});

it("gives only Detail the Inspector's height in narrow and explicit vertical layouts", () => {
  for (const vertical of [false, true]) {
    root.style.width = vertical ? "100%" : "600px";
    if (vertical) root.dataset.orientation = "vertical";
    const index = pane("index"),
      detail = pane("detail"),
      inspector = pane("inspector");
    inspector.hidden = false;
    const indexBefore = box(index),
      detailBefore = box(detail),
      inspectorHeight = box(inspector).height;
    inspector.hidden = true;
    expect(box(index).height).to.be.closeTo(indexBefore.height, 0.1);
    expect(box(detail).top).to.be.closeTo(detailBefore.top, 0.1);
    expect(box(detail).height).to.be.closeTo(
      detailBefore.height + inspectorHeight,
      0.1
    );
    expect(box(detail).bottom).to.be.closeTo(box(root).bottom, 0.1);
  }
});

it("mirrors the panes and border in RTL and contains each pane's scrolling", () => {
  root.dir = "rtl";
  expect(box(pane("index")).left).to.be.closeTo(box(pane("detail")).right, 0.1);
  expect(box(pane("inspector")).right).to.be.closeTo(
    box(pane("detail")).left,
    0.1
  );
  expect(style(pane("inspector")).borderRightWidth).to.equal("1px");
  const content = document.createElement("div");
  content.style.height = "1400px";
  pane("detail").append(content);
  expect(pane("detail").scrollHeight).to.be.greaterThan(
    pane("detail").clientHeight
  );
  pane("detail").scrollTop = 100;
  expect(pane("detail").scrollTop).to.equal(100);
  expect(pane("index").scrollTop).to.equal(0);
  expect(root.scrollHeight).to.equal(root.clientHeight);
});

it("shows the selected Index item in Detail and its selected note in Inspector", async () => {
  const link = root.querySelector('[data-notebook="1"]');
  link.focus();
  await sendKeys({ press: "Enter" });
  expect(link.getAttribute("aria-current")).to.equal("page");
  expect(root.querySelector("[data-title]").textContent).to.equal(
    "Project ideas"
  );
  const note = root.querySelector('[data-note="0"]');
  note.focus();
  await sendKeys({ press: "Enter" });
  expect(note.getAttribute("aria-pressed")).to.equal("true");
  expect(pane("inspector").textContent).to.include("Include distance, terrain");
  const toggle = root.querySelector("[data-inspector-toggle]");
  toggle.click();
  expect(pane("inspector").hidden).to.equal(true);
  expect(toggle.getAttribute("aria-expanded")).to.equal("false");
  note.click();
  expect(pane("inspector").hidden).to.equal(false);
  root.querySelector('[data-notebook="0"]').click();
  expect(pane("inspector").textContent).to.include(
    "Select a note to inspect it."
  );
});

it("keeps navigation row positions and sizes stable when selection changes", () => {
  root.style.width = "600px";
  const links = [...root.querySelectorAll("[data-notebook]")];
  const measure = () =>
    links.map((link) => {
      const { x, y, width, height } = box(link);
      return { x, y, width, height };
    });
  expect(
    links.every((link) => link.classList.contains("ag-menu-item"))
  ).to.equal(true);
  const initial = measure();
  links[1].click();
  expect(measure()).to.deep.equal(initial);
  links[0].click();
  expect(measure()).to.deep.equal(initial);
});

const readyForMotion = async () => {
  root.style.setProperty("--motion-slow-duration", "250ms");
  root.style.setProperty("--motion-medium-duration", "125ms");
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  return enhanceIndexDetail(root);
};

it("slides out and back in while resizing Detail, and waits to hide until exit finishes", async () => {
  const controller = await readyForMotion();
  const original = box(pane("inspector"));
  const detailWidth = box(pane("detail")).width;
  const closing = controller.setInspectorOpen(false);
  expect(pane("inspector").hidden).to.equal(false);
  expect(pane("inspector").inert).to.equal(true);
  const exit = root.getAnimations()[0];
  expect(exit.effect.getTiming().duration).to.equal(125);
  exit.pause();
  exit.currentTime = 62.5;
  expect(box(pane("inspector")).left).to.be.greaterThan(original.left);
  expect(box(pane("inspector")).width).to.be.closeTo(original.width, 0.1);
  expect(box(pane("detail")).width).to.be.greaterThan(detailWidth);
  exit.finish();
  await closing;
  expect(pane("inspector").hidden).to.equal(true);
  expect(root.hasAttribute("data-inspector-motion")).to.equal(false);
  const opening = controller.setInspectorOpen(true);
  const entry = root.getAnimations()[0];
  expect(entry.effect.getTiming().duration).to.equal(250);
  entry.pause();
  entry.currentTime = 125;
  expect(box(pane("inspector")).left).to.be.greaterThan(original.left);
  entry.finish();
  await opening;
  expect(box(pane("inspector")).left).to.be.closeTo(original.left, 0.1);
  expect(pane("inspector").inert).to.equal(false);
  expect(pane("inspector").style.inlineSize).to.equal("");
});

it("reverses from the current position and restores focus before hiding", async () => {
  const controller = await readyForMotion();
  pane("inspector").focus();
  const closing = controller.setInspectorOpen(false);
  expect(
    document.activeElement === root.querySelector("[data-inspector-toggle]")
  ).to.equal(true);
  const exit = root.getAnimations()[0];
  exit.pause();
  exit.currentTime = 60;
  const halfway = box(pane("inspector")).left;
  const opening = controller.setInspectorOpen(true);
  const entry = root.getAnimations()[0];
  entry.pause();
  entry.currentTime = 0;
  expect(box(pane("inspector")).left).to.be.closeTo(halfway, 0.2);
  entry.finish();
  await Promise.all([closing, opening]);
  expect(controller.inspectorOpen).to.equal(true);
  expect(pane("inspector").hidden).to.equal(false);
});

it("slides toward the inline end in RTL and down in a narrow layout", async () => {
  root.dir = "rtl";
  const controller = await readyForMotion();
  let before = box(pane("inspector"));
  let done = controller.setInspectorOpen(false);
  let animation = root.getAnimations()[0];
  animation.pause();
  animation.currentTime = 60;
  expect(box(pane("inspector")).right).to.be.lessThan(before.right);
  animation.finish();
  await done;
  await controller.setInspectorOpen(true);
  root.style.width = "600px";
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  before = box(pane("inspector"));
  const indexHeight = box(pane("index")).height;
  const detailTop = box(pane("detail")).top;
  done = controller.setInspectorOpen(false);
  animation = root.getAnimations()[0];
  animation.pause();
  animation.currentTime = 60;
  expect(box(pane("inspector")).top).to.be.greaterThan(before.top);
  expect(box(pane("inspector")).height).to.be.closeTo(before.height, 0.1);
  expect(box(pane("index")).height).to.be.closeTo(indexHeight, 0.1);
  expect(box(pane("detail")).top).to.be.closeTo(detailTop, 0.1);
  animation.finish();
  await done;
  expect(pane("inspector").hidden).to.equal(true);
  expect(box(pane("index")).height).to.be.closeTo(indexHeight, 0.1);
  done = controller.setInspectorOpen(true);
  animation = root.getAnimations()[0];
  animation.pause();
  animation.currentTime = 125;
  expect(box(pane("index")).height).to.be.closeTo(indexHeight, 0.1);
  expect(box(pane("detail")).top).to.be.closeTo(detailTop, 0.1);
  animation.finish();
  await done;
});

it("reads fractional CSS times, phase delays and stagger from the local theme", () => {
  root.style.setProperty("--motion-slow-duration", "0.25s");
  root.style.setProperty("--motion-medium-duration", "0.125s");
  root.style.setProperty("--motion-entry-delay", "0.02s");
  root.style.setProperty("--motion-exit-delay", "5ms");
  root.style.setProperty("--motion-stagger-delay", "10ms");
  expect(getMotionOptions(root, "entry", "slow", 2)).to.deep.equal({
    duration: 250,
    delay: 40,
    easing: "ease-in",
  });
  expect(getMotionOptions(root, "exit", "slow")).to.deep.equal({
    duration: 125,
    delay: 5,
    easing: "ease-out",
  });
  expect(getMotionOptions(root, "entry", "very-slow").duration).to.equal(1000);
});

it("skips motion and delays when reduced motion is requested", async () => {
  const controller = await readyForMotion();
  await emulateMedia({ reducedMotion: "reduce" });
  try {
    root.style.setProperty("--motion-exit-delay", "1s");
    await controller.setInspectorOpen(false);
    expect(pane("inspector").hidden).to.equal(true);
    expect(root.getAnimations().length).to.equal(0);
    expect(getMotionOptions(root, "entry", "very-slow", 4).delay).to.equal(0);
  } finally {
    await emulateMedia({ reducedMotion: "no-preference" });
  }
});

it("settles safely on resize or destruction without leaving animation styles", async () => {
  const controller = await readyForMotion();
  const closing = controller.setInspectorOpen(false);
  root.style.width = "500px";
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  await closing;
  expect(pane("inspector").hidden).to.equal(true);
  const opening = controller.setInspectorOpen(true);
  controller.destroy();
  await opening;
  expect(pane("inspector").hidden).to.equal(false);
  expect(pane("inspector").style.blockSize).to.equal("");
  expect(root.getAnimations().length).to.equal(0);
});
