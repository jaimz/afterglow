import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse } from "@web/test-runner-commands";
import { enhanceNotification } from "../src/main.ts";
import { notificationMarkup } from "../src/indicate/Notification/fixtures/createNotification.ts";
import { element as storyElement } from "../src/stories/fixtures.ts";

let root;
let controllers;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const create = (options = {}, variant = "default") => {
  const template = document.createElement("template");
  template.innerHTML = notificationMarkup(
    `notice-${root.children.length}`,
    variant
  );
  const element = template.content.firstElementChild;
  root.append(element);
  const controller = enhanceNotification(element, options);
  controllers.push(controller);
  return { element, controller, button: element.querySelector("button") };
};
const onClose = (element) =>
  new Promise((resolve) =>
    element.addEventListener("close", resolve, { once: true })
  );

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
  controllers = [];
  root = document.createElement("section");
  root.className = "ag-body";
  root.style.setProperty("--motionSlowDuration", "0ms");
  document.body.append(root);
  await sendMouse({ type: "move", position: [0, 0] });
});
afterEach(() => {
  controllers.reverse().forEach((controller) => controller.destroy());
  root.remove();
});

it("can initialize a Storybook fixture before it is mounted", async () => {
  const element = storyElement(notificationMarkup("detached-notice"));
  const controller = enhanceNotification(element);
  controllers.push(controller);
  root.append(element);
  await controller.show();
  await settle();
  expect(controller.open).to.equal(true);
  expect(
    document.querySelector(".ag-notification-announcer").textContent
  ).to.equal(element.querySelector(".ag-notification__message").textContent);
});

it("preserves the variant colours and renders the exported icons at their specified sizes", async () => {
  const colours = {
    default: "rgb(100, 120, 140)",
    alert: "rgb(207, 53, 88)",
    success: "rgb(82, 169, 106)",
    caution: "rgb(236, 187, 91)",
  };
  for (const [variant, colour] of Object.entries(colours)) {
    const { element, controller } = create({}, variant);
    await controller.show();
    const styles = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    expect(styles.backgroundColor).to.equal(colour);
    expect(styles.color).to.equal(
      variant === "caution" ? "rgb(83, 83, 74)" : "rgb(243, 238, 230)"
    );
    expect(bounds.height).to.be.closeTo(56, 0.05);
    const icon = element.querySelector(".ag-notification__icon");
    const iconBounds = icon.getBoundingClientRect();
    const width = variant === "success" ? 16 : 20;
    const height = variant === "success" ? 11 : variant === "caution" ? 17 : 20;
    expect(iconBounds.width).to.equal(width);
    expect(iconBounds.height).to.equal(height);
    const glyph = getComputedStyle(icon, "::before");
    expect(parseFloat(glyph.width)).to.equal(width);
    expect(parseFloat(glyph.height)).to.equal(height);
    const mask = glyph.maskImage;
    expect(mask).to.include(`${variant === "default" ? "info" : variant}.svg`);
    expect(
      (
        await fetch(
          `/assets/notification/${variant === "default" ? "info" : variant}.svg`
        )
      ).ok
    ).to.equal(true);
    await controller.hide();
  }
});

it("sizes the text between its minimum and maximum and wraps longer messages", async () => {
  const { element, controller } = create();
  const message = element.querySelector(".ag-notification__message");
  message.textContent = "Saved";
  await controller.show();
  expect(message.getBoundingClientRect().width).to.be.closeTo(160, 1);
  const shortWidth = element.getBoundingClientRect().width;
  message.textContent = "Your changes have been saved successfully.";
  expect(message.getBoundingClientRect().width).to.be.greaterThan(160);
  expect(element.getBoundingClientRect().width).to.be.greaterThan(shortWidth);
  message.textContent =
    "All your changes have been saved successfully. You can continue working while we sync them with the server.";
  expect(message.getBoundingClientRect().width).to.be.closeTo(320, 1);
  expect(message.getBoundingClientRect().height).to.be.greaterThan(20);
});

it("positions a notification at all six viewport locations without stealing focus", async () => {
  const trigger = document.createElement("button");
  trigger.textContent = "Continue working";
  root.append(trigger);
  trigger.focus();
  const { element, controller } = create();
  for (const position of [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]) {
    await controller.show({ position });
    const rect = element.getBoundingClientRect();
    expect(document.activeElement === trigger).to.equal(true);
    if (position.startsWith("top")) expect(rect.top).to.be.closeTo(16, 1);
    else expect(innerHeight - rect.bottom).to.be.closeTo(16, 1);
    if (position.endsWith("left")) expect(rect.left).to.be.closeTo(16, 1);
    else if (position.endsWith("right"))
      expect(innerWidth - rect.right).to.be.closeTo(16, 1);
    else expect(rect.left + rect.width / 2).to.be.closeTo(innerWidth / 2, 1);
  }
});

it("supports all six locations inside a view and follows its resize", async () => {
  const view = document.createElement("section");
  view.style.cssText =
    "position:fixed;left:40px;top:50px;width:500px;height:350px";
  root.append(view);
  const { element, controller } = create({ container: view });
  for (const position of [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]) {
    await controller.show({ position });
    const rect = element.getBoundingClientRect();
    const bounds = view.getBoundingClientRect();
    if (position.startsWith("top"))
      expect(rect.top - bounds.top).to.be.closeTo(16, 1);
    else expect(bounds.bottom - rect.bottom).to.be.closeTo(16, 1);
    if (position.endsWith("left"))
      expect(rect.left - bounds.left).to.be.closeTo(16, 1);
    else if (position.endsWith("right"))
      expect(bounds.right - rect.right).to.be.closeTo(16, 1);
    else
      expect(rect.left + rect.width / 2).to.be.closeTo(
        bounds.left + bounds.width / 2,
        1
      );
  }
  view.style.width = "360px";
  view.style.height = "250px";
  await settle();
  expect(element.getBoundingClientRect().right).to.be.closeTo(
    view.getBoundingClientRect().right - 16,
    1
  );
  expect(element.getBoundingClientRect().bottom).to.be.closeTo(
    view.getBoundingClientRect().bottom - 16,
    1
  );
});

it("wraps long content in a narrow view while keeping the close button reachable", async () => {
  const view = document.createElement("section");
  view.style.cssText =
    "position:fixed;left:20px;top:20px;width:240px;height:300px";
  root.append(view);
  const { element, button, controller } = create({ container: view });
  element.querySelector(".ag-notification__message").textContent =
    "Averylongunbrokennotificationmessagethatmustwrapwithintheview";
  await controller.show();
  expect(element.getBoundingClientRect().width).to.be.closeTo(208, 1);
  expect(element.scrollWidth).to.be.at.most(element.clientWidth);
  button.focus();
  const closed = onClose(element);
  await sendKeys({ press: "Enter" });
  expect((await closed).detail.reason).to.equal("close-button");
});

it("keeps manual notifications open through outside clicks and Escape", async () => {
  const { element, controller, button } = create();
  let closes = 0;
  root.addEventListener("close", () => closes++);
  await controller.show();
  await sendMouse({ type: "click", position: [5, 5] });
  await sendKeys({ press: "Escape" });
  await delay(60);
  expect(controller.open).to.equal(true);
  const closed = onClose(element);
  button.click();
  expect((await closed).detail.reason).to.equal("close-button");
  await settle();
  expect(controller.open).to.equal(false);
  expect(closes).to.equal(1);
});

it("starts the timeout after entry and closes with the timeout reason", async () => {
  const { element, controller } = create({ timeout: 40 });
  element.style.setProperty("--motionSlowDuration", "60ms");
  const closed = onClose(element);
  const opening = controller.show();
  await delay(25);
  expect(controller.open).to.equal(true);
  await opening;
  expect(controller.open).to.equal(true);
  expect((await closed).detail.reason).to.equal("timeout");
  expect(controller.open).to.equal(false);
});

it("pauses a timed notification while focused and resumes when focus leaves", async () => {
  const { element, controller, button } = create({ timeout: 100 });
  const outside = document.createElement("button");
  root.append(outside);
  const closed = onClose(element);
  const opening = controller.show();
  button.focus();
  await opening;
  await delay(160);
  expect(controller.open).to.equal(true);
  outside.focus();
  expect((await closed).detail.reason).to.equal("timeout");
  expect(document.activeElement === outside).to.equal(true);
});

it("pauses on hover and resumes the remaining timeout on pointer leave", async () => {
  const { element, controller } = create({ timeout: 250 });
  await controller.show();
  const rect = element.getBoundingClientRect();
  await sendMouse({
    type: "move",
    position: [Math.round(rect.left + 20), Math.round(rect.top + 20)],
  });
  await delay(320);
  expect(controller.open).to.equal(true);
  const closed = onClose(element);
  await sendMouse({ type: "move", position: [0, 0] });
  expect((await closed).detail.reason).to.equal("timeout");
});

it("can change a timed notification to manual and reopen during exit", async () => {
  const { element, controller } = create({ timeout: 80 });
  await controller.show();
  await controller.show({ timeout: 0 });
  await delay(120);
  expect(controller.open).to.equal(true);
  let closes = 0;
  element.addEventListener("close", () => closes++);
  element.style.setProperty("--motionSlowDuration", "60ms");
  const hiding = controller.hide();
  await controller.show({ timeout: 0, position: "bottom-center" });
  await hiding;
  await delay(100);
  expect(controller.open).to.equal(true);
  expect(closes).to.equal(0);
  await controller.hide();
  expect(closes).to.equal(1);
});

it("stacks separate notifications at one position and closes the gap after dismissal", async () => {
  const first = create();
  const second = create();
  await first.controller.show();
  await second.controller.show();
  expect(second.element.getBoundingClientRect().top).to.be.closeTo(
    first.element.getBoundingClientRect().bottom + 12,
    1
  );
  await first.controller.hide();
  expect(second.element.getBoundingClientRect().top).to.be.closeTo(16, 1);
});

it("announces message text separately from the close button and cleans up", async () => {
  const before = document.querySelectorAll(".ag-notification-announcer").length;
  const { element, controller } = create();
  await controller.show();
  await settle();
  const region = document.querySelector(".ag-notification-announcer");
  expect(region.getAttribute("role")).to.equal("status");
  expect(region.getAttribute("aria-live")).to.equal("polite");
  expect(region.textContent).to.equal(
    element.querySelector(".ag-notification__message").textContent
  );
  await controller.show({ announcement: "assertive" });
  await settle();
  expect(region.getAttribute("role")).to.equal("alert");
  await controller.show({ announcement: "off" });
  expect(region.textContent).to.equal("");
  controller.destroy();
  expect(controller.open).to.equal(false);
  expect(
    document.querySelectorAll(".ag-notification-announcer").length
  ).to.equal(before);
});

it("retains native HTML invoker controls and observes native closing", async () => {
  const { element, controller } = create();
  const invoker = document.createElement("button");
  invoker.setAttribute("popovertarget", element.id);
  invoker.setAttribute("popovertargetaction", "show");
  root.append(invoker);
  invoker.click();
  await settle();
  expect(controller.open).to.equal(true);
  const closed = onClose(element);
  element.hidePopover();
  expect((await closed).detail.reason).to.equal("native");
});

it("restores focus only when dismissal removes the focused close button", async () => {
  const trigger = document.createElement("button");
  root.append(trigger);
  trigger.focus();
  const { controller, button } = create();
  await controller.show();
  button.focus();
  await controller.hide();
  expect(document.activeElement === trigger).to.equal(true);
});

it("rejects invalid options without opening and keeps initialisation idempotent", () => {
  const { element, controller } = create();
  expect(enhanceNotification(element) === controller).to.equal(true);
  controller.destroy();
  for (const options of [
    { timeout: -1 },
    { timeout: Infinity },
    { position: "middle" },
    { container: element },
  ]) {
    expect(() => enhanceNotification(element, options)).to.throw();
    expect(element.matches(":popover-open")).to.equal(false);
  }
  expect(element.getAttribute("popover")).to.equal("manual");
});
