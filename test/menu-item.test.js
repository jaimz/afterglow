import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse, setViewport } from "@web/test-runner-commands";
import {
  createMenuItem,
  menuItemContent,
} from "../src/interact/MenuItem/fixtures/createMenuItem.ts";

let root;
const style = (el) => getComputedStyle(el);
const bounds = (el) => el.getBoundingClientRect();
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
  await setViewport({ width: 800, height: 600 });
  root = document.createElement("div");
  root.style.width = "240px";
  document.body.append(root);
  await sendMouse({ type: "move", position: [0, 0] });
});
afterEach(() => root.remove());

it("uses shared icons and fits selected and unselected rows to the reference geometry", () => {
  const item = createMenuItem({
    icon: "star",
    withSubmenu: true,
    isSelected: true,
  });
  root.append(item);
  expect(bounds(item).width).to.equal(240);
  expect(bounds(item).height).to.equal(48);
  expect(style(item).paddingBlockStart).to.equal("12px");
  expect(style(item).paddingInlineStart).to.equal("16px");
  expect(parseFloat(style(item).fontSize)).to.be.closeTo(13.33, 0.02);
  expect(style(item).color).to.equal("rgb(0, 118, 147)");
  expect(style(item).backgroundColor).to.equal("rgba(110, 163, 176, 0.2)");
  expect(style(item).borderRadius).to.equal("4px");
  const leader = item.querySelector(".ag-menu-item__leader");
  const submenu = item.querySelector(".ag-menu-item__submenu");
  expect(bounds(leader).width).to.equal(16);
  expect(bounds(submenu).width).to.equal(24);
  expect(bounds(submenu).right).to.equal(bounds(item).right - 16);
  expect(style(leader).backgroundColor).to.equal(style(item).color);
  item.removeAttribute("data-selected");
  expect(style(item).color).to.equal("rgb(83, 83, 74)");
  expect(style(item).backgroundColor).to.equal("rgba(0, 0, 0, 0)");
  expect(style(item).borderRadius).to.equal("8px");
});

it("keeps keyboard action and disabling native, and reflects toggle selection", async () => {
  const button = createMenuItem();
  root.append(button);
  let clicks = 0;
  button.onclick = () => clicks++;
  button.focus();
  await sendKeys({ press: "Enter" });
  await sendKeys({ press: "Space" });
  expect(clicks).to.equal(2);
  expect(style(button).outlineStyle).to.equal("solid");
  button.setAttribute("aria-pressed", "true");
  expect(style(button).color).to.equal("rgb(0, 118, 147)");
  button.setAttribute("aria-pressed", "false");
  expect(style(button).color).to.equal("rgb(83, 83, 74)");
  button.disabled = true;
  button.click();
  expect(clicks).to.equal(2);
  expect(style(button).opacity).to.equal("0.5");
  button.hidden = true;
  expect(style(button).display).to.equal("none");
});

it("composes with native links and a functioning details disclosure", async () => {
  root.innerHTML = `<a class="ag-menu-item" href="#documents" aria-current="page">${menuItemContent()}</a>
    <details><summary class="ag-menu-item">${menuItemContent({
      label: "Collections",
      withChildMenu: true,
    })}</summary><a class="ag-menu-item" href="#research">${menuItemContent({
    label: "Research",
    icon: "",
  })}</a></details>`;
  const link = root.querySelector("a");
  expect(style(link).color).to.equal("rgb(0, 118, 147)");
  link.setAttribute("aria-current", "false");
  expect(style(link).color).to.equal("rgb(83, 83, 74)");
  const details = root.querySelector("details");
  const summary = root.querySelector("summary");
  expect(
    summary.firstElementChild.classList.contains("ag-menu-item__child-menu")
  ).to.equal(true);
  expect(bounds(summary.firstElementChild).left).to.equal(
    bounds(summary).left + 16
  );
  summary.focus();
  await sendKeys({ press: "Enter" });
  expect(details.open).to.equal(true);
  expect(
    style(summary.querySelector(".ag-menu-item__child-menu")).transform
  ).to.equal("matrix(0, 1, -1, 0, 0, 0)");
  await sendKeys({ press: "Tab" });
  expect(document.activeElement).to.equal(details.querySelector("a"));
  summary.focus();
  await sendKeys({ press: "Space" });
  expect(details.open).to.equal(false);
});

it("wraps labels, omits optional slots and supports inherited RTL and expanded states", () => {
  const item = createMenuItem({
    label: "AReallyLongUnbrokenDocumentNameThatMustFitInsideThisMenu",
    withSubmenu: true,
  });
  root.style.width = "160px";
  root.append(item);
  expect(item.scrollWidth).to.equal(item.clientWidth);
  expect(bounds(item).height).to.be.greaterThan(48);
  root.dir = "rtl";
  const indicator = item.querySelector(".ag-menu-item__submenu");
  expect(bounds(indicator).left).to.equal(bounds(item).left + 16);
  expect(style(indicator).transform).to.equal("matrix(-1, 0, 0, 1, 0, 0)");
  item.setAttribute("aria-expanded", "true");
  expect(style(indicator).transform).to.equal("matrix(-1, 0, 0, 1, 0, 0)");
  const child = createMenuItem({ withChildMenu: true, withSubmenu: true });
  root.append(child);
  const childChevron = child.querySelector(".ag-menu-item__child-menu");
  expect(child.firstElementChild).to.equal(childChevron);
  expect(child.querySelector(".ag-menu-item__submenu")).to.equal(null);
  expect(bounds(childChevron).right).to.equal(bounds(child).right - 16);
  child.setAttribute("aria-expanded", "true");
  expect(style(childChevron).transform).to.equal("matrix(0, 1, -1, 0, 0, 0)");
  const textOnly = createMenuItem({ icon: "", label: "Text only" });
  root.append(textOnly);
  expect(textOnly.querySelectorAll(".ag-icon").length).to.equal(0);
  expect(bounds(textOnly).height).to.equal(48);
});
