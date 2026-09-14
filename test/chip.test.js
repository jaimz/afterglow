import { expect } from "@esm-bundle/chai";
import { sendKeys } from "@web/test-runner-commands";
import { chipMarkup } from "../src/interact/Chip/fixtures/createChip.ts";
import { enhanceAvatar } from "../src/main.ts";

let root;
let avatar;
const fixture = (markup) => {
  root.innerHTML = markup;
  return root.firstElementChild;
};
const bounds = (element) => element.getBoundingClientRect();

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
afterEach(() => {
  avatar?.destroy();
  avatar = undefined;
  root.remove();
});

it("uses a native remove button, with one activation and no form submission", async () => {
  const form = fixture(`<form>${chipMarkup({ label: "Portland" })}</form>`);
  const chip = form.querySelector(".ag-chip");
  const button = chip.querySelector("button");
  expect(button).to.be.instanceOf(HTMLButtonElement);
  expect(button.getAttribute("aria-label")).to.equal("Remove Portland");
  let removals = 0;
  let submissions = 0;
  button.onclick = () => removals++;
  form.onsubmit = (event) => {
    event.preventDefault();
    submissions++;
  };
  chip.querySelector(".ag-chip__label").click();
  expect(removals).to.equal(0);
  button.focus();
  await sendKeys({ press: "Enter" });
  expect(removals).to.equal(1);
  await sendKeys({ press: "Space" });
  expect(removals).to.equal(2);
  expect(submissions).to.equal(0);
  expect(getComputedStyle(button).outlineStyle).to.equal("solid");
  button.disabled = true;
  button.click();
  expect(removals).to.equal(2);
  expect(getComputedStyle(chip).opacity).to.equal("0.5");
  expect(customElements.get("ag-chip")).to.equal(undefined);
});

it("keeps the five variants at their intended heights and circular avatar size", () => {
  for (const [variant, height] of [
    ["default", 36],
    ["outlined", 36],
    ["avatar", 30],
    ["avatar-outlined", 30],
    ["backdrop", 32],
  ]) {
    const chip = fixture(chipMarkup({ variant }));
    expect(bounds(chip).height, variant).to.be.closeTo(height, 0.1);
    const image = chip.querySelector(".ag-avatar");
    if (image) {
      expect(bounds(image).width).to.equal(28);
      expect(bounds(image).height).to.equal(28);
      expect(getComputedStyle(image).borderRadius).to.equal("50%");
      expect(getComputedStyle(image).boxShadow).to.equal("none");
      expect(bounds(chip.querySelector("button")).width).to.equal(28);
    }
  }
});

it("composes automatic initials and missing-photo fallback without changing the avatar recipe", async () => {
  const chip = fixture(
    chipMarkup({ variant: "avatar-outlined", name: "Ada Lovelace" })
  );
  const image = chip.querySelector(".ag-avatar");
  avatar = enhanceAvatar(image, { decorative: true });
  await document.fonts.ready;
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  expect(avatar.initials).to.equal("al");
  expect(image.dataset.avatarFallback).to.equal("initials");
  expect(image.getAttribute("aria-hidden")).to.equal("true");
  const initials = image.querySelector(".ag-avatar__initials");
  const picture = bounds(image);
  const text = bounds(initials);
  expect(text.width).to.be.at.most(picture.width);
  expect(text.left + text.width / 2).to.be.closeTo(
    picture.left + picture.width / 2,
    0.5
  );
  expect(getComputedStyle(image).boxShadow).to.equal("none");
  avatar.name = "Prince";
  expect(avatar.initials).to.equal("p");
});

it("allows any Feather glyph and consumer-supplied image in the leading slot", () => {
  const chip = fixture(
    chipMarkup({ icon: "heart", label: "<Favourite> & saved" })
  );
  const icon = chip.querySelector(".ag-chip__icon");
  expect(getComputedStyle(icon).maskImage).to.include("heart.svg");
  expect(chip.querySelector(".ag-chip__label").textContent).to.equal(
    "<Favourite> & saved"
  );
  const img = document.createElement("img");
  img.alt = "";
  img.className = "ag-chip__icon";
  img.src = "/assets/feather/compass.svg";
  icon.replaceWith(img);
  expect(bounds(img).width).to.equal(20);
  expect(bounds(img).height).to.equal(20);
  expect(getComputedStyle(img).objectFit).to.equal("contain");
});

it("contains long text in narrow views and mirrors leading/trailing content in RTL", () => {
  root.style.width = "180px";
  const chip = fixture(
    chipMarkup({ label: "A very long location name in a narrow view" })
  );
  const label = chip.querySelector(".ag-chip__label");
  const icon = chip.querySelector(".ag-chip__icon");
  const remove = chip.querySelector("button");
  expect(bounds(chip).width).to.be.at.most(180);
  expect(getComputedStyle(label).textOverflow).to.equal("ellipsis");
  expect(label.scrollWidth).to.be.greaterThan(label.clientWidth);
  expect(bounds(icon).right).to.be.at.most(bounds(label).left);
  chip.dir = "rtl";
  expect(bounds(icon).left).to.be.at.least(bounds(label).right);
  expect(bounds(remove).right).to.be.at.most(bounds(label).left);
  expect(bounds(chip).width).to.be.at.most(180);
});

it("honours theme overrides, hidden children and chips without a remove button", () => {
  const chip = fixture(chipMarkup());
  chip.style.setProperty("--onSurfaceAlt", "rgb(12, 34, 56)");
  chip.style.setProperty("--surface", "rgb(210, 220, 230)");
  expect(getComputedStyle(chip).backgroundColor).to.equal("rgb(12, 34, 56)");
  expect(getComputedStyle(chip).color).to.equal("rgb(210, 220, 230)");
  chip.dataset.variant = "outlined";
  expect(getComputedStyle(chip).backgroundColor).to.equal("rgba(0, 0, 0, 0)");
  expect(getComputedStyle(chip).color).to.equal("rgb(12, 34, 56)");
  const width = bounds(chip).width;
  chip.querySelector("button").hidden = true;
  expect(getComputedStyle(chip.querySelector("button")).display).to.equal(
    "none"
  );
  expect(bounds(chip).width).to.be.lessThan(width);
  chip.hidden = true;
  expect(getComputedStyle(chip).display).to.equal("none");
  const readOnly = fixture(chipMarkup({ removable: false }));
  expect(readOnly.querySelector("button")).to.equal(null);
  expect(readOnly.tabIndex).to.equal(-1);
});
