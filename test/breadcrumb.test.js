import { expect } from "@esm-bundle/chai";
import { sendKeys, setViewport } from "@web/test-runner-commands";

let root;
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
});
afterEach(() => root.remove());

it("uses native links and keyboard focus, with a non-interactive current page", async () => {
  const links = root.querySelectorAll("a");
  const current = root.querySelector('[aria-current="page"]');
  expect(root.querySelector("ol").getAttribute("role")).to.equal("list");
  expect(current.tagName).to.equal("SPAN");
  expect(style(current).fontWeight).to.equal("400");
  expect(style(links[0]).fontWeight).to.equal("700");
  expect(style(root).fontSize).to.equal("12px");
  expect(style(root).color).to.equal("rgb(100, 120, 140)");
  links[0].focus();
  await sendKeys({ press: "Tab" });
  expect(document.activeElement).to.equal(links[1]);
  expect(style(links[1]).outlineStyle).to.equal("solid");
  let clicked = false;
  links[1].addEventListener("click", (event) => {
    event.preventDefault();
    clicked = true;
  });
  await sendKeys({ press: "Enter" });
  expect(clicked).to.equal(true);
  expect(bounds(root.querySelector(".ag-icon")).width).to.equal(18);
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

it("wraps long labels within narrow containers and mirrors separators in RTL", () => {
  root.style.width = "140px";
  const items = root.querySelectorAll("li");
  items[2].querySelector(".ag-breadcrumb__label").textContent =
    "ScandinavianHistoryAndTheVoyagesOfTheVikings";
  expect(root.scrollWidth).to.equal(root.clientWidth);
  expect(bounds(items[2]).top).to.be.greaterThan(bounds(items[0]).top);
  root.style.width = "600px";
  root.dir = "rtl";
  expect(bounds(items[0]).left).to.be.greaterThan(bounds(items[1]).left);
  expect(style(items[1], "::before").transform).to.equal(
    "matrix(-1, 0, 0, 1, 0, 0)"
  );
  root.dataset.variant = "backdrop";
  expect(style(root).color).to.equal("rgb(232, 201, 200)");
});

it("uses the shared Feather assets for icons and separators", async () => {
  const glyph = root.querySelector(".ag-icon");
  expect(style(glyph).maskImage || style(glyph).webkitMaskImage).to.include(
    "/assets/feather/home.svg"
  );
  const separator = style(root.querySelectorAll("li")[1], "::before");
  expect(separator.maskImage || separator.webkitMaskImage).to.include(
    "/assets/feather/chevron-right.svg"
  );
  expect(bounds(glyph).width).to.equal(18);
  expect(bounds(glyph).height).to.equal(18);
  for (const name of ["home", "file-text", "chevron-right"]) {
    const image = new Image();
    image.src = `/assets/feather/${name}.svg`;
    await image.decode();
    expect(image.naturalWidth).to.equal(24);
    expect(image.naturalHeight).to.equal(24);
  }
});
