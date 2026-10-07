import { expect } from "@esm-bundle/chai";
import { emulateMedia, sendKeys } from "@web/test-runner-commands";
import { FilterField } from "../src/present/Tag/tag.stories.ts";

let root;
const style = (element) => getComputedStyle(element);
const tag = (text = "John", attributes = "") =>
  `<span class="ag-tag" ${attributes}><span class="ag-tag__label">${text}</span></span>`;

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
  await document.fonts.load("400 12px Lato");
});
beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
});
afterEach(() => root.remove());

it("matches the compact geometry and two full-strength appearances", () => {
  root.innerHTML = tag() + tag("John", 'data-variant="backdrop"');
  const tags = [...root.children];
  for (const item of tags) {
    expect(item.getBoundingClientRect().width).to.equal(64);
    expect(item.getBoundingClientRect().height).to.equal(24);
    expect(style(item).borderRadius).to.equal("12px");
    expect(parseFloat(style(item).fontSize)).to.be.closeTo(11.111, 0.01);
    expect(item.tabIndex).to.equal(-1);
  }
  expect(style(tags[0]).backgroundColor).to.equal("rgb(0, 118, 147)");
  expect(style(tags[1]).backgroundColor).to.equal("rgb(232, 201, 200)");
  expect(style(tags[0]).color).to.equal("rgb(243, 238, 230)");
  expect(style(tags[1]).color).to.equal("rgb(83, 83, 74)");
});

it("keeps native action buttons keyboard accessible and honours disabled", async () => {
  root.innerHTML =
    '<button class="ag-tag" type="button"><span class="ag-tag__label">Design</span></button>';
  const button = root.firstElementChild;
  let activations = 0;
  button.onclick = () => activations++;
  button.focus();
  await sendKeys({ press: "Enter" });
  await sendKeys({ press: "Space" });
  expect(activations).to.equal(2);
  expect(style(button).outlineStyle).to.equal("solid");
  button.disabled = true;
  button.click();
  expect(activations).to.equal(2);
  expect(style(button).opacity).to.equal("0.5");
});

it("fits narrow and RTL layouts, inherits theme colours, and honours hidden", () => {
  root.style.width = "100px";
  root.dir = "rtl";
  root.style.setProperty("--ctrl-fill-solid", "rgb(10, 20, 30)");
  root.innerHTML = tag("A much longer category label");
  const item = root.firstElementChild;
  expect(item.getBoundingClientRect().width).to.equal(100);
  expect(style(item).direction).to.equal("rtl");
  expect(style(item).backgroundColor).to.equal("rgb(10, 20, 30)");
  expect(style(item.firstElementChild).textOverflow).to.equal("ellipsis");
  root.style.width = "40px";
  expect(item.getBoundingClientRect().width).to.equal(40);
  item.hidden = true;
  expect(item.getBoundingClientRect().height).to.equal(0);
});

it("composes applied filter values and editable text in the field example", () => {
  const form = FilterField();
  root.append(form);
  const search = form.querySelector('input[type="search"]');
  search.value = "Workshop";
  expect(
    form.querySelectorAll('input[type="checkbox"], input[type="radio"]')
  ).to.have.length(0);
  const data = new FormData(form);
  expect(data.getAll("category")).to.deep.equal(["Design", "Research"]);
  expect(data.get("query")).to.equal("Workshop");
  form.requestSubmit();
  expect(form.querySelector("output").textContent).to.equal(
    "Search: Workshop; categories: Design, Research."
  );
  expect(search.labels[0].textContent).to.equal("Search notes");
});

it("retains readable colours and keyboard focus on both surfaces in forced colours", async () => {
  root.innerHTML =
    '<button class="ag-tag" type="button">Default</button><button class="ag-tag" type="button" data-variant="backdrop">Backdrop</button>';
  await emulateMedia({ forcedColors: "active" });
  try {
    const tags = [...root.children];
    expect(style(tags[0]).backgroundColor).to.equal(
      style(tags[1]).backgroundColor
    );
    expect(style(tags[0]).color).to.equal(style(tags[1]).color);
    for (const item of tags) {
      item.focus();
      await sendKeys({ press: "Space" });
      expect(style(item).outlineStyle).to.equal("solid");
      expect(style(item).outlineOffset).to.equal("2px");
    }
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});
