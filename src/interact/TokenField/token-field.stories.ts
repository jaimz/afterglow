import { enhanceTokenField, type TokenFieldItem } from "../../main";
import { element, escapeHTML, track } from "../../stories/fixtures";

const people: TokenFieldItem[] = [
  {
    value: "ada@example.com",
    label: "Ada Lovelace",
    description: "ada@example.com",
  },
  {
    value: "alan@example.com",
    label: "Alan Turing",
    description: "alan@example.com",
  },
  {
    value: "alice@example.com",
    label: "Alice Ball",
    description: "alice@example.com",
  },
  {
    value: "grace@example.com",
    label: "Grace Hopper",
    description: "grace@example.com",
  },
  {
    value: "katherine@example.com",
    label: "Katherine Johnson",
    description: "katherine@example.com",
  },
  {
    value: "margaret@example.com",
    label: "Margaret Hamilton",
    description: "margaret@example.com",
  },
];
let nextExample = 0;
interface Args {
  label: string;
  placeholder: string;
  compact: boolean;
  variant: string;
  disabled: boolean;
  readOnly: boolean;
}
const defaults: Args = {
  label: "To:",
  placeholder: "Add a recipient…",
  compact: false,
  variant: "default",
  disabled: false,
  readOnly: false,
};

/** Each story uses its own input IDs and disposes its helper through the fixture. */
function example(
  args: Args = defaults,
  items = people,
  values: string[] = [],
  required = false
) {
  const id = `token-example-${++nextExample}`;
  const wrapper =
    element(`<div style="padding:32px;min-height:360px;box-sizing:border-box" ${
      args.variant === "backdrop" ? 'class="ag-background"' : ""
    }>
    <label class="ag-body" for="${id}" style="display:block;margin-bottom:8px">${escapeHTML(
      args.label
    )}</label>
    <div class="ag-text-field ag-token-field" data-variant="${escapeHTML(
      args.variant
    )}" ${
      args.compact ? "data-compact" : ""
    } style="width:560px;max-width:100%">
      <div class="ag-text-field__control">
        <input class="ag-text-field__input" type="text" id="${id}" name="recipients" autocomplete="off" placeholder="${escapeHTML(
      args.placeholder
    )}" ${args.disabled ? "disabled" : ""} ${
      args.readOnly ? "readonly" : ""
    } aria-describedby="${id}-hint">
      </div>
    </div>
    <p class="ag-caption" id="${id}-hint">Type any part of a name or email address to filter recipients. Enter or Tab completes a name. Click between recipients or use Left/Right to position the caret, type to insert, and Backspace/Delete to remove adjacent recipients.</p>
    <output class="ag-caption" style="display:block;overflow-wrap:anywhere"></output>
  </div>`);
  const root = wrapper.querySelector<HTMLElement>(".ag-token-field")!;
  const controller = track(
    enhanceTokenField(root, { items, values, required })
  );
  const report = () => {
    wrapper.querySelector("output")!.textContent = `Selected: ${
      controller.values.join(", ") || "none"
    }`;
  };
  root.addEventListener("ag-token-change", report);
  report();
  return { wrapper, root, controller };
}
export default {
  title: "Interact/Token Field",
  render: (args: Args) => example(args).wrapper,
  args: defaults,
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    compact: { control: "boolean" },
    variant: { control: "select", options: ["default", "backdrop"] },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
};
export const Default = {};
export const Compact = { args: { compact: true } };
export const Backdrop = { args: { variant: "backdrop" } };
export const WithRecipients = () =>
  example(defaults, people, ["ada@example.com", "grace@example.com"]).wrapper;
WithRecipients.parameters = { controls: { disable: true } };

export const Layouts = () => {
  const wrapper = element('<div style="display:grid;gap:24px"></div>');
  const narrow = example(
    defaults,
    people,
    people.slice(0, 4).map((item) => item.value)
  );
  narrow.root.style.width = "300px";
  const rtl = example(
    { ...defaults, label: "إلى:", placeholder: "أضف اسماً…" },
    [
      { value: "layla", label: "ليلى حسن" },
      { value: "lina", label: "لينا أحمد" },
      { value: "sara", label: "سارة علي" },
    ],
    ["sara"]
  );
  rtl.wrapper.dir = "rtl";
  rtl.wrapper.lang = "ar";
  rtl.wrapper.querySelector("p")!.textContent =
    "اكتب ل لرؤية الأسماء المقترحة.";
  wrapper.append(narrow.wrapper, rtl.wrapper);
  return wrapper;
};
Layouts.parameters = { controls: { disable: true } };

export const States = () => {
  const wrapper = element('<div style="display:grid;gap:16px"></div>');
  wrapper.append(
    example({ ...defaults, label: "Disabled", disabled: true }, people, [
      people[0].value,
    ]).wrapper,
    example({ ...defaults, label: "Read only", readOnly: true }, people, [
      people[1].value,
    ]).wrapper
  );
  return wrapper;
};
States.parameters = { controls: { disable: true } };

export const Images = () => {
  // A self-contained illustration keeps this example independent of remote hosts.
  const imageUrl = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#9fbec3"/><circle cx="32" cy="24" r="12" fill="#f3eee6"/><path d="M8 64a24 24 0 0 1 48 0" fill="#64788c"/></svg>'
  )}`;
  const items = people.map((item, i) => ({
    ...item,
    imageUrl: i === 0 ? imageUrl : undefined,
  }));
  return example(defaults, items, [items[0].value, items[1].value]).wrapper;
};
Images.parameters = { controls: { disable: true } };

export const Form = () => {
  const form = element(
    '<form><div class="ag-body" style="padding:0 32px 24px"><button class="ag-button" data-variant="primary" type="submit">Send</button> <button class="ag-button" type="reset">Reset</button><p class="token-form-result" role="status"></p></div></form>'
  ) as HTMLFormElement;
  const { wrapper } = example(defaults, people, [people[0].value], true);
  wrapper.style.minHeight = "200px";
  form.prepend(wrapper);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelector(
      ".token-form-result"
    )!.textContent = `Submitted recipients: ${new FormData(form)
      .getAll("recipients")
      .join(", ")}`;
  });
  return form;
};
Form.parameters = { controls: { disable: true } };

export const LongList = () => {
  const { wrapper } = example(
    { ...defaults, placeholder: "Type part of a name or number…" },
    Array.from({ length: 40 }, (_, i) => ({
      value: `team-${i + 1}`,
      label: `Team member ${i + 1}`,
    }))
  );
  wrapper.querySelector("p")!.textContent =
    "Type “2” to find Team member 2, 12, 20–29 and 32. Enter or Tab selects the highlighted match.";
  return wrapper;
};
LongList.parameters = { controls: { disable: true } };
