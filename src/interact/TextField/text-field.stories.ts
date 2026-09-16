import { element } from "../../stories/fixtures";
import {
  createTextField,
  type TextFieldArgs,
} from "./fixtures/createTextField";

export default {
  title: "Interact/Text Field",
  render: (args: TextFieldArgs) => {
    const root = element(
      `<section class="${
        args.variant === "backdrop" ? "ag-background" : ""
      }" style="padding:32px;width:auto;height:auto"></section>`
    );
    root.append(createTextField(args).root);
    return root;
  },
  args: {
    label: "Label",
    value: "",
    hint: "Hint text",
    type: "text",
    autocomplete: "off",
    variant: "default",
    compact: false,
    leadingIcon: "",
    trailingIcon: "",
    showValidationIcon: false,
    status: "none",
    errorMessage: "Please check this value.",
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    hint: { control: "text" },
    type: {
      control: "select",
      options: ["text", "search", "password", "email", "url", "tel", "number"],
    },
    autocomplete: {
      control: "text",
      description:
        'Native autocomplete value. Defaults to "off"; use "on" or a token such as "email" to enable it.',
    },
    variant: {
      control: "select",
      options: ["default", "backdrop"],
    },
    compact: {
      control: "boolean",
      description: "Use a 32px field with 16px icons in either visual variant.",
    },
    leadingIcon: {
      control: "text",
      description: "Optional Feather icon name.",
    },
    trailingIcon: {
      control: "text",
      description: "Optional decorative trailing icon.",
    },
    showValidationIcon: { control: "boolean" },
    status: {
      control: "select",
      options: ["none", "success", "error"],
      description:
        "Explicit visual feedback; Live Validation demonstrates native validation.",
    },
    errorMessage: { control: "text" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    required: { control: "boolean" },
  },
};

export const Default = {};
export const Compact = { args: { compact: true } };
export const Search = {
  args: { type: "search", label: "Search", leadingIcon: "search", hint: "" },
};
export const SearchCompact = { args: { ...Search.args, compact: true } };
export const WithContent = { args: { value: "Text field" } };
export const Password = {
  args: {
    type: "password",
    label: "Password",
    value: "example-value",
    status: "success",
    hint: "Password meets the requirements",
    showValidationIcon: true,
  },
};
export const WithError = {
  args: {
    type: "password",
    label: "Password",
    value: "example",
    status: "error",
    errorMessage: "Password is too weak",
    showValidationIcon: true,
  },
};
export const Backdrop = {
  args: {
    variant: "backdrop",
    label: "Location…",
    leadingIcon: "map-pin",
    hint: "",
  },
};
export const BackdropCompact = { args: { ...Backdrop.args, compact: true } };

export const Variants = {
  render: () => {
    const root = element(
      '<section style="padding:32px;display:grid;gap:20px"></section>'
    );
    const variants: TextFieldArgs[] = [
      { label: "Label" },
      { label: "Label", type: "search", leadingIcon: "search" },
      { label: "Label", compact: true },
      {
        label: "Label",
        compact: true,
        type: "search",
        leadingIcon: "search",
      },
      { label: "Label", compact: true, value: "Hello" },
      { label: "Label", value: "Text field", hint: "Hint text" },
      {
        label: "Password",
        value: "example",
        type: "password",
        status: "error",
        errorMessage: "Password is too weak",
        showValidationIcon: true,
      },
      {
        label: "Password",
        value: "example-value",
        type: "password",
        status: "success",
        hint: "Password meets the requirements",
        showValidationIcon: true,
      },
    ];
    for (const args of variants) root.append(createTextField(args).root);
    const backdrop = element(
      '<div class="ag-background" style="padding:24px;width:auto;height:auto;display:grid;gap:20px"></div>'
    );
    backdrop.append(
      createTextField({
        label: "Location…",
        variant: "backdrop",
        leadingIcon: "map-pin",
      }).root,
      createTextField({
        label: "Location…",
        variant: "backdrop",
        compact: true,
        leadingIcon: "map-pin",
      }).root
    );
    root.append(backdrop);
    return root;
  },
  parameters: { controls: { disable: true } },
};

export const StatesAndLayouts = {
  render: () => {
    const root = element(
      '<section style="padding:32px;display:grid;gap:24px"></section>'
    );
    for (const args of [
      { label: "Disabled", value: "Unavailable", disabled: true },
      { label: "Read only", value: "Select and copy", readOnly: true },
      {
        label: "Email",
        type: "email",
        leadingIcon: "mail",
        trailingIcon: "lock",
        value: "hello@example.com",
      },
    ] as TextFieldArgs[])
      root.append(createTextField(args).root);
    const narrow = element(
      '<div style="width:180px;max-width:100%" dir="rtl"></div>'
    );
    narrow.append(
      createTextField({
        label: "عنوان البريد الإلكتروني",
        type: "email",
        value: "hello@example.com",
        hint: "A longer hint wraps to the width of its containing field.",
        leadingIcon: "mail",
      }).root
    );
    root.append(narrow);
    return root;
  },
  parameters: { controls: { disable: true } },
};

export const LiveValidation = {
  render: () => {
    const form =
      element(`<form class="ag-body" style="padding:32px;display:grid;gap:24px">
      <div class="fields" style="display:grid;gap:24px"></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <button type="submit" class="ag-button">Save</button>
        <button type="reset" class="ag-button">Reset</button>
        <button type="button" class="ag-button server-error">Set server error</button>
        <button type="button" class="ag-button clear-error">Clear server error</button>
      </div><output>Enter an email address and a display name.</output>
    </form>`) as HTMLFormElement;
    const email = createTextField(
      {
        label: "Email",
        type: "email",
        name: "email",
        hint: "Use an address you can receive mail at.",
        required: true,
        leadingIcon: "mail",
        showValidationIcon: true,
      },
      {}
    );
    const name = createTextField(
      {
        label: "Display name",
        name: "displayName",
        hint: "Use at least three non-space characters.",
        required: true,
        showValidationIcon: true,
      },
      {
        validation: (input) =>
          input.value && input.value.trim().length < 3
            ? "Use at least three non-space characters."
            : null,
      }
    );
    form.querySelector(".fields")!.append(email.root, name.root);
    form.querySelector<HTMLButtonElement>(".server-error")!.onclick = () =>
      email.controller!.setError("That email address is already registered.");
    form.querySelector<HTMLButtonElement>(".clear-error")!.onclick = () =>
      email.controller!.setError(null);
    form.onsubmit = (event) => {
      event.preventDefault();
      if (email.controller!.validate() && name.controller!.validate())
        form.querySelector(
          "output"
        )!.textContent = `Saved display name: ${new FormData(form).get(
          "displayName"
        )}`;
    };
    form.onreset = () => {
      form.querySelector("output")!.textContent =
        "Enter an email address and a display name.";
    };
    return form;
  },
  parameters: { controls: { disable: true } },
};

export const NativeHTML = {
  render: () => {
    const form = element(
      '<form class="ag-body" style="padding:32px;display:grid;gap:24px"><button type="submit" class="ag-button">Save</button><output>Uses native browser validation.</output></form>'
    ) as HTMLFormElement;
    form.prepend(
      createTextField({
        label: "Email",
        type: "email",
        name: "email",
        required: true,
        hint: "Enter a valid email address.",
      }).root
    );
    form.onsubmit = (event) => {
      event.preventDefault();
      form.querySelector("output")!.textContent = "Native validation passed.";
    };
    return form;
  },
  parameters: { controls: { disable: true } },
};
