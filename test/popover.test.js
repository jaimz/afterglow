import { expect } from "@esm-bundle/chai";
import {
  emulateMedia,
  sendKeys,
  sendMouse,
  setViewport,
} from "@web/test-runner-commands";
import { enhancePopover } from "../src/main.ts";

let host, controllers;
const settle = () => new Promise((resolve) => setTimeout(resolve, 180));
const bounds = (el) => el.getBoundingClientRect();
const focused = (el) => expect(document.activeElement === el).to.equal(true);
async function click(el) {
  const r = bounds(el);
  await sendMouse({
    type: "click",
    position: [
      Math.round(r.left + r.width / 2),
      Math.round(r.top + r.height / 2),
    ],
  });
  await settle();
}
function fixture(options = {}) {
  const root = document.createElement("div");
  root.innerHTML = `<button class="ag-button" data-trigger>Details</button>
    <div class="ag-popover" popover="auto" style="--custom:retained">
      <header class="ag-popover__header"><h2 class="ag-popover__title">Notebook details</h2></header>
      <div class="ag-popover__body"><label>Name <input value="Field notes" autofocus></label></div>
      <footer class="ag-popover__footer"><button type="button" data-popover-close>Done</button></footer>
    </div><button data-next>Next</button>`;
  host.append(root);
  const trigger = root.querySelector("[data-trigger]");
  const panel = root.querySelector(".ag-popover");
  const input = root.querySelector("input");
  const done = root.querySelector("[data-popover-close]");
  const next = root.querySelector("[data-next]");
  // Explicit tab stops make keyboard/click focus independent of Safari's OS preference.
  root.querySelectorAll("button").forEach((button) => {
    button.tabIndex = 0;
  });
  const controller = enhancePopover(panel, { trigger, ...options });
  controllers.push(controller);
  return { root, trigger, panel, input, done, next, controller };
}
before(async () => {
  const sheet = document.createElement("link");
  sheet.rel = "stylesheet";
  sheet.href = "/afterglow.css";
  const ready = new Promise((resolve, reject) => {
    sheet.onload = resolve;
    sheet.onerror = reject;
  });
  document.head.append(sheet);
  await ready;
});
beforeEach(async () => {
  await setViewport({ width: 800, height: 600 });
  host = document.createElement("div");
  host.style.cssText =
    "padding:64px;--motion-medium-duration:100ms;--motion-fast-duration:50ms";
  document.body.append(host);
  controllers = [];
});
afterEach(() => {
  controllers.reverse().forEach((c) => c.destroy());
  host.remove();
});

it("opens a named nonmodal dialog with native keyboard activation and Escape focus return", async () => {
  const { trigger, panel, input, controller } = fixture();
  expect(getComputedStyle(panel).display).to.equal("none");
  trigger.focus();
  await sendKeys({ press: "Enter" });
  await settle();
  expect(controller.isOpen).to.equal(true);
  expect(trigger.getAttribute("aria-expanded")).to.equal("true");
  expect(trigger.getAttribute("aria-haspopup")).to.equal("dialog");
  expect(panel.getAttribute("role")).to.equal("dialog");
  expect(
    document.getElementById(panel.getAttribute("aria-labelledby")).textContent
  ).to.equal("Notebook details");
  expect(panel.getAttribute("aria-modal")).to.equal(null);
  focused(input);
  await sendKeys({ press: "Escape" });
  await settle();
  expect(controller.isOpen).to.equal(false);
  expect(trigger.getAttribute("aria-expanded")).to.equal("false");
  focused(trigger);
});

it("light dismisses without discarding edits or stealing focus from the outside target", async () => {
  const { trigger, panel, input, next, controller } = fixture();
  await click(trigger);
  input.value = "Keep my edits";
  await click(next);
  expect(controller.isOpen).to.equal(false);
  focused(next);
  await click(trigger);
  expect(input.value).to.equal("Keep my edits");
  expect(panel.contains(document.activeElement)).to.equal(true);
});

it("supports normal Tab navigation and closes when focus leaves, without a focus trap", async () => {
  const { trigger, done, next, controller } = fixture();
  await click(trigger);
  await sendKeys({ press: "Tab" });
  focused(done);
  expect(controller.isOpen).to.equal(true);
  await sendKeys({ press: "Tab" });
  await settle();
  focused(next);
  expect(controller.isOpen).to.equal(false);
  await click(trigger);
  await click(done);
  focused(trigger);
  expect(controller.isOpen).to.equal(false);
});

it("focuses informational content and prevents trigger form submission", async () => {
  const form = document.createElement("form");
  host.append(form);
  const { root, trigger, panel, controller } = fixture();
  form.append(root);
  panel.querySelector("input").remove();
  let submits = 0;
  form.onsubmit = (event) => {
    event.preventDefault();
    submits++;
  };
  await click(trigger);
  focused(panel);
  expect(submits).to.equal(0);
  controller.hide();
  trigger.disabled = true;
  controller.show();
  expect(controller.isOpen).to.equal(false);
});

it("preserves authored names and can open without moving focus, including native autofocus", async () => {
  const { trigger, panel, input, controller } = fixture();
  controller.destroy();
  panel.setAttribute("aria-label", "Information");
  const next = enhancePopover(panel, { trigger });
  controllers.push(next);
  expect(panel.hasAttribute("aria-labelledby")).to.equal(false);
  trigger.focus();
  next.show({ focus: false });
  await settle();
  focused(trigger);
  expect(next.isOpen).to.equal(true);
  expect(input.hasAttribute("autofocus")).to.equal(true);
  next.destroy();
  expect(panel.getAttribute("aria-label")).to.equal("Information");
});

it("switches between sibling popovers with one click and handles rapid reopen", async () => {
  const first = fixture();
  const second = fixture();
  second.root.style.cssText = "position:fixed;right:64px;top:64px";
  await click(first.trigger);
  await click(second.trigger);
  expect(first.controller.isOpen).to.equal(false);
  expect(first.trigger.getAttribute("aria-expanded")).to.equal("false");
  expect(second.controller.isOpen).to.equal(true);
  second.controller.hide();
  second.controller.show();
  await settle();
  expect(second.controller.isOpen).to.equal(true);
  focused(second.input);
  expect(getComputedStyle(second.panel).opacity).to.equal("1");
});

it("flips at viewport edges, escapes clipped ancestors, and points back to the trigger", async () => {
  const { trigger, panel, controller } = fixture();
  host.style.cssText =
    "position:fixed;bottom:12px;right:12px;overflow:hidden;width:100px;height:30px";
  controller.show();
  await settle();
  const r = bounds(panel);
  const a = bounds(trigger);
  expect(panel.dataset.side).to.equal("top");
  expect(r.bottom).to.be.at.most(a.top - 8);
  expect(r.right).to.be.at.most(788);
  expect(r.left).to.be.at.least(12);
  expect(
    Math.abs(
      r.left +
        parseFloat(panel.style.getPropertyValue("--ag-popover-arrow-x")) -
        (a.left + a.width / 2)
    )
  ).to.be.lessThan(2);
  expect(
    document
      .elementFromPoint(r.left + 20, r.top + 20)
      ?.closest(".ag-popover") === panel
  ).to.equal(true);
});

it("mirrors logical sides and alignment in RTL and follows trigger movement", async () => {
  const { trigger, panel, controller } = fixture({ placement: "inline-start" });
  host.dir = "rtl";
  host.style.cssText = "position:fixed;left:260px;top:230px;width:100px";
  controller.show();
  await settle();
  expect(panel.dataset.side).to.equal("right");
  expect(bounds(panel).left).to.be.greaterThan(bounds(trigger).right);
  const previous = bounds(panel).top;
  host.style.top = "280px";
  controller.refresh();
  await settle();
  expect(bounds(panel).top - previous).to.be.closeTo(50, 1);
  controller.hide();
  controller.destroy();
  const aligned = enhancePopover(panel, { trigger, align: "start" });
  controllers.push(aligned);
  aligned.show();
  await settle();
  expect(bounds(panel).right).to.be.closeTo(bounds(trigger).right, 1);
});

it("fits a narrow viewport, scrolls long bodies, and leaves the footer visible", async () => {
  const { panel, controller, done } = fixture();
  host.style.cssText = "position:fixed;left:140px;top:16px";
  const body = panel.querySelector(".ag-popover__body");
  body.innerHTML = Array.from(
    { length: 30 },
    (_, i) => `<p>Notebook activity ${i}</p>`
  ).join("");
  await setViewport({ width: 320, height: 480 });
  controller.show({ focus: false });
  await settle();
  expect(bounds(panel).left).to.be.at.least(12);
  expect(bounds(panel).right).to.be.at.most(308);
  expect(bounds(panel).bottom).to.be.at.most(468.05);
  expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
  expect(bounds(done).bottom).to.be.at.most(bounds(panel).bottom);
  await setViewport({ width: 280, height: 400 });
  await settle();
  expect(bounds(panel).right).to.be.at.most(268);
  expect(bounds(panel).bottom).to.be.at.most(388.05);
});

it("uses local theme, spacing and motion values", async () => {
  const { panel, controller } = fixture();
  host.style.setProperty("--panel", "rgb(240, 250, 245)");
  host.style.setProperty("--motion-medium-duration", "0.2s");
  controller.show();
  expect(getComputedStyle(panel).backgroundColor).to.equal(
    "rgb(240, 250, 245)"
  );
  expect(
    getComputedStyle(panel.querySelector(".ag-popover__body")).padding
  ).to.equal("16px");
  expect(getComputedStyle(panel).transitionDuration).to.equal(
    matchMedia("(prefers-reduced-motion: reduce)").matches ? "0s" : "0.2s"
  );
});

it("restores managed attributes/styles, preserves consumer state and can be re-enhanced", async () => {
  const { panel, trigger, controller } = fixture();
  expect(enhancePopover(panel, { trigger }) === controller).to.equal(true);
  controller.show();
  await settle();
  controller.destroy();
  expect(panel.matches(":popover-open")).to.equal(false);
  expect(panel.hasAttribute("role")).to.equal(false);
  expect(panel.hasAttribute("id")).to.equal(false);
  expect(panel.hasAttribute("aria-labelledby")).to.equal(false);
  expect(panel.querySelector("h2").hasAttribute("id")).to.equal(false);
  expect(panel.hasAttribute("data-side")).to.equal(false);
  expect(trigger.hasAttribute("aria-expanded")).to.equal(false);
  expect(trigger.hasAttribute("popovertarget")).to.equal(false);
  expect(panel.style.getPropertyValue("--ag-popover-x")).to.equal("");
  expect(panel.style.getPropertyValue("--custom")).to.equal("retained");
  const next = enhancePopover(panel, { trigger });
  controllers.push(next);
  next.show();
  expect(next.isOpen).to.equal(true);
});

it("removes entry and exit motion when reduced motion is requested", async () => {
  await emulateMedia({ reducedMotion: "reduce" });
  try {
    const { panel, controller } = fixture();
    controller.show();
    expect(getComputedStyle(panel).transitionDuration).to.equal("0s");
    expect(panel.getAnimations().length).to.equal(0);
    controller.hide();
    expect(getComputedStyle(panel).transitionDuration).to.equal("0s");
    expect(getComputedStyle(panel).display).to.equal("none");
  } finally {
    await emulateMedia({ reducedMotion: "no-preference" });
  }
});
