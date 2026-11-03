# Afterglow structure

Afterglow groups styles and components by their purpose. Native HTML supplies semantics and interaction; SCSS supplies appearance and layout. Optional TypeScript helpers cover behaviour that needs scripting. Add a Web Component only when native HTML and styling cannot provide the required functionality and fidelity.

| Category     | Responsibility                          | Current examples                                                                            |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `foundation` | Shared primitives and composition tools | Type scale, token registry, theme boundaries, generic layout and motion mixins              |
| `frame`      | Arrange and contain other elements      | Background, surface, panel, paper, application grid, master-detail, structural card, dialog |
| `indicate`   | Reflect changing or transient state     | Notification, linear/circular/staged progress and status colours                              |
| `interact`   | Accept user input                       | Button, FAB, removable chips, checkbox, radio, switch, slider, textarea, text field, menu item, breadcrumb, navigation links        |
| `present`    | Display lasting content                 | Article typography, card content, avatars, images, category tags and reusable icons                                 |

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

The shared `foundation/theme` loads `foundation/fonts` once per compilation. It declares bundled Lato WOFF2 faces for weights 100–900, normal and italic, with explicit mappings and no `local()` source. This avoids platform-dependent weight matching against installed fonts. Pure token and mixin modules still emit no CSS; custom compositions can load `foundation/fonts` independently. Font files and their licence live in `assets/lato/`.

The reusable `present/icon` recipe applies Feather SVG masks to native elements. It inherits colour, uses the `icon-size` token and composes with existing control child-spacing classes. `_assets.scss` forwards the generated root `_feather.scss` URL map. Run `bun run build:icons` after changing the supplied files; the style tests detect a stale catalogue. Pure icon mixins can emit a selected subset of names or style a consumer selector. Existing component-specific assets remain available for their established visual treatments.

The `indicate/progress` recipe retains native `progress` value/max semantics and label association. CSS styles the browser fill and track; `:indeterminate` drives a decorative animated segment on the wrapper. No helper, duplicate ARIA values or percentage custom property is needed. The full recipe includes reduced-motion, error, RTL and forced-colour treatments.

The `indicate/circular-progress` recipe also retains a native `progress` element. `enhanceCircularProgress` mirrors its native value/max into a decorative CSS ring and derives not-started, in-progress and complete states; `data-error` independently overrides the display while retaining the amount. The helper exposes writable title/value/max/error properties, observes native attribute and title changes, and owns the ring, `data-state` and `data-enhanced`. Without enhancement, the native bar is visible. State icons reuse the Feather assets through pure icon mixins; no Web Component or duplicate accessible progressbar is introduced.

The `indicate/staged-progress` recipe composes those circular controls inside an ordered list. CSS owns horizontal/vertical layout, RTL, scrolling and decorative connections. `enhanceStagedProgress` exposes the child controllers in DOM order, reconciles list changes and cleans up the circles it created. Each subtask retains independent progress and failure state; scheduling, retry policy and aggregate status belong to the application. Connections brighten after the preceding stage completes. Selective class imports include the circular recipe through Sass module deduplication.

The `interact/chip` recipe composes native text, an optional leading icon or a circular `present/avatar`, and an optional native remove button. Icon presence is independent of the filled, outlined and backdrop appearances; omit the icon element for text alone. Application handlers own removal and focus placement. It has no component runtime; automatic initials and image fallback reuse `enhanceAvatar`. The icon and avatar styles remain in `present`, so consumers loading individual categories include both categories when using those elements.

The `interact/slider` recipe uses one native range input for a single value, or two inputs with `data-range` for an interval. `enhanceSlider` owns the fill, unnumbered marks and temporary value bubbles. Native inputs retain values, submission, keyboard focus and thumb dragging; the helper coordinates shared bounds, prevents crossing and handles track clicks for the pair. Keep each handle's accessible name distinct and preserve its DOM order.

The `interact/text-field` recipe retains native input editing, types, validation and form participation. CSS owns standard/backdrop treatments, an independent `data-compact` size flag, placeholder-style labels, optional icon slots and status glyphs. Every variant has a full border and shows its label inside the empty input, preserving the accessible name when populated. `enhanceTextField` optionally adds inline native/custom validation, persistent application errors and reset/cleanup handling; it does not replace native values or events. The helper owns its generated error description and restores externally supplied validation on cleanup.

The `present/image` recipe composes a native image and optional caption. `enhanceImage` synchronizes an inaccessible decorative copy with the successfully loaded `currentSrc`, avoiding canvas sampling and retaining native responsive source selection. Image URLs remain native `src` values, and title/overline presence is determined by supplied text. The backlight is opt-in through `data-backlight`.

The `present/tag` recipe styles compact category annotations with default and backdrop appearances. Tags have no selected state. Static annotations use spans; native links/buttons can supply application actions. Applied filter tags may compose with a text field as siblings of its input, with hidden form inputs carrying their values. Applications own filtering and token creation/removal; the recipe does not introduce an editable composite control.

The `interact/popup-menu` recipe composes existing menu items inside native auto popovers. The platform owns the top layer, light dismissal and Escape; `enhancePopupMenu` adds action-menu semantics, keyboard focus, typeahead, selection events and optional nested hover menus. CSS anchors handle placement, with a measured positioning fallback when unavailable. Items remain native buttons/links and application handlers own commands and checked states. It introduces no custom element or modal focus trap.

The `interact/token-field` recipe composes the existing text-field surface, avatar chips and popup/menu-item styles. `enhanceTokenField` implements a catalogue-backed multi-value combobox with listbox suggestions filtered by case-insensitive substrings of labels and values; it keeps DOM focus in the input via `aria-activedescendant`. Selected values become chips and repeated hidden form inputs, with native disabled/reset semantics and selection-based required validation. Native popovers provide the top layer; the action-menu helper is deliberately not applied because a combobox has different keyboard and focus semantics. The helper owns generated DOM and child avatar lifecycles.

## Compatibility

Card content groups its title and body inside `ag-card-content__main`, between the optional overline and action row. The body has 6px vertical margins, while sections use the shared 4px spacing token. It remains a native HTML/CSS recipe and composes existing buttons and surfaces. Update earlier flat card-content markup by wrapping its title and body in the main section.

Slider endpoint-label markup (`ag-slider__labels` and `ag-slider__label`) has been replaced by transient value tooltips. Remove that old decorative markup when updating consumers.

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
| Tabbed view, strip and tabs | [Tabbed View 19:1157](https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=19-1157), [Tab Strip 18:1129](https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=18-1129), [Tab 19:1137](https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=19-1137) |
| Menu item | [Menu Item 25:1195](https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=25-1195) |
| Breadcrumb | [Breadcrumb 87:13](https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=87-13), [Breadcrumb Label 87:5](https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=87-5) |
| Image | [Image 252:288](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=252-288) |
| Card content              | [Card content 235:17](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=235-17)   |
| Floating action button    | [FAB 284:1](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=284-1)              |
| Avatar                    | [Avatar 204:112](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=204-112)       |
| Progress bar              | [Progress bar 146:7](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=146-7)    |
| Circular progress         | [Circular progress 146:96](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=146-96) |
| Staged progress           | [Staged Progress 146:168](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=146-168) |
| Slider                    | [Slider 147:2](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=147-2)          |
| Chip                      | [Chip 151:12](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=151-12)           |
| Tag                       | [Tag 309:0](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=309-0)               |
| Text field                | [TextField 143:33](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=143-33)     |

The application grid, master-detail arrangement and structural card are flexible layout recipes inspired by Tai. Their widths, responsive breakpoint and composition rules are library choices, not assertions that Figma specifies a complete responsive application shell. They use existing Afterglow surfaces. Figma's fixed sample dimensions become content-driven sizing where needed: textareas have a minimum height, cards grow with content, and navigation labels can wrap.

The `frame.layout-index-detail` mixin and `ag-index-detail` recipe implement the [AFMaster Index-Detail sketch](https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=20-1159). Index uses the existing surface token, Detail the panel token, and Inspector the paper token. The adjoining panes retain the sketch's proportions, 8px Index inset, logical top corners and Inspector keyline. CSS releases an omitted/hidden Inspector column, contains scrolling within bounded panes and stacks panes below a 48rem container width. Responsive behaviour is a library choice; the sketch specifies only the wide arrangement. Application code owns both levels of selection. Optional `enhanceIndexDetail` animates Inspector visibility by interpolating grid tracks while holding the pane's content size constant. It clips the slide, mirrors it in RTL, uses rows in stacked mode, handles reversals and restores focus before exit. The legacy master-detail recipe stays compatible.

Shared motion follows the earlier `af-react` phase/speed model. Foundation primitives define curves, four speeds and entry/exit/stagger delays. `foundation.motion-transition` and `getMotionOptions` select the same tokens and speed mapping, with exits one speed faster. JavaScript resolves theme-local CSS values when motion starts and parses fractional seconds correctly. Reduced motion removes duration and delay. Layout motion lifecycle belongs to the Index-Detail helper, leaving the timing helper reusable for other components.

Keep the existing visual defaults when reorganising code. Resolve visual questions against Figma, and keep consumer-specific theme values in consumer overrides.

The `interact/paginator` recipe follows [Mobile Paginator 149:1](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=149-1), including numbered and PrevNext variants. It uses shared Lato, surface/control text tokens and the exact local selected-page artwork. The opt-in `enhancePaginator` helper generates native page buttons and bounded page windows, owns current/disabled state and focus retention, and emits `ag-page-change` for application-owned content loading. CSS can also style native server-rendered page links without enhancement.

The `frame/popover` recipe is an Afterglow interpretation of [Apple's popover guidance](https://developer.apple.com/design/human-interface-guidelines/popovers), with no Figma source. It uses existing panel, type, spacing and motion tokens, a small pointer, and dedicated width/radius/gap/shadow tokens. `enhancePopover` adds nonmodal dialog semantics and measured placement to native auto popovers. Measurement keeps the pointer attached across viewport clamping, side changes, RTL and visual-viewport resizing without depending on CSS anchor support. Native popovers own the top layer, Escape and outside-click dismissal; CSS discrete transitions preserve native dismissal timing while animating supported exits. Content and application state stay mounted. The helper restores managed attributes/styles on disposal and does not apply action-menu keyboard semantics or a modal focus trap.

## Adding a recipe

1. Choose its category and native semantic element; document any behaviour that needs a helper.
2. Inspect the relevant Figma component, reuse shared tokens and export exact assets where applicable.
3. Add any new default tokens to the owning category map. The registry exposes them automatically; avoid renaming existing tokens during unrelated work.
4. Implement pure mixins and a small class-emission module; add them to the category barrels.
5. Add Storybook examples under the same category, including native states and composition with existing recipes.
6. Update [Usage.md](Usage.md) with complete HTML, class/attribute contracts, theming and helper requirements.
7. Run `bun run test:styles`, the relevant browser tests, and the library/Storybook builds. Check keyboard interaction, narrow layouts, theme inheritance and exported assets when they apply.
