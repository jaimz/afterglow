import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse, setViewport } from "@web/test-runner-commands";
import { enhancePopupMenu } from "../src/main.ts";

let host, cleanups;
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));
const bounds = (el) => el.getBoundingClientRect();
const focused = (el) =>
  expect(
    document.activeElement === el,
    `focus: ${document.activeElement?.textContent}`
  ).to.equal(true);
const click = async (el) => {
  const r = bounds(el);
  await sendMouse({
    type: "click",
    position: [
      Math.round(r.left + r.width / 2),
      Math.round(r.top + r.height / 2),
    ],
  });
  await settle();
};
const enhance = (menu, options) => {
  const c = enhancePopupMenu(menu, options);
  cleanups.push(() => c.destroy());
  return c;
};
function fixture(options = {}) {
  host.innerHTML = `<button id="invoker" class="ag-button" popovertarget="actions">Actions</button>
    <div id="actions" class="ag-popup-menu" popover="auto">
      <button class="ag-menu-item"><span class="ag-menu-item__label">Open</span></button>
      <button class="ag-menu-item" disabled>Unavailable</button>
      <button class="ag-menu-item" aria-disabled="true">Restricted</button>
      <hr class="ag-popup-menu__separator" role="separator">
      <button class="ag-menu-item">Rename</button>
      <a class="ag-menu-item" href="#archive">Archive</a>
    </div><button id="next">Next</button>`;
  const trigger = host.querySelector("button");
  const menu = host.querySelector(".ag-popup-menu");
  const controller = enhance(menu, { trigger, ...options });
  const items = [...menu.querySelectorAll(".ag-menu-item")];
  return { trigger, menu, controller, items };
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
  host.style.cssText = "padding:32px";
  document.body.append(host);
  cleanups = [];
});
afterEach(() => {
  cleanups.reverse().forEach((fn) => fn());
  host.remove();
});

it("uses native invokers, light dismissal and Escape with focus return", async () => {
  const { trigger, menu, controller, items } = fixture();
  expect(getComputedStyle(menu).display).to.equal("none");
  await click(trigger);
  expect(controller.isOpen).to.equal(true);
  expect(trigger.getAttribute("aria-expanded")).to.equal("true");
  expect(menu.getAttribute("role")).to.equal("menu");
  focused(items[0]);
  await sendKeys({ press: "Escape" });
  await settle();
  expect(controller.isOpen).to.equal(false);
  focused(trigger);
  await click(trigger);
  await click(host.querySelector("#next"));
  expect(controller.isOpen).to.equal(false);
  focused(host.querySelector("#next"));
});

it("supports arrow navigation, typeahead, native activation and focusable aria-disabled items", async () => {
  const { trigger, controller, items, menu } = fixture();
  trigger.focus();
  await sendKeys({ press: "ArrowDown" });
  focused(items[0]);
  await sendKeys({ press: "ArrowDown" });
  focused(items[2]);
  let disabledClicks = 0;
  items[2].addEventListener("click", () => disabledClicks++);
  let selections = 0;
  menu.addEventListener("ag-menu-select", () => selections++);
  await sendKeys({ press: "Enter" });
  expect(selections).to.equal(0);
  expect(disabledClicks).to.equal(0);
  expect(controller.isOpen).to.equal(true);
  await sendKeys({ press: "End" });
  focused(items[4]);
  await sendKeys({ press: "ArrowDown" });
  focused(items[0]);
  await sendKeys({ press: "r" });
  focused(items[2]);
  await sendKeys({ press: "r" });
  focused(items[3]);
  await sendKeys({ press: "Home" });
  focused(items[0]);
  await sendKeys({ press: "Enter" });
  await settle();
  expect(selections).to.equal(1);
  expect(controller.isOpen).to.equal(false);
  focused(trigger);
  trigger.focus();
  await sendKeys({ press: "ArrowUp" });
  focused(items[4]);
});

it("Tab closes the whole menu and continues outside; Shift+Tab returns before the invoker", async () => {
  const before = document.createElement("button");
  before.textContent = "Before";
  host.before(before);
  cleanups.push(() => before.remove());
  const { trigger, controller } = fixture();
  await click(trigger);
  await sendKeys({ press: "Tab" });
  await settle();
  expect(controller.isOpen).to.equal(false);
  focused(host.querySelector("#next"));
  await click(trigger);
  await sendKeys({ press: "Shift+Tab" });
  await settle();
  focused(before);
  expect(controller.isOpen).to.equal(false);
});

it("can keep a selection open, preserves authored check states, and never submits a form", async () => {
  const { trigger, menu, controller, items } = fixture({
    closeOnSelect: false,
  });
  const form = document.createElement("form");
  host.append(form);
  form.append(trigger, menu);
  let submits = 0;
  form.onsubmit = (event) => {
    event.preventDefault();
    submits++;
  };
  items[0].setAttribute("role", "menuitemcheckbox");
  items[0].setAttribute("aria-checked", "false");
  controller.refresh();
  menu.addEventListener("ag-menu-select", (event) =>
    event.detail.item.setAttribute("aria-checked", "true")
  );
  await click(trigger);
  await sendKeys({ press: "Space" });
  await settle();
  expect(items[0].getAttribute("aria-checked")).to.equal("true");
  expect(controller.isOpen).to.equal(true);
  expect(submits).to.equal(0);
});

it("honours cancelable selection and does not steal focus from application actions", async () => {
  const { trigger, menu, controller, items } = fixture();
  const cancel = (event) => event.preventDefault();
  menu.addEventListener("ag-menu-select", cancel);
  await click(trigger);
  items[0].click();
  expect(controller.isOpen).to.equal(true);
  menu.removeEventListener("ag-menu-select", cancel);
  menu.addEventListener("ag-menu-select", () =>
    host.querySelector("#next").focus()
  );
  items[0].click();
  expect(controller.isOpen).to.equal(false);
  focused(host.querySelector("#next"));
});

it("opens nested menus with keyboard and pointer, isolates navigation and closes the chain on action", async () => {
  const { trigger, menu, controller, items } = fixture();
  items[0].setAttribute("popovertarget", "child");
  const sub = document.createElement("div");
  sub.id = "child";
  sub.className = "ag-popup-menu";
  sub.innerHTML =
    '<button class="ag-menu-item">Copy link</button><button class="ag-menu-item">Email link</button>';
  items[0].after(sub);
  const nested = enhance(sub, {
    trigger: items[0],
    placement: "inline-end",
    openOnHover: true,
  });
  await click(trigger);
  await sendKeys({ press: "ArrowRight" });
  await settle();
  expect(nested.isOpen).to.equal(true);
  expect(controller.isOpen).to.equal(true);
  focused(sub.firstElementChild);
  await sendKeys({ press: "ArrowLeft" });
  expect(nested.isOpen).to.equal(false);
  focused(items[0]);
  menu.dir = "rtl";
  await sendKeys({ press: "ArrowLeft" });
  expect(nested.isOpen).to.equal(true);
  await sendKeys({ press: "Escape" });
  await settle();
  expect(nested.isOpen).to.equal(false);
  expect(controller.isOpen).to.equal(true);
  const r = bounds(items[0]);
  await sendMouse({
    type: "move",
    position: [Math.round(r.left + 10), Math.round(r.top + 10)],
  });
  await settle();
  expect(nested.isOpen).to.equal(true);
  await click(sub.firstElementChild);
  expect(nested.isOpen).to.equal(false);
  expect(controller.isOpen).to.equal(false);
  focused(trigger);
});

it("positions in the top layer outside clipped ancestors, flips at edges, and scrolls long content", async () => {
  const { trigger, menu, controller } = fixture();
  host.style.cssText =
    "position:fixed;right:12px;bottom:12px;height:48px;width:160px;overflow:hidden";
  trigger.style.width = "100%";
  menu.innerHTML = Array.from(
    { length: 30 },
    (_, i) => `<button class="ag-menu-item">Item ${i}</button>`
  ).join("");
  controller.show();
  await settle();
  const r = bounds(menu);
  expect(r.left).to.be.at.least(0);
  expect(r.right).to.be.at.most(800);
  expect(r.top).to.be.at.least(0);
  expect(r.bottom).to.be.at.most(bounds(trigger).top);
  expect(menu.scrollHeight).to.be.greaterThan(menu.clientHeight);
  await sendKeys({ press: "End" });
  expect(menu.scrollTop).to.be.greaterThan(0);
});

it("falls back to measured positioning without CSS anchors and updates after resize", async () => {
  const supports = CSS.supports;
  CSS.supports = () => false;
  let f;
  try {
    f = fixture();
  } finally {
    CSS.supports = supports;
  }
  const { trigger, menu, controller } = f;
  host.style.cssText = "position:fixed;right:12px;bottom:12px";
  controller.show();
  await settle();
  expect(menu.hasAttribute("data-position-fallback")).to.equal(true);
  expect(bounds(menu).right).to.be.at.most(792);
  expect(bounds(menu).bottom).to.be.at.most(bounds(trigger).top);
  await setViewport({ width: 480, height: 400 });
  await settle();
  expect(bounds(menu).right).to.be.at.most(472);
  expect(bounds(menu).top).to.be.at.least(8);
});

it("refreshes dynamic items and restores authored attributes and styles on destroy", async () => {
  const { trigger, menu, controller, items } = fixture();
  const added = document.createElement("button");
  added.className = "ag-menu-item";
  added.textContent = "Added";
  menu.append(added);
  controller.refresh();
  expect(added.getAttribute("role")).to.equal("menuitem");
  expect(enhancePopupMenu(menu, { trigger }) === controller).to.equal(true);
  controller.show();
  await settle();
  controller.destroy();
  expect(menu.getAttribute("role")).to.equal(null);
  expect(trigger.getAttribute("aria-expanded")).to.equal(null);
  expect(items[0].hasAttribute("tabindex")).to.equal(false);
  expect(added.hasAttribute("role")).to.equal(false);
  expect(trigger.style.getPropertyValue("anchor-name")).to.equal("");
  expect(menu.style.getPropertyValue("position-anchor")).to.equal("");
  expect(menu.matches(":popover-open")).to.equal(false);
  enhance(menu, { trigger }).show();
  expect(menu.matches(":popover-open")).to.equal(true);
});

it("keeps a wide menu inside a narrow viewport with a central invoker", async () => {
  await setViewport({ width: 320, height: 600 });
  const { trigger, menu, controller } = fixture();
  host.style.cssText = "position:fixed;left:140px;top:20px";
  trigger.style.width = "40px";
  controller.show();
  await settle();
  expect(bounds(menu).left).to.be.at.least(0);
  expect(bounds(menu).right).to.be.at.most(320);
});
