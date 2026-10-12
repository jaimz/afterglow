import { element } from "../../stories/fixtures";

interface FabArgs {
  disabled: boolean;
  background: "dark" | "panel" | "backdrop";
}

// Background is a preview setting: the same translucent button works on each.
function surface(background: FabArgs["background"]) {
  if (background === "dark")
    return 'style="padding:32px;background:#242424;color:var(--onBackdropAlt)"';
  return `class="ag-${
    background === "backdrop" ? "background" : "panel"
  }" style="padding:32px"`;
}

export default {
  title: "Interact/FAB",
  args: { disabled: false, background: "dark" },
  argTypes: {
    disabled: { control: "boolean" },
    background: {
      control: "select",
      options: ["dark", "panel", "backdrop"],
      description:
        "Preview surface behind the translucent button; not a FAB variant.",
    },
  },
};
export const Default = ({ disabled, background = "dark" }: FabArgs) => {
  const root = element(`<section ${surface(background)}>
    <button class="ag-fab" type="button" aria-label="Add a note" ${
      disabled ? "disabled" : ""
    }><span class="ag-fab__icon" data-icon="add" aria-hidden="true"></span></button>
    <p class="ag-body"><output aria-live="polite">No notes added.</output></p>
  </section>`);
  let count = 0;
  root.querySelector("button")!.onclick = () => {
    root.querySelector("output")!.textContent = `Notes added: ${++count}`;
  };
  return root;
};

export const Surfaces = () => {
  const root = element(
    '<section style="display:flex;flex-wrap:wrap;gap:24px"></section>'
  );
  for (const background of ["dark", "panel", "backdrop"] as const) {
    root.append(Default({ disabled: false, background }));
  }
  return root;
};
Surfaces.parameters = { controls: { disable: true } };
