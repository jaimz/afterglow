import { expect } from "@esm-bundle/chai";
import { sendKeys, setViewport } from "@web/test-runner-commands";
import { enhanceBreadcrumb } from "../src/behaviors/breadcrumb.ts";

let root;
let controller;
const style = (el, pseudo) => getComputedStyle(el, pseudo);
const bounds = (el) => el.getBoundingClientRect();
const crumb = (label, href, icon = "") => `<li class="ag-breadcrumb__item">
  <${href ? "a" : "span"} class="ag-breadcrumb__link" ${
  href ? `href="${href}"` : 'aria-current="page"'
}>
    ${
      icon
        ? `<span class="ag-icon" data-icon="${icon}" aria-hidden="true"></span>`
        : ""
    }
    <span class="ag-breadcrumb__label">${label}</span>
  </${href ? "a" : "span"}></li>`;

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
  root = document.createElement("nav");
  root.className = "ag-breadcrumb";
  root.setAttribute("aria-label", "Breadcrumb");
  root.innerHTML = `<ol class="ag-breadcrumb__list" role="list">${crumb(
    "Home",
    "#home",
    "home"
  )}${crumb("Library", "#library")}${crumb(
    "The Vikings",
    null,
    "book-open"
  )}</ol>`;
  document.body.append(root);
  controller = enhanceBreadcrumb(root);
});
afterEach(() => {
  controller.destroy();
  root.remove();
});

it("uses native links and keyboard focus, with a non-interactive current page", async () => {
  const links = root.querySelectorAll("a");
  const current = root.querySelector('[aria-current="page"]');
  expect(root.querySelector("ol").getAttribute("role")).to.equal("list");
  expect(current.tagName).to.equal("SPAN");
  expect(style(current).fontWeight).to.equal("400");
  expect(style(links[0]).fontWeight).to.equal("400");
  expect(parseFloat(style(root).fontSize)).to.be.closeTo(13.33, 0.01);
  expect(style(root).color).to.equal("rgb(88, 109, 128)");
  // Make this fixture independent of Safari's preference to skip links on Tab.
  for (const link of links) link.tabIndex = 0;
  links[0].focus();
  await sendKeys({ press: "Tab" });
  expect(document.activeElement === links[1]).to.equal(true);
  expect(style(links[1]).outlineStyle).to.equal("solid");
  let clicked = false;
  links[1].addEventListener("click", (event) => {
    event.preventDefault();
    clicked = true;
  });
  await sendKeys({ press: "Enter" });
  expect(clicked).to.equal(true);
  expect(bounds(root.querySelector(".ag-icon")).width).to.equal(16);
});

it("adds only decorative separators between visible crumbs and supports single items", () => {
  const items = root.querySelectorAll("li");
  expect(style(items[0], "::before").content).to.equal("none");
  expect(style(items[1], "::before").content).to.equal('""');
  expect(style(items[1], "::before").width).to.equal("18px");
  items[0].hidden = true;
  expect(style(items[0]).display).to.equal("none");
  expect(style(items[1], "::before").content).to.equal("none");
  expect(style(items[2], "::before").content).to.equal('""');
  items[1].remove();
  expect(style(items[2], "::before").content).to.equal("none");
  root.hidden = true;
  expect(style(root).display).to.equal("none");
});

it("keeps long paths on one scrollable line and mirrors separators in RTL", () => {
  root.style.width = "140px";
  const items = root.querySelectorAll("li");
  items[2].querySelector(".ag-breadcrumb__label").textContent =
    "ScandinavianHistoryAndTheVoyagesOfTheVikings";
  controller.refresh();
  expect(root.scrollWidth).to.be.greaterThan(root.clientWidth);
  expect(root.tabIndex).to.equal(0);
  expect(bounds(items[2]).top).to.equal(bounds(items[0]).top);
  root.scrollLeft = root.scrollWidth;
  expect(bounds(items[2]).right).to.be.at.most(bounds(root).right + 1);
  root.scrollLeft = 0;
  root.style.width = "600px";
  root.dir = "rtl";
  expect(bounds(items[0]).left).to.be.greaterThan(bounds(items[1]).left);
  expect(style(items[1], "::before").transform).to.equal(
    "matrix(-1, 0, 0, 1, 0, 0)"
  );
  root.dataset.variant = "backdrop";
  expect(style(root).color).to.equal("rgb(243, 215, 214)");
});

it("truncates only labels over 24 characters in the middle, retaining full names", () => {
  const label = root.querySelector(".ag-breadcrumb__label");
  label.textContent = "abcdefghijklmnopqrstuvwx";
  controller.refresh();
  expect(label.textContent).to.equal("abcdefghijklmnopqrstuvwx");
  expect(label.children.length).to.equal(0);
  label.textContent += "yz";
  controller.refresh();
  expect(label.querySelector('[aria-hidden="true"]').textContent).to.equal("abcdefghijkl…pqrstuvwxyz");
  expect(label.querySelector(".ag-breadcrumb__full-label").textContent).to.equal("abcdefghijklmnopqrstuvwxyz");
  expect(label.title).to.equal("abcdefghijklmnopqrstuvwxyz");
  expect(style(label).whiteSpace).to.equal("nowrap");
});

it("preserves graphemes, observes label changes, and restores text on cleanup", async () => {
  const label = root.querySelector(".ag-breadcrumb__label");
  const cluster = "👨‍👩‍👧‍👦";
  const fullName = cluster.repeat(25);
  label.title = "Original title";
  label.textContent = fullName;
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(label.querySelector('[aria-hidden="true"]').textContent).to.equal(cluster.repeat(12) + "…" + cluster.repeat(11));
  expect(enhanceBreadcrumb(root) === controller).to.equal(true);
  controller.refresh();
  expect(label.querySelectorAll('[aria-hidden="true"]').length).to.equal(1);
  controller.destroy();
  expect(label.textContent).to.equal(fullName);
  expect(label.title).to.equal("Original title");
  controller = enhanceBreadcrumb(root);
  label.textContent = "Short replacement";
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(label.textContent).to.equal("Short replacement");
  expect(label.children.length).to.equal(0);
  expect(label.title).to.equal("Original title");
});

it("uses shared optional icons and the exact Figma star and chevron assets", async () => {
  const glyph = root.querySelector(".ag-icon");
  expect(style(glyph).maskImage || style(glyph).webkitMaskImage).to.include(
    "/assets/feather/home.svg"
  );
  const separator = style(root.querySelectorAll("li")[1], "::before");
  expect(separator.maskImage || separator.webkitMaskImage).to.include(
    "/assets/breadcrumb/chevron-right.svg"
  );
  expect(bounds(glyph).width).to.equal(16);
  expect(bounds(glyph).height).to.equal(16);
  glyph.dataset.icon = "star";
  expect(style(glyph).maskImage || style(glyph).webkitMaskImage).to.include(
    "/assets/breadcrumb/star.svg"
  );
  for (const [path, size] of [
    ["feather/home", 24],
    ["breadcrumb/star", 16],
    ["breadcrumb/chevron-right", 18],
  ]) {
    const image = new Image();
    image.src = `/assets/${path}.svg`;
    await image.decode();
    expect(image.naturalWidth).to.equal(size);
    expect(image.naturalHeight).to.equal(size);
  }
});
