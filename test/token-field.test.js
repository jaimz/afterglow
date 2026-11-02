import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse, setViewport } from "@web/test-runner-commands";
import { enhanceTokenField } from "../src/main.ts";

const items = [
  {
    value: "ada@example.com",
    label: "Ada Lovelace",
    description: "Mathematics",
  },
  { value: "alan@example.com", label: "Alan Turing" },
  { value: "alice@example.com", label: "Alice Ball" },
  { value: "grace@example.com", label: "Grace Hopper" },
];
let host, cleanup;
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));
const focusIs = (el) => expect(document.activeElement === el).to.equal(true);
function fixture(options = {}, attrs = "") {
  host.innerHTML = `<form><label for="recipients">To</label><div class="ag-token-field ag-text-field" style="width:400px"><div class="ag-text-field__control"><input class="ag-text-field__input" id="recipients" type="text" name="recipients" ${attrs}></div></div><button type="submit">Send</button><button type="reset">Reset</button></form>`;
  const root = host.querySelector(".ag-token-field"),
    input = root.querySelector("input"),
    form = host.querySelector("form");
  const controller = enhanceTokenField(root, { items, ...options });
  cleanup.push(() => controller.destroy());
  const popup = root.querySelector('[role="listbox"]');
  return { root, input, form, controller, popup };
}
const query = (input, value) => {
  input.focus();
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const insertionIndex = (input) =>
  Array.from(input.parentElement.children)
    .slice(0, Array.from(input.parentElement.children).indexOf(input))
    .filter((el) => el.matches(".ag-chip")).length;
const click = async (el) => {
  const r = el.getBoundingClientRect();
  await sendMouse({
    type: "click",
    position: [
      Math.round(r.left + r.width / 2),
      Math.round(r.top + r.height / 2),
    ],
  });
  await settle();
};
const clickAt = async (x, y) => {
  await sendMouse({ type: "click", position: [Math.round(x), Math.round(y)] });
  await settle();
};
before(async () => {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/afterglow.css";
  const ready = new Promise((resolve, reject) => {
    css.onload = resolve;
    css.onerror = reject;
  });
  document.head.append(css);
  await ready;
});
beforeEach(async () => {
  await setViewport({ width: 800, height: 600 });
  host = document.createElement("div");
  host.style.padding = "24px";
  document.body.append(host);
  cleanup = [];
});
afterEach(() => {
  cleanup.reverse().forEach((fn) => fn());
  host.remove();
});

it("filters substrings case-insensitively, keeps input focus and selects consecutive avatar chips", async () => {
  const { input, popup, root, controller } = fixture();
  query(input, "a");
  expect(popup.children.length).to.equal(4);
  focusIs(input);
  expect(input.getAttribute("aria-activedescendant")).to.equal(
    popup.firstElementChild.id
  );
  await sendKeys({ press: "Enter" });
  expect(controller.values).to.deep.equal([items[0].value]);
  expect(input.value).to.equal("");
  focusIs(input);
  query(input, " AL ");
  expect(popup.children.length).to.equal(2);
  await sendKeys({ press: "ArrowDown" });
  await sendKeys({ press: "Enter" });
  expect(controller.values).to.deep.equal([items[0].value, items[2].value]);
  expect(
    root.querySelectorAll('.ag-chip[data-variant="avatar"]').length
  ).to.equal(2);
  expect(
    root.querySelector('.ag-avatar[data-shape="circle"] .ag-avatar__initials')
      .textContent
  ).to.equal("al");
  query(input, "ada@");
  expect(popup.matches(":popover-open")).to.equal(false);
  query(input, "ace");
  expect(popup.children.length).to.equal(1);
  expect(popup.firstElementChild.textContent).to.equal("Grace Hopper");
  expect(popup.matches(":popover-open")).to.equal(true);
  query(input, "unmatched");
  expect(popup.matches(":popover-open")).to.equal(false);
  expect(root.querySelector('[role="status"]').textContent).to.equal(
    "No matching items."
  );
});

it("matches middle and ending substrings in labels and values, excluding selected entries", async () => {
  const { input, popup, controller } = fixture();
  query(input, "  VEL  ");
  expect(popup.children.length).to.equal(1);
  await sendKeys({ press: "Tab" });
  expect(controller.values).to.deep.equal([items[0].value]);
  query(input, "  EXAMPLE.COM  ");
  expect(Array.from(popup.children, (el) => el.textContent)).to.deep.equal([
    "Alan Turing",
    "Alice Ball",
    "Grace Hopper",
  ]);
  query(input, "PPER");
  expect(popup.children.length).to.equal(1);
  await sendKeys({ press: "Enter" });
  expect(controller.values).to.deep.equal([items[0].value, items[3].value]);
});

it("filters long lists by partial numbers while retaining catalogue order", () => {
  const catalogue = Array.from({ length: 40 }, (_, i) => ({
    value: `team-${i + 1}`,
    label: `Team member ${i + 1}`,
  }));
  const { input, popup } = fixture({ items: catalogue });
  query(input, "2");
  expect(Array.from(popup.children, (el) => el.textContent)).to.deep.equal(
    [2, 12, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32].map(
      (n) => `Team member ${n}`
    )
  );
});

it("supports pointer selection without blurring the editor or accepting free text", async () => {
  const { input, popup, controller, form } = fixture();
  let submissions = 0;
  form.onsubmit = (e) => {
    e.preventDefault();
    submissions++;
  };
  query(input, "grace@");
  await click(popup.firstElementChild);
  focusIs(input);
  expect(controller.values).to.deep.equal([items[3].value]);
  query(input, "unknown");
  await sendKeys({ press: "Enter" });
  expect(submissions).to.equal(0);
  expect(controller.values.length).to.equal(1);
  query(input, "a");
  await sendKeys({ press: "Escape" });
  expect(popup.matches(":popover-open")).to.equal(false);
  expect(input.value).to.equal("a");
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await sendKeys({ press: "Tab" });
  await settle();
  expect(popup.matches(":popover-open")).to.equal(false);
});

it("completes the highlighted suggestion on Tab and keeps focus for the next token", async () => {
  const { input, popup, controller, form } = fixture();
  const changes = [];
  form.addEventListener("ag-token-change", (event) =>
    changes.push(event.detail)
  );
  query(input, "a");
  await sendKeys({ press: "ArrowDown" });
  await sendKeys({ press: "Tab" });
  expect(controller.values).to.deep.equal([items[1].value]);
  expect(new FormData(form).getAll("recipients")).to.deep.equal([
    items[1].value,
  ]);
  expect(changes.length).to.equal(1);
  expect(input.value).to.equal("");
  expect(popup.matches(":popover-open")).to.equal(false);
  expect(input.getAttribute("aria-expanded")).to.equal("false");
  expect(input.hasAttribute("aria-activedescendant")).to.equal(false);
  focusIs(input);

  query(input, "a");
  await sendKeys({ press: "Tab" });
  expect(controller.values).to.deep.equal([items[1].value, items[0].value]);
  focusIs(input);
});

it("leaves selection and query unchanged on Tab when the completion menu is closed", async () => {
  const { input, popup, controller, form } = fixture();
  const next = document.createElement("input");
  form.querySelector('[type="submit"]').before(next);
  for (const value of ["", "unknown", "a"]) {
    query(input, value);
    if (value === "a") await sendKeys({ press: "Escape" });
    expect(popup.matches(":popover-open")).to.equal(false);
    await sendKeys({ press: "Tab" });
    expect(controller.values).to.deep.equal([]);
    expect(input.value).to.equal(value);
    focusIs(next);
  }
});

it("keeps backward Tab navigation without completing the highlighted suggestion", async () => {
  const { input, popup, root, controller } = fixture();
  const previous = document.createElement("input");
  root.before(previous);
  query(input, "a");
  await sendKeys({ press: "Shift+Tab" });
  await settle();
  expect(controller.values).to.deep.equal([]);
  expect(input.value).to.equal("a");
  expect(popup.matches(":popover-open")).to.equal(false);
  focusIs(previous);
});

it("removes the preceding chip immediately on Backspace while normal Backspace edits text", async () => {
  const { root, input, controller } = fixture({
    values: [items[0].value, items[1].value],
  });
  query(input, "x");
  await sendKeys({ press: "Backspace" });
  expect(controller.values.length).to.equal(2);
  expect(input.value).to.equal("");
  await sendKeys({ press: "Backspace" });
  expect(controller.values).to.deep.equal([items[0].value]);
  focusIs(input);
  await click(root.querySelector(".ag-chip__remove"));
  expect(controller.values).to.deep.equal([]);
  focusIs(input);
});

for (const direction of ["ltr", "rtl"]) {
  it(`deletes adjacent tokens in writing order at the start of the query (${direction})`, async () => {
    const { root, input, controller, form, popup } = fixture({
      values: [items[0].value, items[1].value],
    });
    root.dir = direction;
    const changes = [];
    root.addEventListener("ag-token-change", (event) =>
      changes.push(event.detail)
    );
    query(input, "grace");
    input.setSelectionRange(0, 0);
    await sendKeys({ press: "Backspace" });
    expect(controller.values).to.deep.equal([items[0].value]);
    expect(new FormData(form).getAll("recipients")).to.deep.equal([
      items[0].value,
    ]);
    expect(input.value).to.equal("grace");
    expect(input.selectionStart).to.equal(0);
    expect(popup.matches(":popover-open")).to.equal(false);
    expect(changes.length).to.equal(1);
    focusIs(input);

    await sendKeys({ press: "Backspace" });
    expect(controller.values).to.deep.equal([]);
    expect(changes.length).to.equal(2);
    focusIs(input);
    await sendKeys({ press: "Backspace" });
    expect(input.value).to.equal("grace");
    expect(changes.length).to.equal(2);
    focusIs(input);
  });
}

it("keeps native Backspace editing for selected text and a caret within the query", async () => {
  const { input, controller } = fixture({ values: [items[0].value] });
  query(input, "grace");
  input.setSelectionRange(0, 2);
  await sendKeys({ press: "Backspace" });
  expect(input.value).to.equal("ace");
  expect(controller.values).to.deep.equal([items[0].value]);
  input.setSelectionRange(1, 1);
  await sendKeys({ press: "Backspace" });
  expect(input.value).to.equal("ce");
  expect(controller.values).to.deep.equal([items[0].value]);
  focusIs(input);
});

for (const direction of ["ltr", "rtl"]) {
  const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
  const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";

  it(`moves the editor between tokens and inserts completions in order (${direction})`, async () => {
    const { root, input, controller, form } = fixture({
      values: [items[0].value, items[3].value],
    });
    root.dir = direction;
    root.style.width = "700px";
    const changes = [];
    root.addEventListener("ag-token-change", (event) =>
      changes.push(event.detail)
    );
    input.focus();
    await sendKeys({ press: backward });
    expect(insertionIndex(input)).to.equal(1);
    focusIs(input);
    const [first, last] = root.querySelectorAll(".ag-chip");
    const editorRect = input.getBoundingClientRect();
    expect(editorRect.width).to.be.lessThan(60);
    if (direction === "ltr") {
      expect(first.getBoundingClientRect().right).to.be.lessThan(
        editorRect.left
      );
      expect(editorRect.right).to.be.lessThan(
        last.getBoundingClientRect().left
      );
    } else {
      expect(last.getBoundingClientRect().right).to.be.lessThan(
        editorRect.left
      );
      expect(editorRect.right).to.be.lessThan(
        first.getBoundingClientRect().left
      );
    }
    await sendKeys({ press: forward });
    expect(insertionIndex(input)).to.equal(2);
    await sendKeys({ press: backward });
    await sendKeys({ press: backward });
    await sendKeys({ press: backward });
    expect(insertionIndex(input)).to.equal(0);
    await sendKeys({ press: forward });
    expect(insertionIndex(input)).to.equal(1);
    expect(changes.length).to.equal(0);

    await sendKeys({ type: "al" });
    await sendKeys({ press: "ArrowDown" });
    await sendKeys({ press: "Tab" });
    expect(controller.values).to.deep.equal([
      items[0].value,
      items[2].value,
      items[3].value,
    ]);
    expect(insertionIndex(input)).to.equal(2);
    focusIs(input);
    await sendKeys({ type: "alan" });
    await sendKeys({ press: "Enter" });
    expect(controller.values).to.deep.equal([
      items[0].value,
      items[2].value,
      items[1].value,
      items[3].value,
    ]);
    expect(new FormData(form).getAll("recipients")).to.deep.equal(
      controller.values
    );
    expect(insertionIndex(input)).to.equal(3);
    expect(changes.length).to.equal(2);
    expect(input.value).to.equal("");
    focusIs(input);
  });

  it(`deletes the preceding and succeeding tokens without leaving the insertion point (${direction})`, async () => {
    const { root, input, controller, form } = fixture({
      values: items.map((item) => item.value),
    });
    root.dir = direction;
    input.focus();
    await sendKeys({ press: backward });
    await sendKeys({ press: backward });
    expect(insertionIndex(input)).to.equal(2);
    await sendKeys({ press: "Backspace" });
    expect(controller.values).to.deep.equal([
      items[0].value,
      items[2].value,
      items[3].value,
    ]);
    expect(insertionIndex(input)).to.equal(1);
    focusIs(input);
    await sendKeys({ press: "Delete" });
    expect(controller.values).to.deep.equal([items[0].value, items[3].value]);
    expect(insertionIndex(input)).to.equal(1);
    focusIs(input);
    await sendKeys({ press: "Delete" });
    await sendKeys({ press: "Delete" });
    expect(controller.values).to.deep.equal([items[0].value]);
    await sendKeys({ press: backward });
    await sendKeys({ press: "Backspace" });
    expect(controller.values).to.deep.equal([items[0].value]);
    await sendKeys({ press: "Delete" });
    expect(controller.values).to.deep.equal([]);
    expect(new FormData(form).getAll("recipients")).to.deep.equal([]);
    focusIs(input);
  });
}

for (const direction of ["ltr", "rtl"]) {
  const sign = direction === "ltr" ? 1 : -1;
  const leading = (rect) => (direction === "ltr" ? rect.left : rect.right);
  const trailing = (rect) => (direction === "ltr" ? rect.right : rect.left);

  it(`places the caret by clicking before, between and after tokens (${direction})`, async () => {
    const { root, input, controller, form } = fixture({
      values: [items[0].value, items[3].value],
    });
    root.dir = direction;
    root.style.width = "700px";
    const changes = [];
    root.addEventListener("ag-token-change", (event) =>
      changes.push(event.detail)
    );
    const rect = (index) =>
      root.querySelectorAll(".ag-chip")[index].getBoundingClientRect();
    let first = rect(0);
    await clickAt(trailing(first) + sign * 3, first.top + first.height / 2);
    expect(insertionIndex(input)).to.equal(1);
    focusIs(input);
    first = rect(0);
    await clickAt(leading(first) - sign * 4, first.top + first.height / 2);
    expect(insertionIndex(input)).to.equal(0);
    focusIs(input);
    const last = rect(1);
    const bounds = input.parentElement.getBoundingClientRect();
    await clickAt(trailing(bounds) - sign * 4, last.top + last.height / 2);
    expect(insertionIndex(input)).to.equal(2);
    focusIs(input);
    expect(changes.length).to.equal(0);

    first = rect(0);
    await clickAt(trailing(first) + sign * 3, first.top + first.height / 2);
    await sendKeys({ type: "alan" });
    await sendKeys({ press: "Tab" });
    expect(controller.values).to.deep.equal([
      items[0].value,
      items[1].value,
      items[3].value,
    ]);
    expect(new FormData(form).getAll("recipients")).to.deep.equal(
      controller.values
    );
    await sendKeys({ press: "Delete" });
    expect(controller.values).to.deep.equal([items[0].value, items[1].value]);
    await sendKeys({ press: "Backspace" });
    expect(controller.values).to.deep.equal([items[0].value]);
    focusIs(input);
  });

  it(`uses the clicked row for insertion in wrapped fields (${direction})`, async () => {
    const { root, input, controller } = fixture({
      values: items.map((item) => item.value),
    });
    root.dir = direction;
    root.style.width = "260px";
    const rect = (index) =>
      root.querySelectorAll(".ag-chip")[index].getBoundingClientRect();
    const first = rect(0);
    expect(rect(1).top).to.be.greaterThan(first.bottom);
    const bounds = input.parentElement.getBoundingClientRect();
    // The end of the first row is before the second token, not at the field's end.
    await clickAt(trailing(bounds) - sign * 4, first.top + first.height / 2);
    expect(insertionIndex(input)).to.equal(1);
    focusIs(input);
    const last = rect(3);
    await clickAt(leading(last) - sign * 4, last.top + last.height / 2);
    expect(insertionIndex(input)).to.equal(3);
    focusIs(input);
    await sendKeys({ press: "Delete" });
    expect(controller.values).to.deep.equal(
      items.slice(0, 3).map((item) => item.value)
    );
    expect(root.scrollWidth).to.equal(root.clientWidth);
  });
}

it("preserves draft text on gap clicks and native caret placement inside the input", async () => {
  const { root, input, controller } = fixture({
    values: [items[0].value, items[3].value],
  });
  root.style.width = "700px";
  query(input, "unmatched draft");
  const first = root.querySelector(".ag-chip").getBoundingClientRect();
  await clickAt(first.left - 4, first.top + first.height / 2);
  expect(insertionIndex(input)).to.equal(0);
  expect(input.value).to.equal("unmatched draft");
  expect(input.selectionStart).to.equal(input.value.length);
  const editor = input.getBoundingClientRect();
  await clickAt(editor.left + 1, editor.top + editor.height / 2);
  expect(input.selectionStart).to.equal(0);
  expect(insertionIndex(input)).to.equal(0);
  expect(controller.values).to.deep.equal([items[0].value, items[3].value]);
  focusIs(input);
});

it("does not reposition read-only or disabled fields and focuses an empty editable field", async () => {
  const { root, input, controller } = fixture({ values: [items[0].value] });
  for (const flag of ["readOnly", "disabled"]) {
    input[flag] = true;
    const first = root.querySelector(".ag-chip").getBoundingClientRect();
    await clickAt(first.left - 4, first.top + first.height / 2);
    expect(insertionIndex(input)).to.equal(1);
    expect(controller.values).to.deep.equal([items[0].value]);
    input[flag] = false;
  }
  controller.clear();
  const bounds = input.parentElement.getBoundingClientRect();
  await clickAt(bounds.left + 3, bounds.top + bounds.height / 2);
  expect(insertionIndex(input)).to.equal(0);
  focusIs(input);
});

it("inserts pointer completions before the first token and keeps a narrow field within its bounds", async () => {
  const { root, input, popup, controller } = fixture({
    values: [items[3].value],
  });
  root.style.width = "240px";
  input.focus();
  await sendKeys({ press: "ArrowLeft" });
  query(input, "ada");
  await click(popup.firstElementChild);
  expect(controller.values).to.deep.equal([items[0].value, items[3].value]);
  expect(insertionIndex(input)).to.equal(1);
  focusIs(input);
  query(
    input,
    "a long unrecognised query that should stay within the field".repeat(3)
  );
  expect(root.scrollWidth).to.equal(root.clientWidth);
});

it("preserves native text selection, cursor movement and Delete editing between tokens", async () => {
  const { input, controller } = fixture({
    values: [items[0].value, items[3].value],
  });
  input.focus();
  await sendKeys({ press: "ArrowLeft" });
  query(input, "abc");
  input.setSelectionRange(1, 1);
  await sendKeys({ press: "ArrowLeft" });
  expect(input.selectionStart).to.equal(0);
  expect(insertionIndex(input)).to.equal(1);
  await sendKeys({ press: "Shift+ArrowRight" });
  expect(input.selectionEnd).to.equal(1);
  await sendKeys({ press: "Delete" });
  expect(input.value).to.equal("bc");
  await sendKeys({ press: "Delete" });
  expect(input.value).to.equal("c");
  expect(controller.values).to.deep.equal([items[0].value, items[3].value]);
  input.setSelectionRange(1, 1);
  await sendKeys({ press: "Delete" });
  expect(input.value).to.equal("c");
  expect(controller.values).to.deep.equal([items[0].value]);
  focusIs(input);
});

it("reconciles the insertion position after API removals, catalogue changes and resets", async () => {
  const { input, controller, form } = fixture({
    values: items.map((item) => item.value),
  });
  input.focus();
  await sendKeys({ press: "ArrowLeft" });
  await sendKeys({ press: "ArrowLeft" });
  controller.remove(items[0].value);
  expect(insertionIndex(input)).to.equal(1);
  controller.setItems(items.slice(2));
  expect(insertionIndex(input)).to.equal(0);
  await sendKeys({ press: "Delete" });
  expect(controller.values).to.deep.equal([items[3].value]);
  controller.setItems(items);
  controller.setValues(items.map((item) => item.value));
  expect(insertionIndex(input)).to.equal(4);
  await sendKeys({ press: "ArrowLeft" });
  form.reset();
  await settle();
  expect(insertionIndex(input)).to.equal(4);
  controller.clear();
  expect(insertionIndex(input)).to.equal(0);
  controller.add(items[0].value);
  expect(insertionIndex(input)).to.equal(1);
  controller.destroy();
  expect(input.hasAttribute("size")).to.equal(false);
});

it("does not navigate or delete tokens during composition or while read-only or disabled", async () => {
  const { input, controller } = fixture({
    values: [items[0].value, items[3].value],
  });
  input.focus();
  await sendKeys({ press: "ArrowLeft" });
  const press = (key, options = {}) =>
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
      })
    );
  for (const key of ["ArrowLeft", "ArrowRight", "Backspace", "Delete"]) {
    expect(press(key, { isComposing: true })).to.equal(true);
    expect(press(key, { ctrlKey: true })).to.equal(true);
  }
  input.dispatchEvent(new CompositionEvent("compositionstart"));
  for (const key of ["ArrowLeft", "ArrowRight", "Backspace", "Delete"])
    expect(press(key)).to.equal(true);
  input.dispatchEvent(new CompositionEvent("compositionend"));
  for (const flag of ["readOnly", "disabled"]) {
    input[flag] = true;
    for (const key of ["ArrowLeft", "ArrowRight", "Backspace", "Delete"])
      expect(press(key)).to.equal(true);
    input[flag] = false;
  }
  expect(insertionIndex(input)).to.equal(1);
  expect(controller.values).to.deep.equal([items[0].value, items[3].value]);
});

it("does not select while composing IME input and opens results only after composition ends", async () => {
  const { input, popup, controller } = fixture();
  input.focus();
  input.dispatchEvent(new CompositionEvent("compositionstart"));
  input.value = "a";
  input.dispatchEvent(
    new InputEvent("input", { isComposing: true, bubbles: true })
  );
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
    })
  );
  expect(controller.values).to.deep.equal([]);
  expect(popup.matches(":popover-open")).to.equal(false);
  input.dispatchEvent(new CompositionEvent("compositionend"));
  expect(popup.children.length).to.equal(4);
  expect(popup.matches(":popover-open")).to.equal(true);
});

it("submits only selected values, validates selection rather than draft text, and resets", async () => {
  const { input, controller, form } = fixture(
    { values: [items[0].value] },
    "required"
  );
  expect(input.checkValidity()).to.equal(true);
  query(input, "anything");
  expect(new FormData(form).getAll("recipients")).to.deep.equal([
    items[0].value,
  ]);
  controller.clear();
  expect(input.checkValidity()).to.equal(false);
  controller.add(items[1].value);
  expect(input.checkValidity()).to.equal(true);
  form.reset();
  await settle();
  expect(controller.values).to.deep.equal([items[0].value]);
  expect(input.value).to.equal("");
  form.addEventListener("reset", (e) => e.preventDefault());
  controller.clear();
  form.reset();
  await settle();
  expect(controller.values).to.deep.equal([]);
});

it("honours disabled and readonly inputs, including native form exclusion", async () => {
  const { input, root, form, controller } = fixture({
    values: [items[0].value],
  });
  input.disabled = true;
  await settle();
  expect(root.querySelector(".ag-chip__remove").disabled).to.equal(true);
  expect(new FormData(form).getAll("recipients")).to.deep.equal([]);
  input.disabled = false;
  input.readOnly = true;
  await settle();
  query(input, "a");
  expect(
    root.querySelector('[role="listbox"]').matches(":popover-open")
  ).to.equal(false);
  expect(new FormData(form).getAll("recipients")).to.deep.equal([
    items[0].value,
  ]);
  root.querySelector(".ag-chip__remove").click();
  expect(controller.values.length).to.equal(1);
});

it("validates API changes atomically, reconciles the catalogue, emits copies and restores authored input attributes", async () => {
  const { input, root, controller } = fixture();
  const events = [];
  root.addEventListener("ag-token-change", (e) => events.push(e.detail));
  expect(enhanceTokenField(root, { items }) === controller).to.equal(true);
  controller.setValues([items[1].value]);
  expect(() => controller.setValues(["unknown"])).to.throw();
  expect(() =>
    controller.setValues([items[0].value, items[0].value])
  ).to.throw();
  expect(controller.add(items[1].value)).to.equal(false);
  expect(controller.remove("unknown")).to.equal(false);
  const copy = controller.values;
  copy.length = 0;
  expect(controller.values.length).to.equal(1);
  controller.setItems([items[0]]);
  expect(controller.values).to.deep.equal([]);
  expect(events.length).to.equal(2);
  controller.destroy();
  expect(input.name).to.equal("recipients");
  expect(input.hasAttribute("role")).to.equal(false);
  expect(root.querySelector(".ag-chip")).to.equal(null);
  expect(root.querySelector("[popover]")).to.equal(null);
  const fresh = enhanceTokenField(root, { items });
  cleanup.push(() => fresh.destroy());
  expect(fresh === controller).to.equal(false);
});

it("treats labels as text and uses image avatars with initials when the URL fails", async () => {
  const hostile = {
    value: "<script>",
    label: "<img src=x onerror=alert(1)>",
    imageUrl: "data:image/png;base64,invalid",
  };
  const { root, controller } = fixture({
    items: [hostile],
    values: [hostile.value],
  });
  await settle();
  expect(root.querySelector(".ag-chip__label").textContent).to.equal(
    hostile.label
  );
  expect(root.querySelectorAll("img").length).to.equal(1);
  expect(root.querySelector(".ag-avatar").dataset.avatarFallback).to.equal(
    "initials"
  );
  expect(controller.values).to.deep.equal([hostile.value]);
});

it("wraps chips within narrow fields and positions a scrollable list above a low field", async () => {
  const many = Array.from({ length: 25 }, (_, i) => ({
    value: `person-${i}`,
    label: `Person ${i}`,
  }));
  const { root, input, controller, popup } = fixture({
    items: many,
    values: many.slice(0, 3).map((i) => i.value),
  });
  root.style.width = "240px";
  expect(root.scrollWidth).to.equal(root.clientWidth);
  expect(
    root.querySelector(".ag-text-field__control").getBoundingClientRect().height
  ).to.be.greaterThan(48);
  controller.clear();
  host.style.cssText = "position:fixed;bottom:16px;right:16px";
  query(input, "p");
  await settle();
  const r = popup.getBoundingClientRect();
  expect(r.left).to.be.at.least(0);
  expect(r.right).to.be.at.most(800);
  expect(r.bottom).to.be.at.most(input.getBoundingClientRect().top);
  expect(popup.scrollHeight).to.be.greaterThan(popup.clientHeight);
});

it("supports measured positioning when CSS anchor positioning is unavailable", async () => {
  const supports = CSS.supports;
  CSS.supports = () => false;
  let f;
  try {
    f = fixture();
  } finally {
    CSS.supports = supports;
  }
  host.style.cssText = "position:fixed;bottom:16px;right:16px";
  query(f.input, "a");
  await settle();
  expect(f.popup.hasAttribute("data-position-fallback")).to.equal(true);
  expect(f.popup.getBoundingClientRect().bottom).to.be.at.most(
    f.input.getBoundingClientRect().top
  );
});
