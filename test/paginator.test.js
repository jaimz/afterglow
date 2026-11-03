import { expect } from "@esm-bundle/chai";
import { sendKeys, setViewport } from "@web/test-runner-commands";
import { enhancePaginator } from "../src/behaviors/paginator.ts";

let root, controller;
const selected = () => root.querySelector('[aria-current="page"]');
const button = key => root.querySelector(`[data-paginator-key="${key}"]`);
before(async () => {
  const css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "/afterglow.css";
  const ready = new Promise((resolve, reject) => { css.onload = resolve; css.onerror = reject; });
  document.head.append(css); await ready;
});
beforeEach(async () => {
  await setViewport({ width: 800, height: 600 });
  root = document.createElement("nav"); root.className = "ag-paginator";
  document.body.append(root);
  controller = enhancePaginator(root, { pageCount: 12, page: 7 });
});
afterEach(() => { controller.destroy(); root.remove(); });

it("renders the reference page window, accessible selection and exact local artwork", async () => {
  expect([...root.querySelectorAll("li")].map(li => li.textContent)).to.deep.equal(["1", "…", "5", "6", "7", "8", "9", "…", "12"]);
  expect(root.getAttribute("aria-label")).to.equal("Pagination");
  expect(selected().getAttribute("aria-label")).to.equal("Page 7");
  expect(root.querySelectorAll('[aria-current="page"]').length).to.equal(1);
  expect(root.querySelectorAll('.ag-paginator__ellipsis[aria-hidden="true"]').length).to.equal(2);
  expect(parseFloat(getComputedStyle(root).fontSize)).to.be.closeTo(13.33, 0.01);
  expect(root.getBoundingClientRect().width).to.equal(347);
  const marker = getComputedStyle(selected(), "::before");
  expect(marker.backgroundImage).to.include("/assets/paginator/selected.svg");
  expect(marker.width).to.equal("28px"); expect(marker.height).to.equal("28px");
  const image = new Image(); image.src = "/assets/paginator/selected.svg"; await image.decode();
  expect(image.naturalWidth).to.equal(28); expect(image.naturalHeight).to.equal(28);
});

it("changes pages through native keyboard activation, retaining focus and announcing once", async () => {
  const changes = [];
  root.addEventListener("ag-page-change", event => changes.push(event.detail));
  button("page-8").focus(); await sendKeys({ press: "Enter" });
  expect(controller.page).to.equal(8);
  expect(document.activeElement === selected()).to.equal(true);
  expect(changes).to.deep.equal([{ page: 8, pageCount: 12 }]);
  expect(root.querySelector('[role="status"]').textContent).to.equal("Page 8 of 12");
  selected().click(); expect(changes.length).to.equal(1);
  controller.update({ page: 6 }); expect(changes.length).to.equal(1);
});

it("disables boundary navigation and keeps focus usable when the activated control becomes disabled", async () => {
  controller.update({ variant: "prev-next", pageCount: 5, page: 2 });
  button("previous").focus(); await sendKeys({ press: "Space" });
  expect(controller.page).to.equal(1); expect(button("previous").disabled).to.equal(true);
  expect(document.activeElement === selected()).to.equal(true);
  button("previous").click(); expect(controller.page).to.equal(1);
  controller.update({ page: 5 });
  expect(button("next").disabled).to.equal(true);
  button("next").click(); expect(controller.page).to.equal(5);
});

it("clamps updates, supports empty and single-page results, and rejects invalid input atomically", () => {
  controller.update({ pageCount: 3 }); expect(controller.page).to.equal(3);
  controller.update({ page: -1 }); expect(controller.page).to.equal(1);
  expect(() => controller.update({ pageCount: -1 })).to.throw(RangeError);
  expect(() => controller.update({ page: 1.5 })).to.throw(RangeError);
  expect(controller.pageCount).to.equal(3);
  controller.update({ pageCount: 0, variant: "prev-next" });
  expect(controller.page).to.equal(0); expect(selected()).to.equal(null);
  expect(button("previous").disabled && button("next").disabled).to.equal(true);
  controller.update({ pageCount: 1 });
  expect(controller.page).to.equal(1);
  expect(button("previous").disabled && button("next").disabled).to.equal(true);
});

it("bounds large page lists and follows writing direction without overflow", () => {
  controller.update({ pageCount: 1000000, page: 500000 });
  expect(root.querySelectorAll("li").length).to.be.at.most(9);
  root.dir = "rtl"; root.style.width = "220px";
  expect(root.scrollWidth).to.equal(root.clientWidth);
  expect(button("page-1").getBoundingClientRect().left).to.be.greaterThan(button("page-1000000").getBoundingClientRect().left);
});

it("restores authored content and labels, supports localization and repeated enhancement", () => {
  controller.destroy();
  const original = document.createElement("a"); original.href = "?page=1"; original.textContent = "Page one";
  root.append(original); root.setAttribute("aria-label", "Results pages");
  controller = enhancePaginator(root, { pageCount: 5, page: 3, variant: "prev-next", previousLabel: "Previous", pageLabel: n => `Result page ${n}` });
  expect(enhancePaginator(root, { pageCount: 99 }) === controller).to.equal(true);
  expect(selected().getAttribute("aria-label")).to.equal("Result page 3");
  expect(button("previous").textContent).to.equal("Previous");
  controller.destroy();
  expect(root.firstChild === original).to.equal(true);
  expect(root.getAttribute("aria-label")).to.equal("Results pages");
  expect(root.querySelector("button")).to.equal(null);
});
