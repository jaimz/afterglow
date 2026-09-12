import { expect } from "@esm-bundle/chai";
import { emulateMedia, sendKeys, sendMouse } from "@web/test-runner-commands";

let root;
const style = (element) => getComputedStyle(element);
const bounds = (element) => element.getBoundingClientRect();
const fixture = (markup) => {
  root.innerHTML = markup;
  return root.firstElementChild;
};
const icon = (name = "search", attributes = "") =>
  `<span class="ag-icon" data-icon="${name}" aria-hidden="true" ${attributes}></span>`;

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

it("selects Feather masks on native elements and inherits colour and theme sizing", () => {
  const glyph = fixture(icon());
  expect(glyph).to.be.instanceOf(HTMLSpanElement);
  expect(bounds(glyph).width).to.equal(24);
  expect(bounds(glyph).height).to.equal(24);
  expect(style(glyph).maskImage).to.include("/assets/feather/search.svg");
  expect(style(glyph).maskSize).to.equal("contain");
  root.style.color = "rgb(10, 20, 30)";
  root.style.setProperty("--icon-size", "32px");
  expect(style(glyph).backgroundColor).to.equal("rgb(10, 20, 30)");
  expect(bounds(glyph).width).to.equal(32);
  expect(bounds(glyph).height).to.equal(32);
  root.style.fontSize = "18px";
  glyph.style.setProperty("--icon-size", "1em");
  expect(bounds(glyph).width).to.equal(18);
  glyph.dataset.icon = "arrow-right";
  expect(style(glyph).maskImage).to.include("/assets/feather/arrow-right.svg");
});

it("keeps unknown icons empty and honours hidden without a component runtime", () => {
  const glyph = fixture(icon("not-a-feather-icon"));
  expect(style(glyph).maskImage).to.include("linear-gradient");
  expect(style(glyph).maskImage).to.include("rgba(0, 0, 0, 0)");
  glyph.removeAttribute("data-icon");
  expect(style(glyph).maskImage).to.include("linear-gradient");
  glyph.hidden = true;
  expect(style(glyph).display).to.equal("none");
});

it("stays the same size in cramped flex layouts and composes with button spacing in RTL", () => {
  const flex = fixture(`<div style="display:flex;width:8px">${icon()}</div>`);
  expect(bounds(flex.firstElementChild).width).to.equal(24);
  const button = fixture(
    `<button type="button" class="ag-button" style="--icon-size:20px"><span class="ag-icon ag-button__start" data-icon="save" aria-hidden="true"></span>Save</button>`
  );
  const glyph = button.firstElementChild;
  expect(bounds(glyph).width).to.equal(20);
  expect(style(glyph).marginRight).to.equal("8px");
  root.dir = "rtl";
  expect(style(glyph).marginLeft).to.equal("8px");
  expect(style(glyph).marginRight).to.equal("0px");
  expect(style(glyph).transform).to.equal("none");
});

it("follows button state colours and leaves focus, activation and disabled behaviour native", async () => {
  const button = fixture(
    `<button type="button" class="ag-button" data-variant="primary" aria-label="Search">${icon()}</button>`
  );
  const glyph = button.firstElementChild;
  let clicks = 0;
  button.onclick = () => clicks++;
  button.focus();
  expect(document.activeElement).to.equal(button);
  expect(glyph.tabIndex).to.equal(-1);
  await sendKeys({ press: "Enter" });
  await sendKeys({ press: "Space" });
  expect(clicks).to.equal(2);
  expect(style(glyph).backgroundColor).to.equal(style(button).color);
  button.dataset.variant = "outline";
  button.dataset.dangerous = "";
  const box = bounds(button);
  await sendMouse({ type: "move", position: [box.x + 5, box.y + 5] });
  expect(style(glyph).backgroundColor).to.equal(style(button).color);
  button.disabled = true;
  button.click();
  expect(clicks).to.equal(2);
  expect(style(glyph).backgroundColor).to.equal(style(button).color);
  expect(style(button).opacity).to.equal("0.5");
});

it("serves usable SVG assets at the standalone stylesheet URLs", async () => {
  for (const name of ["search", "check", "arrow-right", "feather", "github"]) {
    const url = `/assets/feather/${name}.svg`;
    const response = await fetch(url);
    expect(response.ok, name).to.equal(true);
    expect(response.headers.get("content-type"), name).to.include(
      "image/svg+xml"
    );
    const svg = new DOMParser().parseFromString(
      await response.text(),
      "image/svg+xml"
    );
    expect(svg.documentElement.getAttribute("viewBox"), name).to.equal(
      "0 0 24 24"
    );
    const image = new Image();
    image.src = url;
    await image.decode();
    expect(image.naturalWidth, name).to.equal(24);
  }
});

it("keeps icon masks visible in forced-colour mode", async function () {
  await emulateMedia({ forcedColors: "active" });
  try {
    // Skip if a browser cannot emulate the requested media feature.
    if (!matchMedia("(forced-colors: active)").matches) this.skip();
    const button = fixture(
      `<button type="button" class="ag-button" data-variant="primary" aria-label="Search">${icon()}</button>`
    );
    const glyph = button.firstElementChild;
    if (CSS.supports("forced-color-adjust", "preserve-parent-color"))
      expect(style(glyph).backgroundColor).to.equal(style(button).color);
    expect(style(glyph).backgroundColor).not.to.equal(
      style(button).backgroundColor
    );
    expect(style(glyph).maskImage).to.include("/assets/feather/search.svg");
    button.disabled = true;
    expect(style(glyph).backgroundColor).not.to.equal(
      style(button).backgroundColor
    );
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});
