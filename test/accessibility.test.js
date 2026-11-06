import { expect } from "@esm-bundle/chai";
import {
  sendKeys,
  sendMouse,
  emulateMedia,
  setViewport,
} from "@web/test-runner-commands";
import { enhancePaginator } from "../src/main.ts";
import { notificationMarkup } from "../src/indicate/Notification/fixtures/createNotification.ts";

let host;
const css = (el, pseudo) => getComputedStyle(el, pseudo);
const luminance = (color) => {
  const channels = color
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number)
    .map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return channels.reduce(
    (sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i],
    0
  );
};
const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => a - b
  );
  return (values[1] + 0.05) / (values[0] + 0.05);
};
before(async () => {
  const sheet = document.createElement("link");
  sheet.rel = "stylesheet";
  sheet.href = "/afterglow.css";
  const loaded = new Promise((resolve, reject) => {
    sheet.onload = resolve;
    sheet.onerror = reject;
  });
  document.head.append(sheet);
  await loaded;
});
beforeEach(async () => {
  await setViewport({ width: 800, height: 600 });
  host = document.createElement("section");
  host.className = "ag-body";
  host.style.cssText = "padding:24px;background:white";
  document.body.append(host);
});
afterEach(() => host.remove());

it("keeps default field hints, success feedback and control boundaries legible", () => {
  host.innerHTML = `<div class="ag-text-field" data-status="success">
    <div class="ag-text-field__control"><input class="ag-text-field__input" placeholder="Example" aria-label="Name"></div>
    <p class="ag-text-field__hint">Saved</p></div>`;
  const control = host.querySelector(".ag-text-field__control");
  const background = css(control).backgroundColor;
  expect(
    contrast(
      css(host.querySelector("input"), "::placeholder").color,
      background
    )
  ).to.be.at.least(4.5);
  expect(
    contrast(css(host.querySelector("p")).color, background)
  ).to.be.at.least(4.5);
  host.firstElementChild.removeAttribute("data-status");
  expect(contrast(css(control).borderTopColor, background)).to.be.at.least(3);
});

it("maintains readable notification text for all default variants", () => {
  for (const variant of ["default", "success", "alert", "caution"]) {
    host.innerHTML = notificationMarkup(
      "contrast-notice",
      variant,
      undefined,
      false
    );
    const style = css(host.firstElementChild);
    expect(
      contrast(style.color, style.backgroundColor),
      variant
    ).to.be.at.least(4.5);
  }
});

it("maintains readable text at the lightest point of the default backdrop", () => {
  host.className = "ag-background";
  host.style.removeProperty("background");
  host.innerHTML =
    '<div class="ag-text-field" data-variant="backdrop"><div class="ag-text-field__control"><input class="ag-text-field__input" placeholder="Location" aria-label="Location"></div></div>';
  const probe = document.createElement("span");
  probe.style.color = "var(--backdrop-light)";
  host.append(probe);
  const backdrop = css(probe).color;
  expect(contrast(css(host).color, backdrop)).to.be.at.least(4.5);
  const rgb = backdrop
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
  const fieldBackground = `rgb(${rgb.map((value) => value * 0.85).join(",")})`;
  expect(
    contrast(
      css(host.querySelector("input"), "::placeholder").color,
      fieldBackground
    )
  ).to.be.at.least(4.5);
});

it("keeps progress captions legible without using the pale caution fill as text", () => {
  for (const variant of ["default", "error", "caution"]) {
    host.innerHTML = `<div class="ag-progress" data-variant="${variant}"><progress class="ag-progress__bar" value="40" max="100"></progress><span class="ag-progress__label">Loading</span></div>`;
    expect(
      contrast(css(host.querySelector("span")).color, "rgb(255, 255, 255)"),
      variant
    ).to.be.at.least(4.5);
  }
});

it("keeps primary-button hover text and keyboard focus visible", async () => {
  host.innerHTML =
    '<button class="ag-button" data-variant="primary">Continue</button>';
  const button = host.firstElementChild;
  const box = button.getBoundingClientRect();
  await sendMouse({
    type: "move",
    position: [Math.round(box.x + 5), Math.round(box.y + 5)],
  });
  expect(
    contrast(css(button).color, css(button).backgroundColor)
  ).to.be.at.least(4.5);
  button.setAttribute("data-dangerous", "");
  expect(
    contrast(css(button).color, css(button).backgroundColor)
  ).to.be.at.least(4.5);
  button.focus();
  await sendKeys({ press: "Tab" });
  button.focus();
  expect(
    contrast(css(button).outlineColor, css(host).backgroundColor)
  ).to.be.at.least(3);
  await emulateMedia({ forcedColors: "active" });
  try {
    expect(css(button).outlineStyle).to.equal("solid");
    expect(parseFloat(css(button).outlineWidth)).to.be.at.least(2);
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});

it("scales typography and compact controls without clipping at 200% text size", () => {
  const original = document.documentElement.style.fontSize;
  host.style.width = "320px";
  host.innerHTML = `<button class="ag-button">A long action label that must wrap when text grows</button>
    <span class="ag-tag"><span class="ag-tag__label">Example</span></span>
    <button class="ag-menu-item"><span class="ag-menu-item__label">A navigation label</span></button>
    <div class="ag-text-field" data-compact><div class="ag-text-field__control"><input class="ag-text-field__input" aria-label="Name" value="Example"></div></div>
    <nav class="ag-paginator"></nav>`;
  const controller = enhancePaginator(host.querySelector("nav"), {
    pageCount: 12,
    page: 7,
  });
  const elements = [
    ...host.querySelectorAll(
      ".ag-button,.ag-tag,.ag-menu-item,.ag-text-field__input,.ag-paginator__item"
    ),
  ];
  const sizes = elements.map((el) => parseFloat(css(el).fontSize));
  try {
    document.documentElement.style.fontSize = `${
      parseFloat(css(document.documentElement).fontSize) * 2
    }px`;
    elements.forEach((el, i) => {
      expect(parseFloat(css(el).fontSize)).to.be.closeTo(sizes[i] * 2, 0.05);
      expect(el.getBoundingClientRect().height).to.be.at.least(
        parseFloat(css(el).fontSize)
      );
      if (el.textContent) {
        const text = document.createRange();
        text.selectNodeContents(el);
        expect(text.getBoundingClientRect().height, el.className).to.be.at.most(
          el.clientHeight + 1
        );
      }
    });
    expect(host.scrollWidth).to.be.at.most(host.clientWidth);
    const selected = host.querySelector('[aria-current="page"]');
    expect(parseFloat(css(selected, "::before").height)).to.be.greaterThan(40);
  } finally {
    document.documentElement.style.fontSize = original;
    controller.destroy();
  }
});

it("contains modal scrolling without changing the document's overflow", () => {
  const before = css(document.documentElement).overflow;
  host.innerHTML =
    '<dialog class="ag-dialog" aria-label="Details"><p>Content</p></dialog>';
  const dialog = host.firstElementChild;
  dialog.showModal();
  expect(css(dialog).overscrollBehaviorY).to.equal("contain");
  expect(css(dialog, "::backdrop").overflow).to.equal("hidden");
  expect(css(dialog, "::backdrop").overscrollBehaviorY).to.equal("contain");
  expect(css(document.documentElement).overflow).to.equal(before);
  dialog.close();
});
