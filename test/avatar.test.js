import { expect } from "@esm-bundle/chai";
import { enhanceAvatar, getAvatarInitials } from "../src/main.ts";
import { element } from "../src/stories/fixtures.ts";

let root;
let controllers;
const settle = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const style = (element) => getComputedStyle(element);
const rect = (element) => element.getBoundingClientRect();
const create = (
  options = {},
  attributes = 'data-variant="initials"',
  children = ""
) => {
  const avatar = element(
    `<span class="ag-avatar" ${attributes}>${children}</span>`
  );
  root.append(avatar);
  const controller = enhanceAvatar(avatar, options);
  controllers.push(controller);
  return {
    avatar,
    controller,
    letters: avatar.querySelector(".ag-avatar__initials"),
  };
};

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
  await document.fonts.load('300 48px "Comfortaa"');
});
beforeEach(() => {
  root = document.createElement("div");
  root.className = "ag-body";
  document.body.append(root);
  controllers = [];
});
afterEach(() => {
  controllers.forEach((controller) => controller.destroy());
  root.remove();
});

it("derives two initials from names and preserves complete Unicode graphemes", () => {
  const names = [
    ["James O’Toole", "jo"],
    ["  Mary   Jane Watson  ", "mw"],
    ["Dr. Mary Jane Watson, Ph.D.", "mw"],
    ["John Smith Jr.", "js"],
    ["Lovelace, Ada", "al"],
    ["Watson, Dr. Mary Jane, Ph.D.", "mw"],
    ["Prince", "p"],
    ["Jean-Luc", "jl"],
    ["Jean-Luc Picard", "jp"],
    ["O’Toole", "o"],
    ["Álvaro Núñez", "án"],
    ["A\u0301lvaro Núñez", "án"],
    ["👩🏽‍💻 Ada Lovelace", "al"],
    ["王 小明", "王小"],
    ["王小明", "王"],
    ["علي حسن", "عح"],
    ["Σωκράτης Σάμου", "σσ"],
    ["नरेन्द्र मोदी", "नमो"],
    ["Dr", "d"],
    ["", ""],
    ["   ", ""],
    ["?! 👨‍👩‍👦", ""],
  ];
  for (const [name, expected] of names)
    expect(getAvatarInitials(name), name).to.equal(expected);
  expect(getAvatarInitials("Işık Öztürk", "tr")).to.equal("ıö");
});

it("provides a writable name property and updates initials and the accessible name", () => {
  const { avatar, controller, letters } = create({ name: "James O’Toole" });
  expect(customElements.get("ag-avatar")).to.equal(undefined);
  expect(avatar).to.be.instanceOf(HTMLSpanElement);
  expect(controller.initials).to.equal("jo");
  expect(letters.textContent).to.equal("jo");
  expect(avatar.getAttribute("role")).to.equal("img");
  expect(avatar.getAttribute("aria-label")).to.equal("James O’Toole");
  expect(letters.getAttribute("aria-hidden")).to.equal("true");
  controller.name = "Ada Lovelace";
  expect(controller.name).to.equal("Ada Lovelace");
  expect(controller.initials).to.equal("al");
  expect(avatar.dataset.name).to.equal("Ada Lovelace");
  expect(avatar.getAttribute("aria-label")).to.equal("Ada Lovelace");
});

it("observes declarative name changes and supports manual initials and locale overrides", async () => {
  const { avatar, controller, letters } = create(
    {},
    'data-variant="initials" data-name="Ada Lovelace"'
  );
  expect(controller.initials).to.equal("al");
  avatar.dataset.name = "Işık Öztürk";
  avatar.lang = "tr";
  await settle();
  expect(letters.textContent).to.equal("ıö");
  controller.update({ initials: "J D" });
  expect(controller.initials).to.equal("JD");
  controller.update({ initials: "A\u0301ZQ" });
  expect(controller.initials).to.equal("ÁZ");
  controller.update({ initials: null });
  expect(controller.initials).to.equal("ıö");
});

it("treats supplied names as text and never injects HTML", () => {
  const name = '<img src=x onerror="alert(1)">';
  const { avatar, controller } = create({ name });
  expect(avatar.querySelector("img")).to.equal(null);
  expect(avatar.getAttribute("aria-label")).to.equal(name);
  controller.update({ initials: "<>" });
  expect(avatar.querySelector(".ag-avatar__initials").textContent).to.equal(
    "<>"
  );
});

it("uses the specified sizes, leaf corners, font and flat colours", async () => {
  const sizes = [
    ["default", 40, 16, 36],
    ["header", 48, 18, 48],
    ["large", 80, 30, 72],
  ];
  for (const [size, dimension, radius, fontSize] of sizes) {
    const { avatar, letters } = create(
      { name: "James O’Toole" },
      `data-variant="initials" data-size="${size}"`
    );
    await settle();
    expect(rect(avatar).width).to.equal(dimension);
    expect(rect(avatar).height).to.equal(dimension);
    expect(style(avatar).borderTopLeftRadius).to.equal("6px");
    expect(style(avatar).borderTopRightRadius).to.equal(`${radius}px`);
    expect(style(letters).fontFamily).to.include("Comfortaa");
    expect(style(letters).fontWeight).to.equal("300");
    expect(parseFloat(style(letters).fontSize)).to.be.closeTo(fontSize, 0.1);
    expect(style(avatar).color).to.equal("rgb(0, 118, 147)");
    expect(style(avatar).boxShadow).to.include("0px 2px 7px");
    avatar.dataset.variant = "flat-initials";
    expect(style(avatar).backgroundColor).to.equal("rgb(0, 76, 94)");
    expect(style(avatar).color).to.equal("rgb(243, 238, 230)");
    expect(style(avatar).boxShadow).to.equal("none");
  }
});

it("shrinks wide initials without losing their lower-right positioning", async () => {
  const { avatar, controller, letters } = create(
    { name: "James O’Toole" },
    'data-variant="initials" data-size="large"'
  );
  await settle();
  const originalSize = parseFloat(style(letters).fontSize);
  const originalBottom = rect(letters).bottom - rect(avatar).bottom;
  controller.name = "William Morris";
  await settle();
  expect(parseFloat(style(letters).fontSize)).to.be.lessThan(originalSize);
  expect(rect(letters).width).to.be.at.most(rect(avatar).width * 0.9375 + 0.5);
  expect(rect(letters).left).to.be.greaterThan(rect(avatar).left);
  expect(rect(letters).bottom - rect(avatar).bottom).to.be.lessThan(
    originalBottom
  );
});

it("centres single initials and refits when size or shape changes", async () => {
  const { avatar, controller, letters } = create({ name: "Prince" });
  await settle();
  expect(avatar.dataset.initialCount).to.equal("1");
  expect((rect(letters).left + rect(letters).right) / 2).to.be.closeTo(
    (rect(avatar).left + rect(avatar).right) / 2,
    0.25
  );
  expect((rect(letters).top + rect(letters).bottom) / 2).to.be.closeTo(
    (rect(avatar).top + rect(avatar).bottom) / 2,
    0.25
  );
  controller.name = "William Morris";
  avatar.dataset.size = "header";
  avatar.dataset.shape = "circle";
  await settle();
  expect(rect(avatar).width).to.equal(48);
  expect(rect(letters).width).to.be.at.most(48 * 0.8 + 0.5);
  expect(style(avatar).borderRadius).to.equal("50%");
});

it("keeps narrow final letters and non-Latin initials visible", async () => {
  const { avatar, controller, letters } = create(
    { name: "James O’Toole" },
    'data-variant="initials" data-size="header"'
  );
  await settle();
  const originalRight = rect(letters).right - rect(avatar).right;
  controller.name = "Ada Lovelace";
  await settle();
  expect(rect(letters).right - rect(avatar).right).to.be.lessThan(
    originalRight
  );
  controller.name = "王 小明";
  await settle();
  expect(avatar.dataset.initialLayout).to.equal("centered");
  expect(rect(letters).left).to.be.at.least(rect(avatar).left);
  expect(rect(letters).right).to.be.at.most(rect(avatar).right);
  expect(rect(letters).top).to.be.at.least(rect(avatar).top);
  expect(rect(letters).bottom).to.be.at.most(rect(avatar).bottom);
});

it("uses the blank artwork for an empty name and preserves decorative accessibility", async () => {
  const { avatar, controller, letters } = create({ name: "" });
  expect(avatar.dataset.avatarFallback).to.equal("blank");
  expect(style(letters).display).to.equal("none");
  expect(getComputedStyle(avatar, "::before").maskImage).to.include(
    "assets/avatar/blank.svg"
  );
  expect(avatar.getAttribute("aria-label")).to.equal("Unknown user");
  controller.update({ label: "Utilisateur inconnu", decorative: true });
  expect(avatar.getAttribute("aria-hidden")).to.equal("true");
  controller.update({ decorative: false });
  expect(avatar.hasAttribute("aria-hidden")).to.equal(false);
  expect(avatar.getAttribute("aria-label")).to.equal("Utilisateur inconnu");
  const response = await fetch("/assets/avatar/blank.svg");
  expect(response.ok).to.equal(true);
});

it("replaces missing or failed portraits with initials and recovers when a photo loads", async () => {
  const { avatar, controller } = create(
    { name: "Ada Lovelace" },
    'data-variant="image"',
    '<img class="ag-avatar__image" alt="">'
  );
  const image = avatar.querySelector("img");
  expect(avatar.dataset.avatarFallback).to.equal("initials");
  expect(style(image).display).to.equal("none");
  const loaded = new Promise((resolve) =>
    image.addEventListener("load", resolve, { once: true })
  );
  image.src = "/src/present/Avatar/assets/leaf.jpg";
  await loaded;
  await settle();
  expect(avatar.hasAttribute("data-avatar-fallback")).to.equal(false);
  expect(style(image).display).to.equal("block");
  expect(style(image).objectFit).to.equal("cover");
  const failed = new Promise((resolve) =>
    image.addEventListener("error", resolve, { once: true })
  );
  image.src = "data:image/png;base64,broken";
  await failed;
  expect(avatar.dataset.avatarFallback).to.equal("initials");
  controller.name = "";
  expect(avatar.dataset.avatarFallback).to.equal("blank");
});

it("creates a native photo from the imageUrl option without bundled defaults", async () => {
  const { avatar, controller } = create({ name: "Ada Lovelace" }, "");
  expect(controller.imageUrl).to.equal("");
  expect(avatar.querySelector("img")).to.equal(null);
  expect(avatar.dataset.avatarFallback).to.equal("initials");

  const suppliedUrl = "/src/present/Avatar/assets/leaf.jpg";
  const photo = create({ name: "Ada Lovelace", imageUrl: suppliedUrl }, "");
  const image = photo.avatar.querySelector("img");
  expect(photo.controller.imageUrl).to.equal(suppliedUrl);
  expect(image.className).to.equal("ag-avatar__image");
  expect(image.alt).to.equal("");
  expect(photo.avatar.getAttribute("aria-label")).to.equal("Ada Lovelace");
  await image.decode();
  await settle();
  expect(photo.avatar.hasAttribute("data-avatar-fallback")).to.equal(false);
  expect(style(image).display).to.equal("block");
});

it("replaces, clears and recovers photos through the imageUrl property", async () => {
  const { avatar, controller } = create(
    { name: "Ada Lovelace", imageUrl: "/src/present/Avatar/assets/leaf.jpg" },
    'data-variant="image"'
  );
  const image = avatar.querySelector("img");
  await image.decode();
  controller.imageUrl = "/src/present/Avatar/assets/circle.jpg";
  await image.decode();
  await settle();
  expect(avatar.querySelectorAll("img").length).to.equal(1);
  expect(controller.imageUrl).to.equal("/src/present/Avatar/assets/circle.jpg");
  expect(image.currentSrc).to.equal(
    new URL(controller.imageUrl, document.baseURI).href
  );
  expect(avatar.hasAttribute("data-avatar-fallback")).to.equal(false);

  controller.imageUrl = "";
  await settle();
  expect(controller.imageUrl).to.equal("");
  expect(image.hasAttribute("src")).to.equal(false);
  expect(avatar.dataset.avatarFallback).to.equal("initials");
  expect(style(image).display).to.equal("none");
  const failed = new Promise((resolve) =>
    image.addEventListener("error", resolve, { once: true })
  );
  controller.imageUrl = "data:image/png;base64,broken";
  await failed;
  expect(avatar.dataset.avatarFallback).to.equal("initials");
  controller.update({ name: "", imageUrl: "" });
  await settle();
  expect(avatar.dataset.avatarFallback).to.equal("blank");

  controller.update({ imageUrl: "/src/present/Avatar/assets/square.jpg" });
  await image.decode();
  await settle();
  expect(avatar.hasAttribute("data-avatar-fallback")).to.equal(false);
  controller.destroy();
  controller.imageUrl = "";
  expect(image.getAttribute("src")).to.equal(
    "/src/present/Avatar/assets/square.jpg"
  );
});

it("preserves native responsive sources until imageUrl explicitly replaces them", async () => {
  const { avatar, controller } = create(
    { name: "Ada Lovelace" },
    'data-variant="initials"',
    '<img class="ag-avatar__image" src="/src/present/Avatar/assets/leaf.jpg" srcset="/src/present/Avatar/assets/circle.jpg 200w" sizes="40px" alt="">'
  );
  const image = avatar.querySelector("img");
  controller.name = "James O’Toole";
  expect(image.hasAttribute("srcset")).to.equal(true);
  expect(image.getAttribute("sizes")).to.equal("40px");
  controller.imageUrl = "/src/present/Avatar/assets/square.jpg";
  await image.decode();
  await settle();
  expect(image.hasAttribute("srcset")).to.equal(false);
  expect(image.hasAttribute("sizes")).to.equal(false);
  expect(style(image).display).to.equal("none");
  avatar.dataset.variant = "image";
  await settle();
  expect(style(image).display).to.equal("block");

  image.src = "/src/present/Avatar/assets/leaf.jpg";
  controller.update({ name: "Ada Lovelace" });
  expect(controller.imageUrl).to.equal("/src/present/Avatar/assets/leaf.jpg");
  image.srcset = "/src/present/Avatar/assets/circle.jpg 200w";
  controller.update({ imageUrl: "" });
  await settle();
  expect(image.hasAttribute("srcset")).to.equal(false);
  expect(avatar.dataset.avatarFallback).to.equal("initials");
});

it("binds replacement portrait elements and releases all automatic updates on destroy", async () => {
  const { avatar, controller, letters } = create(
    { name: "Ada Lovelace" },
    'data-variant="image"',
    '<img class="ag-avatar__image" alt="">'
  );
  const replacement = document.createElement("img");
  replacement.className = "ag-avatar__image";
  replacement.alt = "";
  const loaded = new Promise((resolve) =>
    replacement.addEventListener("load", resolve, { once: true })
  );
  replacement.src = "/src/present/Avatar/assets/circle.jpg";
  avatar.querySelector("img").replaceWith(replacement);
  await loaded;
  await settle();
  expect(avatar.hasAttribute("data-avatar-fallback")).to.equal(false);
  expect(enhanceAvatar(avatar) === controller).to.equal(true);
  controller.destroy();
  avatar.dataset.name = "William Morris";
  replacement.removeAttribute("src");
  await settle();
  expect(letters.textContent).to.equal("al");
  expect(avatar.hasAttribute("data-avatar-fallback")).to.equal(false);
  const next = enhanceAvatar(avatar);
  controllers.push(next);
  expect(next === controller).to.equal(false);
  expect(next.initials).to.equal("wm");
});

it("fits avatars enhanced before mounting and responds to local theme sizing", async () => {
  const avatar = element(
    '<span class="ag-avatar" data-variant="initials"></span>'
  );
  const controller = enhanceAvatar(avatar, { name: "William Morris" });
  controllers.push(controller);
  root.append(avatar);
  await settle();
  const letters = avatar.querySelector(".ag-avatar__initials");
  expect(rect(letters).width).to.be.at.most(40 * 0.9375 + 0.5);
  root.style.setProperty("--avatar-size", "64px");
  root.style.setProperty("--ctrlText", "rgb(10,20,30)");
  await settle();
  expect(rect(avatar).width).to.equal(64);
  expect(style(avatar).color).to.equal("rgb(10, 20, 30)");
  expect(rect(letters).width).to.be.at.most(64 * 0.9375 + 0.5);
});

it("keeps leaf orientation in RTL and honours native hidden", async () => {
  const { avatar, letters } = create({ name: "Ada Lovelace" });
  await settle();
  const offset = rect(letters).left - rect(avatar).left;
  root.dir = "rtl";
  expect(rect(letters).left - rect(avatar).left).to.be.closeTo(offset, 0.1);
  expect(style(avatar).borderTopRightRadius).to.equal("16px");
  avatar.hidden = true;
  expect(style(avatar).display).to.equal("none");
});

it("renders a static initials recipe without the helper", () => {
  const avatar = element(
    '<span class="ag-avatar" data-variant="initials" data-initial-count="2" role="img" aria-label="James O’Toole"><span class="ag-avatar__initials" aria-hidden="true">jo</span></span>'
  );
  root.append(avatar);
  expect(rect(avatar).width).to.equal(40);
  expect(style(avatar.firstElementChild).display).to.equal("block");
  expect(avatar.getAttribute("aria-label")).to.equal("James O’Toole");
});
