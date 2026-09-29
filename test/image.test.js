import { expect } from "@esm-bundle/chai";
import { emulateMedia } from "@web/test-runner-commands";
import { enhanceImage } from "../src/main.ts";

const landscape = "/src/present/Image/assets/landscape.png";
const portrait = "/src/present/Avatar/assets/leaf.jpg";
let root, controller;
const flush = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const picture = () => root.querySelector(".ag-image__picture");
const copy = () => root.querySelector(".ag-image__backlight");
const loaded = async () => {
  await flush();
  await picture().decode();
  await flush();
};

before(async () => {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/afterglow.css";
  const ready = new Promise((resolve) => (css.onload = resolve));
  document.head.append(css);
  await ready;
});
beforeEach(() => {
  root = document.createElement("figure");
  root.className = "ag-image";
  root.innerHTML = `<img class="ag-image__picture" src="${landscape}" alt="Trees reflected in a lake."><figcaption class="ag-image__caption"><p class="ag-image__overline">Vancouver</p><h3 class="ag-image__title">Canada</h3></figcaption>`;
  document.body.append(root);
});
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  root.remove();
});

it("renders a native accessible image and optional caption at responsive dimensions", async () => {
  await loaded();
  expect(root.getBoundingClientRect().width).to.equal(328);
  expect(root.getBoundingClientRect().height).to.be.closeTo(170, 0.1);
  expect(getComputedStyle(picture()).objectFit).to.equal("cover");
  expect(getComputedStyle(picture()).borderRadius).to.equal("8px");
  expect(picture().alt).to.equal("Trees reflected in a lake.");
  expect(getComputedStyle(root, "::after").content).not.to.equal("none");
  const caption = root.querySelector("figcaption");
  caption.hidden = true;
  await flush();
  expect(getComputedStyle(root, "::after").content).to.equal("none");
  caption.hidden = false;
  caption.querySelectorAll("p, h3").forEach((el) => (el.textContent = ""));
  await flush();
  expect(getComputedStyle(caption).display).to.equal("none");
  expect(getComputedStyle(root, "::after").content).to.equal("none");
  root.querySelector("figcaption").remove();
  await flush();
  expect(getComputedStyle(root, "::after").content).to.equal("none");
  root.style.width = "164px";
  expect(root.getBoundingClientRect().height).to.be.closeTo(85, 0.1);
  root.hidden = true;
  expect(root.getBoundingClientRect().width).to.equal(0);
});

it("mirrors loaded URLs, keeps the copy decorative and supports toggling", async () => {
  controller = enhanceImage(root, { backlight: true });
  await loaded();
  expect(copy().src).to.equal(picture().currentSrc);
  expect(copy().hidden).to.equal(false);
  expect(copy().alt).to.equal("");
  expect(copy().getAttribute("aria-hidden")).to.equal("true");
  expect(getComputedStyle(copy()).filter).to.equal("blur(16px)");
  controller.imageUrl = portrait;
  await loaded();
  expect(copy().src).to.equal(picture().currentSrc);
  expect(copy().src).to.include("leaf.jpg");
  controller.backlight = false;
  expect(copy().hidden).to.equal(true);
  expect(copy().hasAttribute("src")).to.equal(false);
  root.setAttribute("data-backlight", "");
  await flush();
  expect(copy().hidden).to.equal(false);
});

it("follows native and responsive source changes, then clears responsive sources on URL assignment", async () => {
  controller = enhanceImage(root, { backlight: true });
  await loaded();
  picture().srcset = `${portrait} 1x`;
  await loaded();
  expect(copy().src).to.equal(picture().currentSrc);
  expect(copy().src).to.include("leaf.jpg");
  controller.imageUrl = landscape;
  await loaded();
  expect(picture().hasAttribute("srcset")).to.equal(false);
  expect(copy().src).to.include("landscape.png");
  picture().src = portrait;
  await loaded();
  expect(copy().src).to.include("leaf.jpg");
});

it("removes stale backlight on failed and cleared URLs and recovers on a valid URL", async () => {
  controller = enhanceImage(root, { backlight: true });
  await loaded();
  const failed = new Promise((resolve) =>
    picture().addEventListener("error", resolve, { once: true })
  );
  controller.imageUrl = "data:image/png;base64,invalid";
  await failed;
  await flush();
  expect(copy().hidden).to.equal(true);
  expect(copy().hasAttribute("src")).to.equal(false);
  controller.imageUrl = portrait;
  await loaded();
  expect(copy().hidden).to.equal(false);
  controller.imageUrl = "";
  await flush();
  expect(picture().hasAttribute("src")).to.equal(false);
  expect(copy().hidden).to.equal(true);
});

it("is idempotent and removes its decoration on cleanup without changing native content", async () => {
  controller = enhanceImage(root, { backlight: true });
  expect(enhanceImage(root)).to.equal(controller);
  await loaded();
  controller.destroy();
  controller.destroy();
  expect(copy()).to.equal(null);
  expect(picture().getAttribute("src")).to.equal(landscape);
  expect(root.querySelector("h3").textContent).to.equal("Canada");
  controller = enhanceImage(root);
  await flush();
  expect(root.querySelectorAll(".ag-image__backlight").length).to.equal(1);
  expect(copy().hidden).to.equal(false);
});

it("restores an authored decorative copy after enhancement", async () => {
  const authored = document.createElement("img");
  authored.className = "ag-image__backlight";
  authored.src = landscape;
  authored.alt = "";
  root.prepend(authored);
  controller = enhanceImage(root, { backlight: true });
  await loaded();
  controller.destroy();
  expect(copy()).to.equal(authored);
  expect(authored.getAttribute("src")).to.equal(landscape);
  expect(authored.hasAttribute("aria-hidden")).to.equal(false);
});

it("keeps captions readable without a decorative glow in forced colours", async () => {
  controller = enhanceImage(root, { backlight: true });
  await loaded();
  await emulateMedia({ forcedColors: "active" });
  try {
    expect(getComputedStyle(copy()).display).to.equal("none");
    expect(
      getComputedStyle(root.querySelector("figcaption")).backgroundColor
    ).not.to.equal("rgba(0, 0, 0, 0)");
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});
