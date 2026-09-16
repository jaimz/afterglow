import { expect } from "@esm-bundle/chai";
import { sendKeys, sendMouse, emulateMedia } from "@web/test-runner-commands";
import { enhanceTextField } from "../src/main.ts";

let host, field, input, form, controller;
const style = (element, pseudo) => getComputedStyle(element, pseudo);
const flush = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
const markup = (attributes = "") => `<div class="ag-text-field">
  <div class="ag-text-field__control">
    <input class="ag-text-field__input" id="test-field" name="test" placeholder=" " aria-describedby="hint" ${attributes}>
    <label class="ag-text-field__label" for="test-field">Email address</label>
    <span class="ag-text-field__status" aria-hidden="true"></span>
  </div>
  <p class="ag-text-field__hint" id="hint">Helpful information.</p>
</div>`;
const fixture = (attributes = "", options) => {
  host.innerHTML = `<form>${markup(
    attributes
  )}<button type="submit">Submit</button><button type="reset">Reset</button></form>`;
  form = host.querySelector("form");
  field = host.querySelector(".ag-text-field");
  input = field.querySelector("input");
  form.addEventListener("submit", (event) => event.preventDefault());
  if (options) controller = enhanceTextField(field, options);
  return field;
};
const enter = (value) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
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
});
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  host.remove();
});

it("uses native label activation, keyboard editing and FormData without a helper", async () => {
  fixture('type="email" required autocomplete="email"');
  expect(input).to.be.instanceOf(HTMLInputElement);
  expect(input.labels[0]).to.equal(field.querySelector("label"));
  expect(input.validity.valueMissing).to.equal(true);
  const box = field.querySelector("label").getBoundingClientRect();
  await sendMouse({
    type: "click",
    position: [Math.round(box.x + 5), Math.round(box.y + 5)],
  });
  expect(document.activeElement).to.equal(input);
  await sendKeys({ type: "hello@example.com" });
  expect(input.value).to.equal("hello@example.com");
  expect(new FormData(form).get("test")).to.equal("hello@example.com");
  expect(input.checkValidity()).to.equal(true);
});

it("keeps placeholder-style labels inside every field size through focus, value changes and reset", () => {
  fixture();
  const control = field.querySelector(".ag-text-field__control");
  const label = field.querySelector("label");
  expect(field.getBoundingClientRect().width).to.equal(344);
  for (const [variant, compact, height] of [
    ["default", false, 48],
    ["default", true, 32],
    ["backdrop", false, 40],
    ["backdrop", true, 32],
  ]) {
    field.dataset.variant = variant;
    field.toggleAttribute("data-compact", compact);
    input.blur();
    expect(control.getBoundingClientRect().height).to.equal(height);
    expect(style(label).fontSize).to.equal("16px");
    expect(style(label).clipPath).to.equal("none");
    input.focus();
    expect(label.getBoundingClientRect().top).to.be.greaterThan(
      control.getBoundingClientRect().top
    );
    expect(label.getBoundingClientRect().bottom).to.be.lessThan(
      control.getBoundingClientRect().bottom
    );
    expect(style(label).clipPath).to.equal("none");
    input.value = "Populated by code";
    expect(style(label).clipPath).to.equal("inset(50%)");
    expect(input.labels[0]).to.equal(label);
    expect(control.getBoundingClientRect().top).to.equal(
      field.getBoundingClientRect().top
    );
    expect(control.getBoundingClientRect().height).to.equal(height);
    input.value = "";
    expect(style(label).clipPath).to.equal("none");
    input.value = "Reset this value";
    form.reset();
    expect(style(label).clipPath).to.equal("none");
  }
  field.removeAttribute("data-compact");
  expect(control.getBoundingClientRect().height).to.equal(40);
  expect(style(field).color).to.equal("rgb(232, 201, 200)");
});

it("keeps masking, numeric constraints and native read-only/disabled behaviour", async () => {
  fixture('type="password" value="example-only" readonly');
  input.focus();
  await sendKeys({ type: "Changed" });
  expect(input.type).to.equal("password");
  expect(input.value).to.equal("example-only");
  expect(input.willValidate).to.equal(false);
  input.disabled = true;
  expect(new FormData(form).has("test")).to.equal(false);
  expect(style(field).opacity).to.equal("0.5");
  input.disabled = false;
  input.readOnly = false;
  input.type = "number";
  input.min = "2";
  input.max = "10";
  input.step = "2";
  input.value = "3";
  expect(input.validity.stepMismatch).to.equal(true);
});

it("reveals native errors after blur, then corrects feedback on input", () => {
  fixture('type="email" required', {});
  const error = field.querySelector(".ag-text-field__error");
  expect(error.hidden).to.equal(true);
  expect(input.hasAttribute("aria-invalid")).to.equal(false);
  enter("incorrect");
  expect(error.hidden).to.equal(true);
  input.dispatchEvent(new FocusEvent("blur"));
  expect(error.hidden).to.equal(false);
  expect(error.textContent).to.equal(input.validationMessage);
  expect(input.getAttribute("aria-describedby")).to.equal(`hint ${error.id}`);
  expect(input.getAttribute("aria-invalid")).to.equal("true");
  expect(
    style(field.querySelector(".ag-text-field__status")).maskImage
  ).to.include("alert-circle.svg");
  enter("hello@example.com");
  expect(error.hidden).to.equal(true);
  expect(input.getAttribute("aria-describedby")).to.equal("hint");
  expect(field.dataset.status).to.equal("success");
  expect(
    style(field.querySelector(".ag-text-field__status")).maskImage
  ).to.include("check.svg");
});

it("integrates custom validation with native submit blocking and preserves server errors", () => {
  fixture('value="ab"', {
    validation: (input) =>
      input.value.trim().length < 3 ? "Use three characters." : null,
  });
  expect(input.validity.customError).to.equal(true);
  expect(field.querySelector(".ag-text-field__error").hidden).to.equal(true);
  let submissions = 0;
  form.addEventListener("submit", () => submissions++);
  form.requestSubmit();
  expect(submissions).to.equal(0);
  expect(field.querySelector(".ag-text-field__error").textContent).to.equal(
    "Use three characters."
  );
  enter("Valid name");
  form.requestSubmit();
  expect(submissions).to.equal(1);
  controller.setError("<b>Already registered</b>");
  const error = field.querySelector(".ag-text-field__error");
  expect(error.textContent).to.equal("<b>Already registered</b>");
  expect(error.children.length).to.equal(0);
  enter("Another name");
  expect(controller.validate()).to.equal(false);
  expect(error.textContent).to.equal("<b>Already registered</b>");
  controller.setError(null);
  expect(controller.validate()).to.equal(true);
});

it("handles programmatic updates, constraints and fieldset disabling", async () => {
  fixture('value="a"', {
    validation: (input) => (input.value.length < 3 ? "Too short." : null),
  });
  controller.validate();
  const fieldset = document.createElement("fieldset");
  field.before(fieldset);
  fieldset.append(field);
  fieldset.disabled = true;
  await flush();
  expect(input.validity.customError).to.equal(false);
  expect(field.querySelector(".ag-text-field__error").hidden).to.equal(true);
  expect(controller.validate()).to.equal(true);
  fieldset.disabled = false;
  await flush();
  expect(controller.validate()).to.equal(false);
  input.value = "Correct";
  controller.update();
  expect(field.dataset.status).to.equal("success");
  input.pattern = "[0-9]+";
  await flush();
  expect(input.validity.patternMismatch).to.equal(true);
  expect(field.dataset.status).to.equal("error");
});

it("resets feedback after native form reset and respects cancelled resets", async () => {
  fixture('value="Original"', {});
  enter("Changed");
  controller.setError("Server error");
  form.reset();
  await flush();
  expect(input.value).to.equal("Original");
  expect(field.hasAttribute("data-status")).to.equal(false);
  expect(input.validity.customError).to.equal(false);
  expect(field.querySelector(".ag-text-field__error").hidden).to.equal(true);
  controller.setError("Retain this");
  form.addEventListener("reset", (event) => event.preventDefault());
  form.reset();
  await flush();
  expect(field.querySelector(".ag-text-field__error").textContent).to.equal(
    "Retain this"
  );
});

it("respects submitter formnovalidate and emits no synthetic input/change events", () => {
  fixture('value="Valid"', {});
  let changes = 0;
  input.addEventListener("input", () => changes++);
  input.addEventListener("change", () => changes++);
  controller.setError("Server error");
  const submit = form.querySelector('[type="submit"]');
  submit.formNoValidate = true;
  // A synthetic submit isolates the helper's cancellation from browser navigation.
  const event = new SubmitEvent("submit", {
    bubbles: true,
    cancelable: true,
    submitter: submit,
  });
  let cancelledByHelper = false;
  const capture = (event) => {
    cancelledByHelper = event.defaultPrevented;
  };
  document.addEventListener("submit", capture, true);
  form.dispatchEvent(event);
  document.removeEventListener("submit", capture, true);
  expect(cancelledByHelper).to.equal(false);
  expect(changes).to.equal(0);
});

it("preserves externally owned validation and descriptions during cleanup and re-enhancement", () => {
  fixture('value="Existing" aria-invalid="false"');
  input.setCustomValidity("Existing constraint");
  controller = enhanceTextField(field);
  expect(enhanceTextField(field)).to.equal(controller);
  controller.setError("Server error");
  const generated = field.querySelector(".ag-text-field__error");
  input.setAttribute(
    "aria-describedby",
    `${input.getAttribute("aria-describedby")} external-help`
  );
  controller.destroy();
  expect(input.validationMessage).to.equal("Existing constraint");
  expect(input.getAttribute("aria-describedby")).to.equal("hint external-help");
  expect(input.getAttribute("aria-invalid")).to.equal("false");
  expect(input.value).to.equal("Existing");
  expect(generated.isConnected).to.equal(false);
  controller = enhanceTextField(field);
  controller.setError("Our error");
  input.setCustomValidity("New external constraint");
  controller.destroy();
  expect(input.validationMessage).to.equal("New external constraint");
});

it("avoids validating unfinished composition and supports external form association", async () => {
  fixture('form="external" value="Initial"', {
    validation: (input) => (input.value.length < 3 ? "Too short." : null),
  });
  const external = document.createElement("form");
  external.id = "external";
  host.append(external);
  input.value = "x";
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, isComposing: true })
  );
  expect(input.validity.valid).to.equal(true);
  input.dispatchEvent(new CompositionEvent("compositionend"));
  expect(input.validity.customError).to.equal(true);
  external.reset();
  await flush();
  expect(input.value).to.equal("Initial");
  expect(input.validity.valid).to.equal(true);
});

it("supports narrow RTL fields, clear focus and hidden", () => {
  fixture('value="A long value in the field"');
  host.style.width = "160px";
  field.dir = "rtl";
  const control = field.querySelector(".ag-text-field__control");
  const leading = document.createElement("span");
  leading.className = "ag-text-field__leading";
  leading.innerHTML =
    '<span class="ag-icon" data-icon="search" aria-hidden="true"></span>';
  control.prepend(leading);
  expect(field.scrollWidth).to.be.at.most(160);
  expect(leading.getBoundingClientRect().left).to.be.greaterThan(
    input.getBoundingClientRect().left
  );
  input.focus();
  expect(parseFloat(style(control).outlineWidth)).to.equal(2);
  field.hidden = true;
  expect(field.getBoundingClientRect().width).to.equal(0);
});

it("keeps every variant legible in forced-colour mode", async () => {
  fixture('value="Example"', {});
  await emulateMedia({ forcedColors: "active" });
  try {
    for (const [variant, compact] of [
      ["default", false],
      ["default", true],
      ["backdrop", false],
      ["backdrop", true],
    ]) {
      field.dataset.variant = variant;
      field.toggleAttribute("data-compact", compact);
      controller.setError("An error");
      const control = field.querySelector(".ag-text-field__control");
      expect(style(control).boxShadow).to.equal("none");
      expect(style(control).backgroundColor).not.to.equal("rgba(0, 0, 0, 0)");
      expect(
        style(field.querySelector(".ag-text-field__status")).backgroundColor
      ).not.to.equal("rgba(0, 0, 0, 0)");
    }
  } finally {
    await emulateMedia({ forcedColors: "none" });
  }
});
