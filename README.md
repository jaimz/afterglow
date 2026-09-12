# Afterglow

**Afterglow** is a native HTML and SCSS design system. Buttons and form controls are real HTML elements. There is no custom-element registration, Shadow DOM, Lit or FAST runtime.

Use HTML and CSS first. Add the optional TypeScript helpers for avatar initials and fitting, dynamic slider decorations, animated dialogs, notification timing and announcements, read-only controls or extra radio-group shortcuts. Future components should follow the same rule: a native element that can be styled appropriately does not need a web component.

## Using Afterglow

See [Usage.md](Usage.md) for HTML recipes, CSS classes and variants, theming, optional JavaScript helpers, framework integration and the usage documentation expected for future Web Components.

Styles are organised into **foundation**, **frame**, **indicate**, **interact** and **present**. Each category separates token definitions, pure Sass mixins and emitted classes. See [Architecture.md](Architecture.md) for the structure, compatibility entry points and design sources.

## Development

Use Node.js 22 or later and Bun (or Yarn).

```sh
bun install
bun run storybook
bun run build
bun run build-storybook
```

Storybook uses its HTML renderer. **Afterglow / Overview** demonstrates a working preferences form and animated dialog. **Afterglow / Native HTML / CSS Only** has no Afterglow behaviour helpers; selection and reset still work. **States** covers mixed, disabled, backdrop, read-only and vertical controls. The Vite development page also demonstrates a form without JavaScript.

**Frame / Layouts**, **Interact / Textarea**, **Interact / Location Index**, **Interact / FAB**, **Present / Article** and **Present / Card Content** demonstrate the additional native recipes and their composition with the existing surfaces.

**Present / Avatar** includes photo, initials, flat-initials and blank variants, three sizes, name and image URL editors, and photo fallback. Its helper exposes writable `name` and `imageUrl` properties and fits the extracted initials to the selected shape.

**Present / Icon** includes the Feather catalogue, a searchable gallery and examples of icons in buttons, navigation and text. Use `ag-icon` with `data-icon` to select a glyph; it inherits text colour and supports the `--icon-size` token. **Interact / Button / With Icons** demonstrates the same native recipe in controls.

**Indicate / Progress** styles native `progress` elements with default, error and caution variants. Examples cover native value updates, indeterminate progress, reduced motion, wrapping labels and RTL layouts. No helper is required.

The build produces independent assets:

- `dist/afterglow.css`: the complete stylesheet.
- `dist/assets/`: exported icons and the Avatar font, with its licence; keep this folder beside the CSS when serving it directly.
- `dist/afterglow.mjs`: optional ES module helpers, with TypeScript declarations in `dist/`.
- `src/styles/afterglow.scss`: complete Sass entry point; category entries and pure token/mixin modules are also available.

To update the Feather catalogue, add or remove SVGs in `src/styles/assets/feather/` and run `bun run build:icons`. The assets stay unchanged; this regenerates the Sass URL map. The style tests check that the catalogue matches the files.

The package exports these as `ag/css`, `ag` and `ag/scss`. The stylesheet includes default CSS token declarations; use `ag-theme` or the Sass `tokens.theme()` mixin for a local typography theme. See [the theming guide](Usage.md#themes-and-scss). You can also copy the compiled CSS into a project without adopting Sass or a JavaScript framework.

The build also includes the HTML-only example as `dist/index.html`. Run `bun run build` followed by `bun run preview`, then open [http://127.0.0.1:4173](http://127.0.0.1:4173). Preview uses a fixed loopback address and port to avoid conflicts with macOS AirPlay on port 5000; it reports an error if port 4173 is already occupied.

## Migration from custom elements

| Previous API                                 | Native replacement                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `ag-background`, `ag-surface`, etc.          | Semantic container with the corresponding `.ag-*` class                       |
| `ag-button`                                  | `<button class="ag-button" type="button">` (or submit/reset explicitly)       |
| `ag-checkbox`, `ag-radio`, `ag-switch`       | Native labelled input recipe                                                  |
| `ag-radio-group`                             | Fieldset/legend and same-named radios                                         |
| `ag-slider`, `ag-slider-label`               | Native range with track/label markup; `enhanceSlider`                         |
| `ag-dialog.show()` / `.hide()`               | `enhanceDialog(dialog).show()` / `.hide()`                                    |
| `variant`, `dangerous`, `orientation`        | Corresponding `data-*` attributes on recipe containers                        |
| `readonly` on a checkable/range              | `data-readonly` plus `enhanceControls`                                        |
| Slots and `::part()`                         | Ordinary children and documented `.ag-*__*` classes                           |
| `updateComplete`                             | Native state is synchronous; call `slider.update()` after direct value writes |
| `provideAGDesignSystem`, component factories | Removed; import CSS and optional helpers                                      |
| Lit token exports                            | SCSS token variables/mixins and the same public CSS properties                |

This is an intentional markup/API migration. Existing custom tags no longer render controls. `input` and `change` originate from the actual inputs and bubble to group/form listeners; they are not re-emitted from wrapper elements. Keep behaviour tests on outcomes, rather than Shadow DOM structure or framework lifecycle promises.

## Browser verification

```sh
bunx playwright install chromium firefox webkit
bun run test:styles
bun run test
bun run test:browsers
```

To use installed Google Chrome for the Chromium slot:

```sh
WTR_BROWSER_CHANNEL=chrome bun run test
WTR_BROWSER_CHANNEL=chrome bun run test:browsers
```

The Sass tests verify import purity, category boundaries, theme validation, package paths and compatibility imports. Web Test Runner compiles SCSS in memory and tests native forms, labels, keyboard input, theme inheritance, read-only states, range bounds/marks/RTL/vertical behaviour, dialog/notification lifecycle and responsive layouts across Chromium, Firefox and WebKit. WebKit is the automated engine check; it does not replace testing Safari/iOS with real touch and assistive technology. The compiled library and Storybook builds are separate checks.
