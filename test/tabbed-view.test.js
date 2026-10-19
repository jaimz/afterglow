import { expect } from "@esm-bundle/chai";
import { sendKeys, setViewport } from "@web/test-runner-commands";
import { enhanceTabbedView } from "../src/main.ts";

let host;
let controllers;
const style = (el) => getComputedStyle(el);
const bounds = (el) => el.getBoundingClientRect();
const markup = (
  prefix = "view",
  count = 3
) => `<section class="ag-tabbed-view" style="width:669px;max-width:100%">
  <div class="ag-tab-strip" aria-label="Document sections">
    ${Array.from(
      { length: count },
      (_, i) =>
        `<button class="ag-tab" aria-controls="${prefix}-${i}">Tab ${
          i + 1
        }</button>`
    ).join("")}
  </div>
  ${Array.from(
    { length: count },
    (_, i) =>
      `<section class="ag-tabbed-view__panel" id="${prefix}-${i}"><input aria-label="Content ${
        i + 1
      }" value="Initial"></section>`
  ).join("")}
</section>`;
const enhance = (root, options) => {
  const c = enhanceTabbedView(root, options);
  controllers.push(c);
  return c;
};
const fixture = (options) => {
  host.innerHTML = markup();
  const root = host.firstElementChild;
  const tabs = [...root.querySelectorAll(".ag-tab")];
  const panels = [...root.querySelectorAll(".ag-tabbed-view__panel")];
  const controller = enhance(root, options);
  return { root, tabs, panels, controller };
};
before(async () => {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/afterglow.css";
  const loaded = new Promise((resolve, reject) => {
    css.onload = resolve;
    css.onerror = reject;
  });
  document.head.append(css);
  await loaded;
});
beforeEach(async () => {
  await setViewport({ width: 1000, height: 800 });
  host = document.createElement("div");
  document.body.append(host);
  controllers = [];
});
afterEach(() => {
  controllers.forEach((c) => c.destroy());
  host.remove();
});

it("links buttons and panels, preserves input state, and never submits a surrounding form", () => {
  host.innerHTML = `<form>${markup()}</form>`;
  const root = host.querySelector(".ag-tabbed-view");
  const controller = enhance(root);
  const tabs = [...root.querySelectorAll(".ag-tab")];
  const panels = [...root.querySelectorAll(".ag-tabbed-view__panel")];
  expect(root.firstElementChild.getAttribute("role")).to.equal("tablist");
  expect(controller.selectedPanelId).to.equal("view-0");
  expect(tabs.map((t) => t.tabIndex)).to.deep.equal([0, -1, -1]);
  expect(panels.map((p) => p.hidden)).to.deep.equal([false, true, true]);
  expect(panels[0].getAttribute("aria-labelledby")).to.equal(tabs[0].id);
  expect(panels[0].getAttribute("role")).to.equal("tabpanel");
  let submits = 0;
  host.firstElementChild.addEventListener("submit", (event) => {
    event.preventDefault();
    submits++;
  });
  const input = panels[0].querySelector("input");
  input.value = "Keep this edit";
  tabs[1].click();
  tabs[0].click();
  expect(submits).to.equal(0);
  expect(panels[0].querySelector("input") === input).to.equal(true);
  expect(input.value).to.equal("Keep this edit");
});

it("selects by stable ID, emits changes only when selection changes, and restores focus from a hidden panel", () => {
  const { root, tabs, panels, controller } = fixture({
    selectedPanelId: "view-1",
  });
  const changes = [];
  root.addEventListener("ag-tab-change", (event) => changes.push(event.detail));
  panels[1].querySelector("input").focus();
  expect(controller.select("view-2")).to.equal(true);
  expect(
    document.activeElement === tabs[2],
    "Focused tab should be index 2"
  ).to.equal(true);
  controller.select("view-2");
  controller.refresh();
  expect(changes).to.deep.equal([
    { panelId: "view-2", previousPanelId: "view-1" },
  ]);
  tabs[0].disabled = true;
  expect(controller.select("view-0")).to.equal(false);
  expect(controller.select("missing")).to.equal(false);
  expect(controller.selectedPanelId).to.equal("view-2");
});

it("uses arrow keys, Home and End with wrapping, disabled tabs and RTL", async () => {
  const { root, tabs, controller } = fixture();
  tabs[1].disabled = true;
  tabs[0].focus();
  await sendKeys({ press: "ArrowRight" });
  expect(controller.selectedPanelId).to.equal("view-2");
  await sendKeys({ press: "ArrowRight" });
  expect(controller.selectedPanelId).to.equal("view-0");
  await sendKeys({ press: "End" });
  expect(
    document.activeElement === tabs[2],
    "Focused tab should be index 2"
  ).to.equal(true);
  await sendKeys({ press: "Home" });
  expect(
    document.activeElement === tabs[0],
    "Focused tab should be index 0"
  ).to.equal(true);
  root.dir = "rtl";
  await sendKeys({ press: "ArrowLeft" });
  expect(controller.selectedPanelId).to.equal("view-2");
  tabs[2].hidden = true;
  controller.refresh();
  expect(controller.selectedPanelId).to.equal("view-0");
  // Hiding the focused button makes the browser blur it before refresh.
  controller.select("view-0", { focus: true });
  expect(
    document.activeElement === tabs[0],
    "Focused tab should be index 0"
  ).to.equal(true);
});

it("supports manual activation and native Enter/Space without changing panels on arrow focus", async () => {
  const { tabs, controller } = fixture({ activation: "manual" });
  tabs[0].focus();
  await sendKeys({ press: "ArrowRight" });
  expect(
    document.activeElement === tabs[1],
    "Focused tab should be index 1"
  ).to.equal(true);
  expect(controller.selectedPanelId).to.equal("view-0");
  expect(tabs.map((t) => t.tabIndex)).to.deep.equal([-1, 0, -1]);
  await sendKeys({ press: "Enter" });
  expect(controller.selectedPanelId).to.equal("view-1");
  await sendKeys({ press: "End" });
  await sendKeys({ press: "Space" });
  expect(controller.selectedPanelId).to.equal("view-2");
  await sendKeys({ press: "Tab" });
  expect(document.activeElement.id).to.equal("view-2");
});

it("reconciles added/removed and disabled tabs without rebuilding surviving panels", () => {
  const { root, tabs, panels, controller } = fixture();
  tabs[0].remove();
  panels[0].remove();
  controller.refresh();
  expect(controller.selectedPanelId).to.equal("view-1");
  expect(tabs[0].hasAttribute("role")).to.equal(false);
  expect(panels[0].hasAttribute("hidden")).to.equal(false);
  const tab = document.createElement("button");
  tab.className = "ag-tab";
  tab.textContent = "New";
  tab.setAttribute("aria-controls", "new-panel");
  const panel = document.createElement("section");
  panel.className = "ag-tabbed-view__panel";
  panel.id = "new-panel";
  root.firstElementChild.append(tab);
  root.append(panel);
  controller.refresh();
  expect(controller.select("new-panel")).to.equal(true);
  root.querySelectorAll(".ag-tab").forEach((t) => (t.disabled = true));
  controller.refresh();
  expect(controller.selectedPanelId).to.equal(null);
  expect(
    [...root.querySelectorAll(".ag-tabbed-view__panel")].every((p) => p.hidden)
  ).to.equal(true);
  tab.disabled = false;
  controller.refresh();
  expect(controller.selectedPanelId).to.equal("new-panel");
});

it("isolates nested tabbed views and restores original attributes on destroy", () => {
  host.innerHTML = markup();
  const root = host.firstElementChild;
  const firstPanel = root.querySelector(".ag-tabbed-view__panel");
  firstPanel.innerHTML = markup("nested", 2);
  const nested = firstPanel.firstElementChild;
  const initial = root.outerHTML;
  const parent = enhance(root);
  const child = enhance(nested);
  expect(enhanceTabbedView(root) === parent).to.equal(true);
  child.select("nested-1");
  parent.select("view-2");
  parent.select("view-0");
  expect(child.selectedPanelId).to.equal("nested-1");
  child.destroy();
  parent.destroy();
  expect(root.outerHTML).to.equal(initial);
  expect(parent.select("view-1")).to.equal(false);
  const fresh = enhance(root);
  expect(fresh === parent).to.equal(false);
});

it("rejects invalid mappings before changing the markup", () => {
  host.innerHTML = markup();
  const root = host.firstElementChild;
  root.querySelector("button").setAttribute("aria-controls", "unknown");
  const initial = root.outerHTML;
  expect(() => enhanceTabbedView(root)).to.throw("Each tab");
  expect(root.outerHTML).to.equal(initial);
});

it("matches tab geometry, scrolls long strips and contains tall panel content", async () => {
  const { root, tabs, panels, controller } = fixture();
  expect(bounds(tabs[0]).width).to.equal(150);
  expect(bounds(tabs[0]).height).to.equal(58);
  expect(style(tabs[0]).borderBottomColor).to.equal("rgb(0, 118, 147)");
  const strip = root.firstElementChild;
  expect(bounds(strip).height).to.equal(59);
  expect(bounds(tabs[0]).left - bounds(strip).left).to.be.closeTo(94.5, 0.1);
  tabs[0].hidden = true;
  controller.refresh();
  expect(bounds(tabs[1]).left - bounds(strip).left).to.be.closeTo(177, 0.1);
  tabs[0].hidden = false;
  controller.refresh();
  controller.select("view-0");
  root.style.width = "280px";
  root.style.height = "250px";
  panels[0].innerHTML = '<div style="height:800px">Long content</div>';
  expect(strip.scrollWidth).to.be.greaterThan(strip.clientWidth);
  expect(root.scrollWidth).to.equal(root.clientWidth);
  expect(panels[0].scrollHeight).to.be.greaterThan(panels[0].clientHeight);
  tabs[0].focus();
  await sendKeys({ press: "End" });
  expect(bounds(tabs[2]).right).to.be.at.most(bounds(strip).right + 1);
});
