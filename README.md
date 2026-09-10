# Afterglow

A native HTML and SCSS design system based on the **Afterglow** page in the **Mobile** Figma file. Buttons and form controls are real HTML elements. There is no custom-element registration, Shadow DOM, Lit or FAST runtime.

Use HTML and CSS first. Add the optional TypeScript helpers only for dynamic slider decorations, the animated dialog lifecycle, read-only controls or extra radio-group shortcuts. Future components should follow the same rule: a native element that can be styled appropriately does not need a web component.

## Using Afterglow

See [Usage.md](Usage.md) for HTML recipes, CSS classes and variants, theming, optional JavaScript helpers, framework integration and the usage documentation expected for future Web Components.

## Development

Use Node.js 22 or later and Bun (or Yarn).

```sh
bun install
bun run storybook
bun run build
bun run build-storybook
```

Storybook uses its HTML renderer. **Afterglow / Overview** demonstrates a working preferences form and animated dialog. **Afterglow / Native HTML / CSS Only** has no Afterglow behaviour helpers; selection and reset still work. **States** covers mixed, disabled, backdrop, read-only and vertical controls. The Vite development page also demonstrates a form without JavaScript.

The build produces independent assets:

- `dist/afterglow.css`: the complete stylesheet.
- `dist/afterglow.mjs`: optional ES module helpers, with TypeScript declarations in `dist/`.
- `src/styles/afterglow.scss`: Sass entry point; individual modules expose tokens and frame/typography mixins.

The package exports these as `ag/css`, `ag` and `ag/scss`. You can also copy the compiled CSS into a project without adopting Sass or a JavaScript framework.

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
bun run test
bun run test:browsers
```

To use installed Google Chrome for the Chromium slot:

```sh
WTR_BROWSER_CHANNEL=chrome bun run test
WTR_BROWSER_CHANNEL=chrome bun run test:browsers
```

Web Test Runner compiles SCSS in memory and tests native forms, labels, keyboard input, theme inheritance, read-only states, range bounds/marks/RTL/vertical behaviour and dialog lifecycle across Chromium, Firefox and WebKit. WebKit is the automated engine check; it does not replace testing Safari/iOS with real touch and assistive technology. The compiled library and Storybook builds are separate checks.
