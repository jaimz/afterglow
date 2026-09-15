import { expect } from "@esm-bundle/chai";
import { emulateMedia } from "@web/test-runner-commands";
import { enhanceCircularProgress, enhanceStagedProgress } from "../src/main.ts";

let host;
let root;
let controller;
const style = (element, pseudo) => getComputedStyle(element, pseudo);
const flush = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const stageMarkup = (
  title = "Stage",
  value = 0
) => `<li class="ag-staged-progress__stage">
  <label class="ag-circular-progress">
    <progress class="ag-circular-progress__native" value="${value}" max="100"></progress>
    <span class="ag-circular-progress__title">${title}</span>
  </label>
</li>`;
const addStage = (title, value) => {
  const template = document.createElement("template");
  template.innerHTML = stageMarkup(title, value);
  const item = document.adoptNode(template.content.firstElementChild);
  root.append(item);
  return item;
};
const fixture = (count = 3) => {
  root.innerHTML = Array.from({ length: count }, (_, index) =>
    stageMarkup(`Stage ${index + 1}`)
  ).join("");
  controller = enhanceStagedProgress(root);
  return Array.from(root.children);
};

before(async () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/afterglow-indicate.css";
  const loaded = new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = reject;
  });
  document.head.append(link);
  await loaded;
});
beforeEach(() => {
  host = document.createElement("div");
  host.style.width = "600px";
  root = document.createElement("ol");
  root.className = "ag-staged-progress";
  root.setAttribute("role", "list");
  root.setAttribute("aria-label", "Publish photos");
  host.append(root);
  document.body.append(host);
});
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  host.remove();
});

it("composes labelled native progress elements without an aggregate control", () => {
  fixture();
  expect(root.tagName).to.equal("OL");
  expect(root.querySelectorAll("progress").length).to.equal(3);
  expect(root.querySelectorAll('[role="progressbar"]').length).to.equal(0);
  expect(root.querySelectorAll(".ag-circular-progress__ring").length).to.equal(
    3
  );
  expect(
    controller.stages.map((stage) => stage.progress.getAttribute("aria-label"))
  ).to.deep.equal(["Stage 1", "Stage 2", "Stage 3"]);
  expect(
    controller.stages.every((stage) => stage.progress.labels.length === 1)
  ).to.equal(true);
  expect(root.getAttribute("aria-label")).to.equal("Publish photos");
  expect(enhanceStagedProgress(root)).to.equal(controller);
});

it("keeps stage failures independent and changes connections only on completion", () => {
  const items = fixture(4);
  const [first, second, third, fourth] = controller.stages;
  first.value = 100;
  second.update({ value: 35, error: true });
  third.update({ value: 20, error: true });
  fourth.value = null;
  expect(controller.stages.map((stage) => stage.state)).to.deep.equal([
    "complete",
    "error",
    "error",
    "in-progress",
  ]);
  expect(style(items[0], "::after").opacity).to.equal("1");
  expect(style(items[1], "::after").opacity).to.equal("0.5");
  second.error = false;
  expect(second.value).to.equal(35);
  expect(second.state).to.equal("in-progress");
  expect(third.error).to.equal(true);
  expect(fourth.value).to.equal(null);
});

it("positions horizontal connections between rings and leaves no trailing line", () => {
  const items = fixture();
  const rings = [...root.querySelectorAll(".ag-circular-progress__ring")].map(
    (ring) => ring.getBoundingClientRect()
  );
  expect(rings[1].x - rings[0].x).to.equal(112);
  expect(rings[0].y).to.equal(rings[1].y);
  const connector = style(items[0], "::after");
  expect(parseFloat(connector.width)).to.equal(72);
  expect(parseFloat(connector.height)).to.equal(1);
  expect(parseFloat(connector.top)).to.equal(11.5);
  expect(style(items[2], "::after").content).to.equal("none");
  items[2].hidden = true;
  expect(style(items[1], "::after").content).to.equal("none");
});

it("supports vertical layouts, long titles, RTL and scaled rings", () => {
  host.style.width = "150px";
  root.dataset.orientation = "vertical";
  root.dir = "rtl";
  const items = fixture();
  controller.stages[0].title = "Averylongfilenamethatneedstowrap.zip";
  const rings = [...root.querySelectorAll(".ag-circular-progress__ring")].map(
    (ring) => ring.getBoundingClientRect()
  );
  expect(rings[0].width).to.equal(24);
  expect(rings[1].x).to.equal(rings[0].x);
  expect(rings[1].y).to.be.greaterThan(rings[0].bottom);
  expect(root.scrollWidth).to.be.at.most(root.clientWidth + 1);
  expect(parseFloat(style(items[0], "::after").width)).to.equal(1);
  const title = root
    .querySelector(".ag-circular-progress__title")
    .getBoundingClientRect();
  expect(title.right).to.be.at.most(rings[0].left);

  root.style.setProperty("--circular-progress-size", "48px");
  expect(
    root.querySelector(".ag-circular-progress__ring").getBoundingClientRect()
      .width
  ).to.equal(48);
  expect(parseFloat(style(items[0], "::after").right)).to.equal(23.5);
});

it("supports empty and single-stage sequences and dynamically reconciles list order", async () => {
  fixture(0);
  expect(controller.stages).to.have.length(0);
  const firstItem = addStage("First", 25);
  await flush();
  const first = controller.stages[0];
  expect(first.title).to.equal("First");
  expect(style(firstItem, "::after").content).to.equal("none");
  const secondItem = addStage("Second", 100);
  controller.refresh();
  const second = controller.stages[1];
  root.prepend(secondItem);
  await flush();
  expect(controller.stages).to.deep.equal([second, first]);
  expect(first.value).to.equal(25);
  firstItem.remove();
  await flush();
  expect(firstItem.querySelector(".ag-circular-progress__ring")).to.equal(null);
  expect(controller.stages).to.deep.equal([second]);
  expect(second.state).to.equal("complete");
});

it("observes native stage edits and does not enhance nested unrelated sequences", async () => {
  fixture();
  const progress = root.querySelector("progress");
  progress.value = 100;
  await flush();
  expect(controller.stages[0].state).to.equal("complete");
  const nested = document.createElement("ol");
  nested.innerHTML = stageMarkup("Nested", 20);
  root.firstElementChild.append(nested);
  await flush();
  expect(controller.stages).to.have.length(3);
  expect(nested.querySelector(".ag-circular-progress__ring")).to.equal(null);
});

it("keeps large horizontal sequences reachable and restores focus after resizing", async () => {
  host.style.width = "200px";
  fixture(40);
  await flush();
  expect(controller.stages).to.have.length(40);
  expect(root.scrollWidth).to.be.greaterThan(root.clientWidth);
  expect(root.getAttribute("tabindex")).to.equal("0");
  root.scrollLeft = root.scrollWidth;
  expect(root.scrollLeft).to.be.greaterThan(0);
  root.dataset.orientation = "vertical";
  await flush();
  expect(root.hasAttribute("tabindex")).to.equal(false);
  expect(root.scrollWidth).to.be.at.most(root.clientWidth + 1);
});

it("restores native fallback and leaves previously enhanced stages with their owner", () => {
  root.innerHTML =
    stageMarkup("Owned elsewhere", 30) + stageMarkup("Owned here", 40);
  root.setAttribute("tabindex", "-1");
  const borrowedRoot = root.querySelector(".ag-circular-progress");
  const borrowed = enhanceCircularProgress(borrowedRoot);
  controller = enhanceStagedProgress(root);
  const ownedRoot = root.lastElementChild.querySelector(
    ".ag-circular-progress"
  );
  controller.stages[1].title = "Updated";
  controller.destroy();
  expect(borrowedRoot.hasAttribute("data-enhanced")).to.equal(true);
  expect(ownedRoot.hasAttribute("data-enhanced")).to.equal(false);
  expect(ownedRoot.querySelector(".ag-circular-progress__ring")).to.equal(null);
  expect(ownedRoot.querySelector("progress").value).to.equal(40);
  expect(root.getAttribute("tabindex")).to.equal("-1");
  controller = enhanceStagedProgress(root);
  expect(controller.stages[1].title).to.equal("Updated");
  controller.destroy();
  borrowed.destroy();
});

it("composes backdrop colours and keeps the entire sequence hidden when requested", () => {
  const items = fixture();
  root.dataset.variant = "backdrop";
  for (const circle of root.querySelectorAll(".ag-circular-progress"))
    circle.dataset.variant = "backdrop";
  controller.stages[1].error = true;
  expect(style(items[0], "::after").backgroundColor).to.equal(
    "rgb(232, 201, 200)"
  );
  expect(style(root.querySelector(".ag-circular-progress")).color).to.equal(
    "rgb(232, 201, 200)"
  );
  expect(
    style(items[1].querySelector(".ag-circular-progress__ring")).backgroundColor
  ).to.equal("rgb(207, 53, 88)");
  root.hidden = true;
  expect(root.getBoundingClientRect().width).to.equal(0);
});

it("uses visible system colours for connectors in forced-colour mode", async () => {
  const items = fixture();
  controller.stages[0].value = 100;
  await emulateMedia({ forcedColors: "active" });
  try {
    expect(style(items[0], "::after").opacity).to.equal("1");
    expect(style(items[1], "::after").opacity).to.equal("1");
    expect(style(items[0], "::after").backgroundColor).not.to.equal(
      "rgba(0, 0, 0, 0)"
    );
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});
