import { createButton } from "../src/interact/Button/fixtures/createButton.ts";
import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse, setViewport } from "@web/test-runner-commands";

let root;
const style = (element) => getComputedStyle(element);
const bodySize = () =>
  parseFloat(style(root).getPropertyValue("--body-text-size"));
const bounds = (element) => element.getBoundingClientRect();
const settle = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const fixture = (markup) => {
  root.innerHTML = markup;
  return root.firstElementChild;
};
const field = (attributes = "") => `<div class="ag-textarea-field">
  <textarea class="ag-textarea" id="notes" name="notes" placeholder=" " ${attributes}></textarea>
  <label class="ag-textarea-field__label" for="notes">Notes</label>
</div>`;

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
  await setViewport({ width: 1200, height: 800 });
  root = document.createElement("div");
  document.body.append(root);
  await sendMouse({ type: "move", position: [0, 0] });
});
afterEach(() => root.remove());

it("keeps theme defaults and native hidden when loading individual categories", async () => {
  const categories = {
    frame: ["ag-panel", "ag-appframe", "ag-dialog"],
    interact: [
      "ag-button",
      "ag-checkbox",
      "ag-radio",
      "ag-switch",
      "ag-slider",
      "ag-textarea",
      "ag-chip",
    ],
    indicate: ["ag-notification", "ag-progress", "ag-progress__bar"],
    present: ["ag-article", "ag-card-content", "ag-icon", "ag-image", "ag-tag"],
  };
  for (const [category, classes] of Object.entries(categories)) {
    const frame = document.createElement("iframe");
    const loaded = new Promise((resolve) => {
      frame.onload = resolve;
    });
    frame.srcdoc = `<link rel="stylesheet" href="/afterglow-${category}.css">${classes
      .map((name) => `<div class="${name}" hidden></div>`)
      .join("")}`;
    root.append(frame);
    await loaded;
    const view = frame.contentWindow;
    for (const element of frame.contentDocument.body.children) {
      expect(
        view.getComputedStyle(element).display,
        element.className
      ).to.equal("none");
    }
    expect(
      view
        .getComputedStyle(frame.contentDocument.documentElement)
        .getPropertyValue("--panel")
        .trim()
    ).to.equal("#f9f9f6");
    frame.remove();
  }
});

it("keeps textarea labels, keyboard editing, validation and form reset native", async () => {
  const form = fixture(
    `<form style="width:343px">${field(
      "required"
    )}<button type="reset">Reset</button></form>`
  );
  const input = form.querySelector("textarea");
  const label = form.querySelector("label");
  expect(input).to.be.instanceOf(HTMLTextAreaElement);
  expect(input.labels[0] === label).to.equal(true);
  expect(input.validity.valueMissing).to.equal(true);
  const box = bounds(label);
  await sendMouse({ type: "click", position: [box.x + 5, box.y + 5] });
  expect(document.activeElement === input).to.equal(true);
  await sendKeys({ type: "A note" });
  expect(new FormData(form).get("notes")).to.equal("A note");
  expect(input.validity.valid).to.equal(true);
  form.querySelector("button").click();
  expect(input.value).to.equal("");
  expect(input.validity.valueMissing).to.equal(true);
});

it("matches the textarea treatment and floats its label after property writes and reset", async () => {
  const form = fixture(`<form style="width:343px">${field()}</form>`);
  const input = form.querySelector("textarea");
  const label = form.querySelector("label");
  expect(bounds(input).width).to.equal(343);
  expect(bounds(input).height).to.equal(158);
  expect(style(input).backgroundColor).to.equal("rgb(255, 255, 255)");
  expect(style(input).borderTopColor).to.equal("rgba(94, 140, 151, 0.5)");
  expect(style(input).paddingTop).to.equal("16px");
  expect(parseFloat(style(label).fontSize)).to.equal(bodySize());
  input.value = "Programmatically populated";
  await settle();
  expect(parseFloat(style(label).fontSize)).to.be.closeTo(
    bodySize() / 1.2,
    0.02
  );
  expect(parseFloat(style(input).paddingTop)).to.be.greaterThan(40);
  form.reset();
  expect(parseFloat(style(label).fontSize)).to.equal(bodySize());
});

it("respects native read-only and disabled textarea behaviour", async () => {
  const form = fixture(
    `<form>${field(
      "readonly"
    )}<textarea class="ag-textarea" name="disabled" disabled>Excluded</textarea></form>`
  );
  const input = form.querySelector("textarea");
  input.value = "Copyable";
  input.focus();
  await sendKeys({ type: "Changed" });
  expect(input.value).to.equal("Copyable");
  expect(new FormData(form).get("notes")).to.equal("Copyable");
  expect(new FormData(form).has("disabled")).to.equal(false);
  expect(style(form.querySelector("[disabled]")).opacity).to.equal("0.5");
});

it("uses local colour and type tokens in new recipes", () => {
  const theme =
    fixture(`<section class="ag-theme" style="--paper:rgb(10,20,30);--surface:rgb(40,50,60);--body-text-size:24px;--onSurfaceAlt:rgb(70,80,90)">
    ${field()}<article class="ag-article"><h1>Heading</h1></article>
  </section>`);
  expect(style(theme.querySelector("textarea")).backgroundColor).to.equal(
    "rgb(10, 20, 30)"
  );
  expect(style(theme.querySelector("textarea")).boxShadow).to.include(
    "rgb(40, 50, 60)"
  );
  expect(style(theme.querySelector("label")).fontSize).to.equal("24px");
  expect(parseFloat(style(theme.querySelector("h1")).fontSize)).to.be.closeTo(
    24 * 1.2 ** 5,
    0.05
  );
  expect(style(theme.querySelector("h1")).color).to.equal("rgb(70, 80, 90)");
});

it("styles current navigation through aria-current and retains native keyboard activation", async () => {
  const nav =
    fixture(`<nav class="ag-location-index" aria-label="Notebook"><ul class="ag-location-index__list">
    <li><a href="#notes" class="ag-location-index__link" aria-current="page">Notes</a></li>
    <li><a href="#shared" class="ag-location-index__link">Shared</a></li>
  </ul></nav>`);
  const [current, next] = nav.querySelectorAll("a");
  expect(style(current).color).to.equal("rgb(0, 118, 147)");
  expect(style(current).backgroundColor).to.equal("rgba(110, 163, 176, 0.2)");
  expect(style(current).borderRadius).to.equal("4px");
  expect(style(next).borderRadius).to.equal("8px");
  let activated = false;
  next.addEventListener("click", (event) => {
    event.preventDefault();
    activated = true;
  });
  current.focus();
  await sendKeys({ press: "Tab" });
  // Safari's macOS preference can skip links/buttons in the Tab order. Enter
  // keyboard modality, then focus explicitly to test native activation/focus.
  next.focus();
  expect(document.activeElement === next).to.equal(true);
  await sendKeys({ press: "Enter" });
  expect(activated).to.equal(true);
  expect(style(next).outlineStyle).to.equal("solid");
  expect(style(next).outlineWidth).to.equal("2px");
  current.setAttribute("aria-current", "false");
  expect(style(current).color).to.equal("rgb(83, 83, 74)");
});

it("makes the FAB a native 56px button with keyboard and disabled behaviour", async () => {
  fixture(
    '<button type="button" id="before">Before</button><button type="button" class="ag-fab" aria-label="Add note"><span class="ag-fab__icon" data-icon="add" aria-hidden="true"></span></button>'
  );
  const button = root.querySelector(".ag-fab");
  expect(bounds(button).width).to.equal(56);
  expect(bounds(button).height).to.equal(56);
  expect(bounds(button.firstElementChild).width).to.equal(24);
  expect(bounds(button.firstElementChild).left - bounds(button).left).to.equal(
    16
  );
  expect(style(button).borderTopWidth).to.equal("0px");
  const rim = getComputedStyle(button, "::after");
  expect(rim.borderTopWidth).to.equal("1px");
  expect(rim.borderTopColor).to.equal("rgba(224, 224, 224, 0.19)");
  expect(rim.pointerEvents).to.equal("none");
  let clicks = 0;
  button.addEventListener("click", () => clicks++);
  root.querySelector("#before").focus();
  await sendKeys({ press: "Tab" });
  button.focus();
  expect(document.activeElement === button).to.equal(true);
  await sendKeys({ press: "Enter" });
  await sendKeys({ press: "Space" });
  expect(clicks).to.equal(2);
  expect(style(button).outlineWidth).to.equal("2px");
  button.disabled = true;
  button.click();
  expect(clicks).to.equal(2);
});

it("serves the exported navigation and FAB assets used by CSS", async () => {
  for (const path of ["navigation/shared", "button/add"]) {
    const response = await fetch(`/assets/${path}.svg`);
    expect(response.ok).to.equal(true);
    expect(await response.text()).to.include("<svg");
  }
  const icon = fixture(
    '<span class="ag-location-index__icon" data-icon="shared"></span>'
  );
  expect(style(icon).maskImage).to.include("assets/navigation/shared.svg");
  expect(bounds(icon).width).to.equal(16);
  expect(bounds(icon).height).to.equal(16);
});

it("scopes article typography without restyling headings in embedded components", () => {
  fixture(
    `<article class="ag-article"><h1>Article title</h1><p>Body copy.</p><section><h1 id="embedded">Embedded title</h1><textarea class="ag-textarea"></textarea></section></article><h1 id="outside">Outside title</h1>`
  );
  const article = root.querySelector("article");
  expect(style(article.firstElementChild).fontWeight).to.equal("300");
  expect(parseFloat(style(article.firstElementChild).fontSize)).to.be.closeTo(
    bodySize() * 1.2 ** 5,
    0.05
  );
  expect(parseFloat(style(article.querySelector("p")).lineHeight)).to.equal(
    bodySize() * 1.5
  );
  expect(style(root.querySelector("#embedded")).fontWeight).to.equal(
    style(root.querySelector("#outside")).fontWeight
  );
  expect(
    parseFloat(style(article.querySelector("textarea")).fontSize)
  ).to.equal(bodySize());
});

it("lets card content determine height and composes existing surface colours", () => {
  const card = fixture(
    `<article class="ag-card-content ag-paper" style="width:311px"><p class="ag-card-content__overline">Overline</p><div class="ag-card-content__main"><h2 class="ag-card-content__title">Card title</h2><div class="ag-card-content__body"><p>Description</p></div></div><footer class="ag-card-content__actions"><button type="button" class="ag-button" data-variant="flat">Open</button></footer></article>`
  );
  const overline = card.querySelector(".ag-card-content__overline");
  const main = card.querySelector(".ag-card-content__main");
  const title = card.querySelector("h2");
  const body = card.querySelector(".ag-card-content__body");
  const actions = card.querySelector(".ag-card-content__actions");
  const button = card.querySelector("button");
  const height = bounds(card).height;
  expect(bounds(overline).top - bounds(card).top).to.equal(8);
  expect(bounds(main).top - bounds(overline).bottom).to.equal(4);
  expect(bounds(body).top - bounds(title).bottom).to.equal(6);
  expect(bounds(actions).top - bounds(main).bottom).to.equal(4);
  expect(bounds(card).bottom - bounds(actions).bottom).to.equal(8);
  expect(bounds(title).left - bounds(card).left).to.equal(14);
  expect(style(button).fontWeight).to.equal("700");
  expect(parseFloat(style(button).fontSize)).to.be.closeTo(
    bodySize() / 1.2,
    0.02
  );
  expect(style(card).backgroundColor).to.equal("rgb(255, 255, 255)");
  expect(parseFloat(style(card.querySelector("h2")).fontSize)).to.be.closeTo(
    bodySize() * 1.2 ** 4,
    0.02
  );
  card.querySelector(".ag-card-content__body p").textContent =
    "A longer description that wraps across several lines. ".repeat(10);
  expect(bounds(card).height).to.be.greaterThan(height);
  card.style.width = "180px";
  button.textContent = "A very long action label that must fit inside the card";
  expect(card.scrollWidth).to.equal(card.clientWidth);
  title.hidden = true;
  body.hidden = true;
  expect(style(main).display).to.equal("none");
  expect(bounds(actions).top - bounds(overline).bottom).to.equal(4);
  button.hidden = true;
  expect(style(actions).display).to.equal("none");
  expect(bounds(card).height).to.equal(bounds(overline).height + 16);
});

const application = () =>
  fixture(`<div class="ag-appframe" data-layout="application">
  <header class="ag-appframe__header">Header</header><nav class="ag-appframe__nav">Navigation</nav>
  <main class="ag-appframe__main">Content</main><aside class="ag-appframe__tools">Tools</aside>
</div>`);

it("arranges application regions on desktop and releases absent side columns", () => {
  const app = application();
  const [header, nav, main, tools] = app.children;
  expect(bounds(header).width).to.equal(bounds(app).width);
  expect(bounds(main).x).to.be.greaterThan(bounds(nav).right);
  expect(bounds(tools).x).to.be.greaterThan(bounds(main).right);
  nav.hidden = true;
  tools.remove();
  expect(bounds(main).width).to.equal(bounds(app).width);
  expect(bounds(main).x).to.equal(bounds(app).x);
});

it("stacks application and master-detail regions on narrow screens without overflow", async () => {
  await setViewport({ width: 375, height: 800 });
  const app = application();
  const [, nav, main, tools] = app.children;
  expect(bounds(main).y).to.be.greaterThan(bounds(nav).bottom);
  expect(bounds(tools).y).to.be.greaterThan(bounds(main).bottom);
  expect(app.scrollWidth).to.equal(app.clientWidth);
  const master = document.createElement("div");
  master.className = "ag-master-detail";
  master.innerHTML =
    '<aside class="ag-master-detail__master">Master</aside><main class="ag-master-detail__detail">Detail</main><footer class="ag-master-detail__aux">Auxiliary</footer>';
  root.append(master);
  expect(bounds(master.children[1]).y).to.be.greaterThan(
    bounds(master.children[0]).bottom
  );
  expect(bounds(master.children[2]).y).to.be.greaterThan(
    bounds(master.children[1]).bottom
  );
  expect(master.scrollWidth).to.equal(master.clientWidth);
});

it("supports explicit vertical master-detail layout inside a desktop view", () => {
  const layout = fixture(
    '<div class="ag-master-detail"><aside class="ag-master-detail__master">Master</aside><main class="ag-master-detail__detail">Detail</main></div>'
  );
  expect(bounds(layout.children[1]).x).to.be.greaterThan(
    bounds(layout.children[0]).right
  );
  layout.dataset.orientation = "vertical";
  expect(bounds(layout.children[1]).y).to.be.greaterThan(
    bounds(layout.children[0]).bottom
  );
  expect(bounds(layout.children[1]).width).to.equal(bounds(layout).width);
});

it("preserves hidden on all new top-level recipes", () => {
  for (const className of [
    "ag-textarea",
    "ag-textarea-field",
    "ag-location-index",
    "ag-fab",
    "ag-article",
    "ag-card-content",
    "ag-card",
    "ag-master-detail",
  ]) {
    const element = fixture(`<div class="${className}" hidden></div>`);
    expect(style(element).display, className).to.equal("none");
  }
});

it("contains backdrop text shadows at surfaces and cards, including nested backdrops", () => {
  const backdrop = fixture(`<section class="ag-background">
    <h2>Backdrop heading</h2><p>Backdrop <span>text</span></p>
    ${["ag-surface", "ag-panel", "ag-paper", "ag-card", "ag-card-content"]
      .map(
        (name) =>
          `<div class="${name}"><p>Surface <span>text</span></p><section class="ag-background"><p>Nested backdrop</p></section></div>`
      )
      .join("")}
  </section>`);
  expect(style(backdrop.querySelector("h2")).textShadow).not.to.equal("none");
  expect(style(backdrop.querySelector("p span")).textShadow).not.to.equal(
    "none"
  );
  for (const surface of backdrop.querySelectorAll(":scope > div")) {
    expect(
      style(surface.querySelector("p span")).textShadow,
      surface.className
    ).to.equal("none");
    expect(
      style(surface.querySelector(":scope > .ag-background > p")).textShadow
    ).not.to.equal("none");
  }
});

it("uses an independent danger colour for every button variant and keeps native disabling", async () => {
  root.style.setProperty("--error", "rgb(1, 2, 3)");
  root.style.setProperty("--danger", "rgb(180, 30, 60)");
  root.style.setProperty("--on-danger", "rgb(255, 255, 255)");
  for (const variant of ["default", "flat", "outline", "primary"]) {
    const button = createButton({ variant, dangerous: true });
    root.append(button);
    const assertDanger = () => {
      expect(style(button).color, variant).to.equal(
        variant === "primary" ? "rgb(255, 255, 255)" : "rgb(180, 30, 60)"
      );
      if (variant === "primary")
        expect(style(button).backgroundColor).to.equal("rgb(180, 30, 60)");
    };
    assertDanger();
    const box = bounds(button);
    await sendMouse({ type: "move", position: [box.x + 5, box.y + 5] });
    assertDanger();
    await sendMouse({ type: "down" });
    assertDanger();
    await sendMouse({ type: "up" });
    button.disabled = true;
    assertDanger();
    expect(style(button).opacity).to.equal("0.5");
    let clicked = false;
    button.onclick = () => {
      clicked = true;
    };
    button.click();
    expect(clicked).to.equal(false);
    button.disabled = false;
    button.toggleAttribute("data-dangerous", false);
    expect(style(button).color).not.to.equal("rgb(180, 30, 60)");
    button.remove();
  }
  expect(
    createButton({ dangerous: false }).hasAttribute("data-dangerous")
  ).to.equal(false);
});
