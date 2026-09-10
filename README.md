# Afterglow

A personal design system implemented as Web Components with [Lit](https://lit.dev), based on the **Afterglow** page in the **Mobile** Figma file.

## Development

Use Node.js 22 or later and Bun (or Yarn).

```sh
bun install
bun run storybook
bun run build
bun run build-storybook
```

Storybook is the component workbench. **Afterglow / Overview** demonstrates the components together, including a preferences form and modal dialog. The Vite entry point registers the library; it is not a separate application.

## Components

- **Design tokens:** colours, typography, spacing, elevation, and motion.
- **Frame:** `ag-background`, `ag-surface`, `ag-panel`, `ag-paper`, `ag-dialog`, and the `ag-appframe` layout shell.
- **Interact:** `ag-button`, `ag-checkbox`, `ag-radio`, `ag-radio-group`, `ag-switch`, `ag-slider`, and `ag-slider-label`.
- **Indicate:** error, caution, and success colour tokens; display components are still to come.
- **Utils:** registration and DOM helpers.

Import `src/main.ts` to register all elements, or import an individual component module to register just that component and its dependencies. Classes are also exported for TypeScript consumers. Registration is safe to repeat; `registerAfterglow()` provides an explicit all-components entry point.

```ts
import "./src/main";

const button = document.createElement("ag-button");
button.variant = "primary";
button.textContent = "Save";
document.body.append(button);
await button.updateComplete;
```

The original `provideAGDesignSystem().register(allComponents)` bootstrap remains available as a compatibility wrapper. Component factories are now registration functions, rather than FAST composition factories. Prefixes and templates are owned by Afterglow; there is no FAST dependency-injection container.

## Themes and styling

Tokens are CSS custom-property references with built-in defaults. Components work without installing a global stylesheet, and variables inherit through shadow DOM. Override variables on the document, a containing element, or an individual component:

```css
.preferences {
  --ctrlText: #006779;
  --ctrl-fill-solid: #006779;
  --panel: #fffdf6;
}
```

The existing token names are retained, including the distinction between unitless grid tokens (`--gridX`, `--gridY`, `--gridType`) and length-valued tokens (`--grid-x`, `--grid-y`, `--grid-type`). TypeScript token exports are Lit `CSSResult` values for use in stylesheets; FAST's token `setValueFor`/`getValueFor` APIs are replaced by standard CSS variables. Typography uses reusable `bodyText`, `captionText`, and `headerText(level)` styles.

Slots and CSS parts remain the customization points. For example, buttons expose `start`, default-content, and `end` slots; switches expose `checked-message` and `unchecked-message`; sliders support labelled positions with `ag-slider-label`.

## State, forms, and dialogs

Controls use native buttons/inputs inside shadow DOM, with `ElementInternals` for outer-form participation. This requires browsers with form-associated custom elements and native `<dialog>` support.

- Boolean attributes use HTML presence semantics: remove `disabled` or `checked` to make the attribute false. `disabled="false"` still means disabled.
- `checked` attributes and `defaultChecked` set the reset state; the `checked` property controls the current state. Checkbox `indeterminate` is a property.
- User interaction emits bubbling `input` and `change` events. Setting properties does not itself emit user-interaction events.
- `name`, `value`, `required`, `disabled`, `readonly`, form reset, and disabled fieldsets are supported. Radio groups submit one selected value under the group's `name`; use distinct radio values.
- Buttons default to `type="button"`. Submit buttons honour validation, `name`/`value`, and form overrides. Their submit event uses a temporary native button as `event.submitter`.
- Lit renders asynchronously. Await `updateComplete` before inspecting rendered content after a property change.
- Checkbox `solid` is the filled variant; `filled` is accepted as an alias.

Dialogs preserve `anchor`, `stretch`, `hidden`, `show()`, `hide()`, and the `dismiss`, `cancel`, and `close` events. As before, dismissal requests do not automatically hide the component:

```ts
const dialog = document.querySelector("ag-dialog")!;
dialog.addEventListener("dismiss", () => dialog.hide());
await dialog.show();
```

`show()` and `hide()` now return promises; `hide()` resolves after the exit animation and rendered closure. Modal dialogs use the browser's top layer, focus containment, and inert background. `modal = false` uses a non-modal dialog; its optional `trapFocus` behaviour defaults to true. Reduced-motion preferences disable dialog animation.

## Browser tests

The browser regression suite covers registration, theme inheritance, native keyboard activation, events, form values and reset, disabled fieldsets, radio coordination, slider updates, and dialog lifecycle/focus.

Install the Playwright-managed Chromium browser once, then run the suite:

```sh
bunx playwright install chromium
bun run test
```

Alternatively, use an installed Google Chrome:

```sh
WTR_BROWSER_CHANNEL=chrome bun run test
```

`bun run test:watch` runs the same tests in watch mode. Browser tests use Web Test Runner with esbuild to compile the TypeScript components directly. The suite is currently configured for Chromium; Firefox and Safari still need a separate compatibility pass.
