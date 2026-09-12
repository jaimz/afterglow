# Afterglow structure

Afterglow groups styles and components by their purpose. Native HTML supplies semantics and interaction; SCSS supplies appearance and layout. Optional TypeScript helpers cover behaviour that needs scripting. Add a Web Component only when native HTML and styling cannot provide the required functionality and fidelity.

| Category     | Responsibility                          | Current examples                                                                            |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `foundation` | Shared primitives and composition tools | Type scale, token registry, theme boundaries, generic layout and motion mixins              |
| `frame`      | Arrange and contain other elements      | Background, surface, panel, paper, application grid, master-detail, structural card, dialog |
| `indicate`   | Reflect changing or transient state     | Notification and status colours                                                             |
| `interact`   | Accept user input                       | Button, FAB, checkbox, radio, switch, slider, textarea, navigation links                    |
| `present`    | Display lasting content                 | Article typography, card content, avatars and reusable icons                                 |

Choose a component's category by its primary purpose. A notification remains in `indicate` even though it contains a dismiss button; that button is an interaction within a status presentation. A structural card belongs to `frame`, while its optional text treatment belongs to `present`.

## SCSS modules

```text
src/styles/
  afterglow.scss                   Complete stylesheet
  foundation/
    _primitives.scss              Shared default values and derived type formulas
    _tokens.scss                  Pure registry, token(), theme(), Sass aliases
    _theme.scss                   Default :root and local .ag-theme declarations
    _typography.mixins.scss        Pure composition tools
    _typography.classes.scss      Ready-made typography classes
    _layout.mixins.scss            Generic layout helpers
    _motion.mixins.scss            Optional entry/exit transitions
    _mixins.scss                   Pure barrel, with prefixed names
    _index.scss                    Foundation CSS entry
  frame/                          Same token/mixin/class convention
  indicate/
  interact/
  present/
  _assets.scss                    Shared relative asset URLs
  assets/                         Exact exported icons and provenance notes
  _tokens.scss, _frames.scss, ...  Compatibility entries
```

Each category owns a pure `_tokens.scss` map. `foundation/_tokens.scss` combines these with the shared primitives, rejects duplicate names and exposes `token($name)` and `theme($overrides)`. Existing CSS token spellings and Sass aliases remain stable. Recipe mixins depend on this pure registry; they never import emitted class modules.

`foundation/_theme.scss` is the only module that emits defaults. It declares all tokens on `:where(:root)` and recalculates derived typography at `:where(.ag-theme)`. A local theme inherits base colours and sizes instead of resetting them. The `theme()` mixin performs the same local calculation with validated overrides. A consumer's future theme file can supply these overrides without changing component recipes.

`*.mixins.scss` files emit no CSS merely by being imported. Simple mixins provide declarations for a consumer's own selector. More involved recipes expose `styles`, which emits the complete documented `.ag-*` recipe, including its state selectors. Include that mixin at the root or inside an application scope; it does not rename required child classes or helper hooks.

`*.classes.scss` imports the shared theme and includes the recipe mixins. Category `_index.scss` files collect these emitted modules. Sass deduplicates shared modules within one compilation. Each category emits its own classes; a composed example using a presentation card and native buttons needs both `present` and `interact`, or the complete stylesheet.

The pure `mixins` barrels prefix names to avoid collisions. Examples are `foundation.type-body`, `foundation.layout-flex-row`, `frame.surface-panel`, `frame.layout-master-detail`, `interact.button-styles` and `present.article-article`. Direct recipe-module imports provide shorter names such as `surface.panel` or `article.article`.

Generic layout mixins use logical dimensions and honour their gap arguments. Motion mixins are opt-in, honour reduced motion and do not add persistent `will-change` hints. Existing dialog and notification animations retain their current behaviour.

Asset URLs remain in the root `_assets.scss` module so both Vite's source import and the standalone CSS build can resolve the same exported files. The build copies `assets/` beside `afterglow.css`; do not move the CSS away from that directory when serving it directly.

The reusable `present/icon` recipe applies Feather SVG masks to native elements. It inherits colour, uses the `icon-size` token and composes with existing control child-spacing classes. `_assets.scss` forwards the generated root `_feather.scss` URL map. Run `bun run build:icons` after changing the supplied files; the style tests detect a stale catalogue. Pure icon mixins can emit a selected subset of names or style a consumer selector. Existing component-specific assets remain available for their established visual treatments.

## Compatibility

The complete `ag/css` and `ag/scss` entry points, existing `.ag-*` classes, data attributes, helper exports and CSS custom properties remain available. Previous flat Sass modules forward their original public members and retain their previous CSS side effects. New consumers can use category entries or pure modules as documented in [Usage.md](Usage.md#scss-mixins).

The application grid is opt-in through `ag-appframe[data-layout="application"]`. Plain `ag-appframe` is unchanged. New article and card-content typography is scoped to their recipes; existing heading utility classes keep their prior declarations. Layouts compose existing surface classes rather than introducing a new default theme.

## Design sources

The experimental SCSS in Tai informed category ownership, separate definitions and emitted classes, reusable layout helpers, article styles, textarea and location-index recipes. Tai is a reference, not a dependency, and this work does not modify it. Its application-specific backdrop colours, surface treatments, resets and broad element selectors have not been adopted.

The **Afterglow** page of the **Mobile** Figma file remains the visual authority. The new visual recipes were checked against these nodes:

| Recipe                    | Figma source                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Textarea                  | [TextArea 143:107](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=143-107)     |
| Article headings and body | [Type Ramp Mobile 115:4](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=115-4) |
| Navigation links          | [Menu Item 217:1](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=217-1)        |
| Card content              | [Card content 235:17](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=235-17)   |
| Floating action button    | [FAB 284:1](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=284-1)              |
| Avatar                    | [Avatar 204:112](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=204-112)       |

The application grid, master-detail arrangement and structural card are flexible layout recipes inspired by Tai. Their widths, responsive breakpoint and composition rules are library choices, not assertions that Figma specifies a complete responsive application shell. They use existing Afterglow surfaces. Figma's fixed sample dimensions become content-driven sizing where needed: textareas have a minimum height, cards grow with content, and navigation labels can wrap.

Keep the existing visual defaults when reorganising code. Resolve visual questions against Figma, and keep consumer-specific theme values in consumer overrides.

## Adding a recipe

1. Choose its category and native semantic element; document any behaviour that needs a helper.
2. Inspect the relevant Figma component, reuse shared tokens and export exact assets where applicable.
3. Add any new default tokens to the owning category map. The registry exposes them automatically; avoid renaming existing tokens during unrelated work.
4. Implement pure mixins and a small class-emission module; add them to the category barrels.
5. Add Storybook examples under the same category, including native states and composition with existing recipes.
6. Update [Usage.md](Usage.md) with complete HTML, class/attribute contracts, theming and helper requirements.
7. Run `bun run test:styles`, the relevant browser tests, and the library/Storybook builds. Check keyboard interaction, narrow layouts, theme inheritance and exported assets when they apply.
