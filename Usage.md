# Using Afterglow

Afterglow is a design system built from native HTML and SCSS. Add its stylesheet, use the HTML recipes below, and add JavaScript helpers where the interaction needs them. There are no custom elements to register and no FAST or Lit runtime to load.

This guide describes the current consumer API. New components and changes to existing components should be documented here alongside their Storybook examples. See the [README](README.md) for working on the library, running tests and migrating older custom-element markup.

- [How to use the API](#how-to-use-the-api)
- [Choose the behaviour you need](#choose-the-behaviour-you-need)
- [Frames and typography](#frames-and-typography)
- [Application and content layouts](#application-and-content-layouts)
- [Articles and card content](#articles-and-card-content)
- [Images](#images)
- [Avatars](#avatars)
- [Icons](#icons)
- [Tags](#tags)
- [Buttons](#buttons)
- [Chips](#chips)
- [Textareas](#textareas)
- [Text fields](#text-fields)
- [Navigation](#navigation)
- [Checkboxes](#checkboxes)
- [Radios and radio groups](#radios-and-radio-groups)
- [Switches](#switches)
- [Sliders](#sliders)
- [Progress bars](#progress-bars)
- [Notifications](#notifications)
- [Dialogs](#dialogs)
- [Forms and optional control behaviour](#forms-and-optional-control-behaviour)
- [Themes and SCSS](#themes-and-scss)
- [Using a UI framework](#using-a-ui-framework)
- [Future Web Components](#future-web-components)
- [Keeping this guide current](#keeping-this-guide-current)

## How to use the API

Load Afterglow's compiled stylesheet once, before your application's overrides. The examples below assume it is already loaded. With a bundler, the stylesheet import is `import "ag/css"`; a plain HTML page can link to a served copy of `afterglow.css`. When serving compiled files directly, keep the accompanying `dist/assets/` folder beside the CSS file so icons and the Avatar font resolve. Bundlers process these relative asset URLs when importing the stylesheet.

Then use native HTML with Afterglow's classes:

```html
<button type="button" class="ag-button" data-variant="primary">Continue</button>
```

This button needs no Afterglow JavaScript. Its focus, activation and disabled behaviour come from the browser. Attach your application's click handler when it needs to perform an action.

| API                          | Purpose                                      | Example                                         |
| ---------------------------- | -------------------------------------------- | ----------------------------------------------- |
| Native element               | Semantics and built-in interaction           | `<button>`, `<input>`, `<fieldset>`, `<dialog>` |
| `ag-*` class                 | Apply a component's appearance               | `class="ag-button"`                             |
| `ag-*__*` class              | Style a child in a component recipe          | `class="ag-check__label"`                       |
| Native attribute or property | Values, state and form behaviour             | `disabled`, `checked`, `name`, `input.value`    |
| `data-*` attribute           | Choose an Afterglow variant or option        | `data-variant="primary"`                        |
| CSS custom property          | Theme or size an element and its descendants | `--panel`, `--body-text-size`                   |
| Optional helper              | Add behaviour to an existing native element  | `enhanceSlider(element)`                        |

Apply the component class to the element shown in its recipe. A native button can be styled with one class; checkboxes, switches and sliders require decorative children to reproduce the design. A class never changes an element's semantics: `<div class="ag-button">` is not a keyboard-accessible button.

Each recipe below shows its required structure, supported options and any additional behaviour. Use `data-variant` on the element specified by the recipe; putting it on an arbitrary ancestor does not select a variant for every descendant. Boolean HTML attributes and presence-based options such as `data-dangerous` are turned off by removing them, not by setting them to `"false"`.

When a recipe needs a helper, import it from `ag` and initialise it after the markup exists. These imports do not load styles or register custom elements. A plain browser module can import the same helpers from a served copy of `afterglow.mjs`.

## Choose the behaviour you need

Recipes are grouped by their purpose. **Frame** arranges and contains other elements; **Indicate** reflects transient state; **Interact** accepts user input; **Present** displays lasting content. **Foundation** supplies shared tokens, typography, layout and motion tools. These categories organise the source and Storybook; existing class names and helper imports stay the same.

| Part of the system                          | HTML and CSS provide                                                                     | Optional JavaScript provides                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Frames and typography                       | Backgrounds, colour, depth and type styles                                               | Nothing required                                                                                             |
| Application, master-detail and card layouts | Responsive arrangement of semantic regions                                               | Your application chooses which regions to render or hide                                                     |
| Articles and card content                   | Scoped headings, body text, content spacing and action layout                            | Nothing required                                                                                             |
| Images | Native image URLs, alternative text, captions and responsive sizing | `enhanceImage` synchronizes the optional blurred backlight |
| Avatars                                     | Photo, blank and static-initials variants, shapes and sizes                              | `enhanceAvatar` derives initials from `name`, fits letters and handles photo fallback                        |
| Icons                                       | Feather glyphs, inherited colour and configurable size                                  | Nothing required                                                                                             |
| Tags                                        | Compact category annotations and applied filter tokens, with default/backdrop appearances | Your application manages the filters; no helper required |
| Buttons                                     | Appearance, focus, activation and native form actions                                    | Your application's action handlers                                                                           |
| Chips                                       | Five visual variants, optional leading icons or circular avatars and a native remove button | Your application handles removal; `enhanceAvatar` supplies automatic initials and photo fallback             |
| Textareas                                   | Labels, editing, resizing, validation, disabled/read-only states and form participation  | Nothing required                                                                                             |
| Text fields                                 | Native input types, labels, hints, icons, visual states, validation and form participation | `enhanceTextField` adds optional inline constraint/custom validation and persistent server errors            |
| Navigation                                  | Styled links, current-location appearance and native link activation                     | Your application updates `aria-current` when the location changes                                            |
| Checkboxes, radios and switches             | Selection, labels, keyboard activation, disabled states and form participation           | `enhanceControls` adds read-only behaviour, extra radio shortcuts and mixed-state reset handling             |
| Sliders                                     | A styled native range input with native values and interaction                           | `enhanceSlider` synchronises fill, marks and value tooltips, coordinates two handles, and normalises vertical/RTL arrows  |
| Notifications                               | Four visual variants, native popover visibility, six positions and a close button        | `enhanceNotification` adds optional timeouts, placement within a view, stacking, animation and announcements |
| Progress bars                               | Native values, default/error/caution appearance, labels and indeterminate animation      | Your application updates the native `value` and `max` properties and status text                            |
| Circular progress                           | Native progress semantics, title and a fallback bar                                     | `enhanceCircularProgress` adds the ring, four states, title updates and optional indeterminate animation      |
| Staged progress                             | An ordered list of circular progress controls, horizontal/vertical layout and connecting lines | `enhanceStagedProgress` enhances each stage and reconciles added, removed and reordered subtasks          |
| Dialogs                                     | A styled native dialog, modal behaviour and HTML invoker commands in supporting browsers | `enhanceDialog` adds animated closing, dismissal requests and optional non-modal focus containment           |

All Storybook examples use this same native implementation. **Overview** combines controls with helpers. **Native HTML / CSS Only** demonstrates controls without Afterglow helpers; **States** includes enhanced behaviours; **Declarative Dialog** demonstrates HTML invoker commands. Storybook itself uses JavaScript to render these examples.

Preserve the child structure and `.ag-*` classes in the recipes. For checkboxes, radios and switches, the input must precede its decorative siblings so CSS can respond to its state. Keep decorative elements `aria-hidden="true"`; the native input supplies the accessible control.

## Frames and typography

Apply frame classes to containers with the semantics your page needs:

| Class           | Use                                                                         |
| --------------- | --------------------------------------------------------------------------- |
| `ag-appframe`   | Application container with a minimum height of 100% of its containing block |
| `ag-background` | Gradient backdrop and its foreground colour                                 |
| `ag-surface`    | Surface colour, foreground and shadow                                       |
| `ag-panel`      | Panel colour, foreground and shadow                                         |
| `ag-paper`      | Paper colour, foreground and shadow                                         |

These surface classes supply appearance. Add one of the layout recipes below when you want Afterglow to arrange regions, or use your own application layout. Percentage heights need a containing block with an appropriate height.

```html
<main class="ag-appframe ag-surface ag-body">
  <section class="ag-panel preferences" aria-labelledby="preferences-title">
    <h1 id="preferences-title" class="ag-h1">Preferences</h1>
    <p>Choose how you would like to hear from us.</p>
    <p class="ag-caption">You can change these settings at any time.</p>
  </section>
</main>
```

```css
.preferences {
  max-width: 40rem;
  margin: 2rem auto;
  padding: 2rem;
}
```

Use `ag-body` for body text, `ag-caption` for captions and `ag-h1` through `ag-h5` for heading styles. Choose actual heading elements for the document hierarchy; a class does not add heading semantics. Afterglow bundles Lato WOFF2 fonts with explicit weight mappings: 100 Hairline, 200 Thin, 300 Light, 400 Regular, 500 Medium, 600 Semibold, 700 Bold, 800 Heavy and 900 Black, including italics. No installed font or external font service is required. The Avatar recipe separately bundles Comfortaa for its initials treatment.

The full stylesheet and shared theme include the font declarations. When serving compiled CSS directly, keep `assets/lato/` beside `afterglow.css`; bundlers can resolve these URLs for you. Faces load only when used, with system fallbacks displayed while loading (`font-display: swap`). Override `--body-font-stack` and `--title-font-stack` to use your own typeface. Pure Sass mixins remain free of CSS output: load `foundation/theme` for the default theme and fonts, or `foundation/fonts` for the fonts alone. Bundled fonts include their SIL Open Font Licence.

## Application and content layouts

Opt into the application grid with `data-layout="application"`. The plain `ag-appframe` class retains its original behaviour.

```html
<div class="ag-appframe ag-background ag-body" data-layout="application">
  <header class="ag-appframe__header">Application title</header>
  <nav class="ag-appframe__nav ag-panel" aria-label="Main">
    <!-- Navigation recipe -->
  </nav>
  <main class="ag-appframe__main ag-paper">Main content</main>
  <aside class="ag-appframe__tools ag-panel" aria-label="Tools">Tools</aside>
</div>
```

Regions must be direct children. On wider screens, the header spans the top, with navigation, main content and tools below it. Omit or add `hidden` to the navigation/tools region to release its column. At viewport widths of `48rem` or less, regions stack in DOM order. Set application padding and height in your CSS; the recipe does not impose scrolling or fixed positioning. The default navigation and tools widths are each `240px`, controlled by `--app-nav-width` and `--app-tools-width`, with a `16px` gap next to the main content.

For a list and its selected detail:

```html
<section class="ag-master-detail" aria-label="Notes">
  <aside class="ag-master-detail__master">List of notes</aside>
  <div class="ag-master-detail__detail">Selected note</div>
  <footer class="ag-master-detail__aux">Optional related content</footer>
</section>
```

`--master-width` defaults to `240px`. The auxiliary region spans both columns. Set `data-orientation="vertical"` on `ag-master-detail` to stack the regions inside a narrow desktop view; they also stack automatically at the same `48rem` viewport breakpoint. Your application owns selection and detail rendering.

A structural card arranges a header, body and footer without choosing a background:

```html
<article class="ag-card ag-panel">
  <header class="ag-card__header"><h2 class="ag-h3">Card title</h2></header>
  <div class="ag-card__body">Card body</div>
  <footer class="ag-card__footer">
    <button type="button" class="ag-button">Open</button>
  </footer>
</article>
```

Each region has `16px` padding by default; footer actions wrap and align to the end. Regions are optional. Compose `ag-panel`, `ag-paper` or another surface class separately. **Frame / Layouts** in Storybook demonstrates all three layouts using Afterglow's existing palette.

## Articles and card content

Use `ag-article` on a semantic article or content container. Its direct headings, paragraphs, lists, quotes and media receive content typography and spacing:

```html
<article class="ag-article ag-paper">
  <h1>A place for ideas</h1>
  <p>Keep observations and useful details together.</p>
  <h2>Getting started</h2>
  <ul>
    <li>Create your first note.</li>
    <li>Group related notes.</li>
  </ul>
  <blockquote>Leave room for the next idea.</blockquote>
</article>
```

The recipe uses Afterglow's mobile type ramp, including heading weights and letter spacing. Headings `h1`–`h5` follow the design; `h6` uses bold body size. Content blocks are bounded by `--max-line-width`. Default padding is `16px` vertically and `24px` horizontally, controlled by `--article-padding-block` and `--article-padding-inline`. Typography rules target direct children so nested controls and components retain their own styles. Use heading levels that fit the document hierarchy.

`ag-card-content` is a single content layout with optional overline, title, body and actions. Title and body share an `ag-card-content__main` section. It has no background or shadow of its own; it can stand alone with a surface class or sit inside another container:

```html
<article class="ag-card-content ag-paper" aria-labelledby="note-title">
  <p class="ag-card-content__overline">Notebook</p>
  <div class="ag-card-content__main">
    <h2 class="ag-card-content__title" id="note-title">An idea to revisit</h2>
    <div class="ag-card-content__body">
      <p>A short description of the note.</p>
    </div>
  </div>
  <footer class="ag-card-content__actions">
    <button type="button" class="ag-button" data-variant="flat">Open</button>
  </footer>
</article>
```

Overline, main content and actions are direct children of the card; title and body are direct children of `ag-card-content__main`. When updating older markup, move the existing title and body into this new main-content wrapper. Omit unused regions or hide them with `hidden`; a main section or action row with no visible children also disappears. If you omit the title, omit its `aria-labelledby` reference too.

In Storybook, visibility follows the text: clear `overlineText`, `title`, `textContent`, `actionOneLabel` or `actionTwoLabel` to omit that element. Whitespace-only text is also treated as empty. The main section and action row disappear when both of their text values are empty. When rendering native HTML in your application, apply the same check before including each region.

The card uses `8px` vertical padding and `4px` between sections. The body has `6px` vertical margins within the main section. The overline and main section have `16px` horizontal padding; action labels align with them through the buttons' padding. The title has a `2px` optical adjustment toward the inline start and uses Afterglow's third heading size and light weight. The body uses the smaller body size, and actions use bold smaller body text. Use the heading tag that fits your document hierarchy. Shared grid, typography and surface tokens supply the base styles.

Width and height follow the available space and content; the default Storybook sample is `311px` wide. Text and actions wrap in narrower containers. Compose existing `ag-button` elements for any actions and attach ordinary click handlers or use links for navigation; no behaviour helper or Web Component is required. For selective styles, load `present` for the content, `interact` for the buttons and `frame` if adding a surface class. **Present / Card Content** provides editable text controls, optional-content examples and responsive layouts; **Present / Article** demonstrates longer-form content.

## Images

`ag-image` belongs to **Present**. Use a native `figure`, `img` and optional `figcaption`. Assign the image URL through the image's `src` attribute. The image fills its frame with `object-fit: cover`; meaningful alternative text belongs in `alt`, independently of the visible title.

```html
<figure id="destination-photo" class="ag-image" data-backlight>
  <img class="ag-image__picture" src="/photos/lake.jpg"
       alt="Trees reflected in a lake under an evening sky.">
  <figcaption class="ag-image__caption">
    <p class="ag-image__overline">Vancouver</p>
    <h3 class="ag-image__title">Canada</h3>
  </figcaption>
</figure>
```

Omit the title or overline when its text is empty, and omit the caption when both are empty. Storybook's `title` and `overlineText` controls do this automatically, including whitespace-only values. Use the heading level appropriate to your page; the title's visual styling is independent of its tag. The radial scrim appears only with visible caption content. Long captions wrap and can scroll inside the image if necessary.

### Backlight and URL changes

The image and caption need no JavaScript. The optional `enhanceImage` helper creates a decorative blurred copy and keeps it synchronized with the loaded image:

```ts
import { enhanceImage } from "ag";

const photo = enhanceImage(document.querySelector<HTMLElement>("#destination-photo")!);
photo.imageUrl = "/photos/forest.jpg";
photo.backlight = false;
photo.update({ imageUrl: "/photos/coast.jpg", backlight: true });
photo.image.alt = "Waves breaking against a rocky coast.";

// When removing the view:
photo.destroy();
```

Pass `imageUrl` and `backlight` in the initial options if preferred. Omitted options preserve the authored source and `data-backlight` flag. Backlight is enabled by the presence of `data-backlight` or by setting `backlight: true`; remove the attribute or set the property to `false` to disable it. A missing flag leaves it off. The default Storybook example enables it.

| Member | Purpose |
| ------ | ------- |
| `image` | Native image for `alt`, `loading`, `srcset`, `sizes` and other image attributes |
| `imageUrl` | Read or assign `src`; assignment clears `srcset`/`sizes`, and an empty string removes the source |
| `backlight` | Read or set the boolean backlight flag |
| `update(options?)` | Apply optional settings or refresh from the loaded image |
| `destroy()` | Remove the generated copy and release observers/listeners; preserve the main image and caption |

Native changes to `src`, `srcset` and `sizes` are observed. The helper copies the successfully loaded `currentSrc`, so responsive source selection is retained. Empty or failed sources hide the backlight until a valid image loads. The copy has empty alternative text, is hidden from assistive technology and does not intercept pointer input. No canvas or pixel sampling is used. Repeated enhancement returns the existing controller. If a decorative copy was authored in the markup, the helper reuses it and restores its original attributes on cleanup.

For static HTML without a helper, place a second image before the main image, using the same URL:

```html
<img class="ag-image__backlight" src="/photos/lake.jpg"
     alt="" aria-hidden="true" draggable="false">
```

Keep `data-backlight` on the figure. In this mode your application must update both URLs and handle failures itself. Without backlight, keep only the main image and caption.

### Image sizing and theme

The default frame is `328 × 170px`, capped at its container's width. Override the figure's `inline-size` and `--image-aspect-ratio` for another size or shape. The corners use an `8px` radius. The caption sits at the bottom with a light H3 title and a smaller, partially transparent overline. Keep space around the frame for the blur; an ancestor with clipped overflow will cut it off.

| CSS token | Default |
| --------- | ------- |
| `--image-width` | `328px` |
| `--image-aspect-ratio` | `328 / 170` |
| `--image-radius` | `8px` |
| `--image-backlight-blur` | `16px` |
| `--image-caption-color` | `#f9f9f6` |
| `--image-shadow` | Two subtle elevation shadows |

Set `--image-position` (for example `center top`) to adjust the crop for both images. Shared typography tokens control text sizing. In forced-colour mode, the glow is hidden and the caption uses system colours. Load `present/image.classes` for this recipe alone, or use the pure `image.image` mixin from `present/image.mixins` with the shared theme.

**Present / Image** includes URL and text controls, backlight toggling, caption options, responsive layouts, live URL changes and a native HTML example. The bundled photograph is only sample content; consumers provide their own URL.

## Avatars

Avatars belong to **Present** and use native elements. A small helper supplies the writable `name` property and automatic initials; there is no custom element to register.

```html
<span id="author-avatar" class="ag-avatar" data-variant="initials"></span>
```

```ts
import { enhanceAvatar } from "ag";

const avatar = enhanceAvatar(
  document.querySelector<HTMLElement>("#author-avatar")!,
  {
    name: "James O’Toole",
  }
);

avatar.initials; // "jo"
avatar.name = "Ada Lovelace"; // Updates the initials and accessible name.

// When the owning view is removed:
avatar.destroy();
```

The helper creates and updates an `ag-avatar__initials` child, sets the full name as the avatar's accessible label and treats the visual letters as decorative. A `data-name` attribute can supply the initial name instead of the option; subsequent attribute changes are observed. The writable `name` property belongs to the returned controller, not the native `span`.

### Variants, sizes and photos

| Attribute      | Values                                            | Default   |
| -------------- | ------------------------------------------------- | --------- |
| `data-variant` | `image`, `initials`, `flat-initials`, `blank`     | `image`   |
| `data-size`    | `default` (40px), `header` (48px), `large` (80px) | `default` |
| `data-shape`   | `leaf`, `circle`, `square`                        | `leaf`    |

`initials` uses a light gradient and teal lettering; `flat-initials` uses a dark teal fill and light lettering. `blank` displays the Afterglow artwork. All variants support three sizes. Initials in circle/square shapes are centred.

Set `imageUrl` when enhancing an image avatar, or assign it later through the controller:

```html
<span
  id="profile-avatar"
  class="ag-avatar"
  data-variant="image"
  data-shape="circle"
></span>
```

```ts
const avatar = enhanceAvatar(
  document.querySelector<HTMLElement>("#profile-avatar")!,
  { name: "Ada Lovelace", imageUrl: "/people/ada.jpg" }
);

avatar.imageUrl = "/people/ada-new.jpg"; // Replace the photo.
avatar.imageUrl = ""; // Clear it and show initials, or blank artwork without a name.
avatar.update({ name: "Grace Hopper", imageUrl: "/people/grace.jpg" });
```

The helper creates a native `img.ag-avatar__image` when needed. `imageUrl` belongs to the returned controller and reads the current `src` attribute, or `""` when absent. Setting it preserves the selected variant, size and shape; the image is visible in the `image` variant. No default portrait is bundled into the helper: the photographs in Storybook are examples only.

Alternatively, supply the image directly in HTML. This example needs no helper:

```html
<span
  class="ag-avatar"
  data-variant="image"
  data-size="header"
  data-shape="circle"
  role="img"
  aria-label="Ada Lovelace"
>
  <img class="ag-avatar__image" src="/people/ada.jpg" alt="" />
</span>
```

Images fill the shape with `object-fit: cover`. Set `--avatar-image-position`, for example `50% 30%`, to adjust cropping. The helper makes missing, loading or failed images fall back to initials, or to the blank artwork if there is no usable name. It responds when the image loads, its source changes or the image element is replaced.

You can still manage native `img.src`, `srcset` and `sizes` directly. Omitting `imageUrl` preserves those attributes. Explicitly setting `imageUrl` replaces `src` and removes `srcset` and `sizes` so a responsive source cannot override the assigned URL; setting `""` clears all three. Other updates, such as changing `name`, leave the current image sources untouched.

### Initials and positioning

Automatic initials are lowercase. Extraction uses the first and last name parts, skips middle names and common English titles/suffixes, understands `Family, Given` ordering, and keeps Unicode graphemes intact:

| Name                          | Initials |
| ----------------------------- | -------- |
| `James O’Toole`               | `jo`     |
| `Dr. Mary Jane Watson, Ph.D.` | `mw`     |
| `Lovelace, Ada`               | `al`     |
| `Prince`                      | `p`      |
| `Jean-Luc`                    | `jl`     |
| `Jean-Luc Picard`             | `jp`     |
| `Álvaro Núñez`                | `án`     |
| `王 小明`                     | `王小`   |

A single name without separators yields one initial; the helper does not guess surname boundaries in a compact name such as `王小明`. Pass `locale`, such as `"tr"`, for locale-specific casing; otherwise the helper uses the nearest HTML `lang` value. `getAvatarInitials(name, locale?)` is also exported for applications that want to generate their own markup, including server rendering.

Name conventions vary. Use `avatar.update({ initials: "JD" })` to override the automatic choice; supplied case is preserved, whitespace is removed and at most two graphemes are used. `avatar.update({ initials: null })` restores automatic extraction.

Latin pairs use an oversized monogram at the lower right. The helper measures the rendered font, reduces wide pairs and limits cropping of a narrow final letter. Single initials and non-Latin scripts are centred. An empty name uses the blank artwork. Fitting updates after font loading, avatar resizing, size/shape changes and name updates. Call `avatar.update()` after other application-driven font/theme changes that do not resize the avatar.

For static HTML, supply the initials yourself:

```html
<span
  class="ag-avatar"
  data-variant="initials"
  data-initial-count="2"
  role="img"
  aria-label="James O’Toole"
>
  <span class="ag-avatar__initials" aria-hidden="true">jo</span>
</span>
```

Use `data-initial-count="1"` to centre a single initial, or `data-initial-layout="centered"` for another centred monogram. Automatic extraction and fitting require the helper.

### Accessibility, theming and lifecycle

The helper uses the full name as the accessible label, with `"Unknown user"` for an empty name. Override this through `label` when a different or translated label is needed. Set `decorative: true`, or initialise an element with `aria-hidden="true"`, when adjacent text already identifies the person. For an interactive avatar, put a decorative avatar inside a labelled native button or link; the Avatar itself does not introduce focus or interaction.

`update(options)` accepts the same `name`, `imageUrl`, `initials`, `locale`, `decorative` and `label` options as initialisation. `destroy()` removes observers, image listeners and pending fitting work, leaving the rendered avatar as static HTML. Repeated enhancement returns the existing controller; use `update()` to change its options. No custom events are emitted.

Size tokens are `--avatar-size`, `--avatar-header-size` and `--avatar-large-size`; matching type tokens are `--avatar-initials-size`, `--avatar-header-initials-size` and `--avatar-large-initials-size`. `--avatar-font-stack`, `--avatar-shade` and `--avatar-shadow` control the font, gradient endpoint and shadow. Colours reuse existing paper, panel, backdrop and control tokens. Properties beginning `--ag-avatar-` are internal fitting/layout values.

The stylesheet bundles the Comfortaa font, with its licence, and loads it from the local assets directory. For selective Sass use, load `present/avatar.classes`; when composing only pure mixins, include `avatar.font` once as well as `avatar.styles` and the shared theme.

**Present / Avatar** includes name and image URL editors, a **Variants** gallery showing all 18 appearance and size combinations, varied names, photo fallback and a static HTML example.

## Icons

Use an empty native `span` with `ag-icon` and a Feather name in `data-icon`. No JavaScript, icon font or Web Component is required:

```html
<span class="ag-icon" data-icon="search" aria-hidden="true"></span>
```

All 287 supplied Feather icons are available. Names match the SVG filenames without `.svg`, such as `search`, `save`, `plus`, `arrow-right`, `user` and `trash-2`. **Present / Icon / Gallery** provides a searchable catalogue. Changing `data-icon` changes the glyph. A missing or unknown name displays an empty box.

Icons inherit the surrounding CSS `color` and use a square `24px` box by default. Set `--icon-size` on an icon or an ancestor to change the size; use `1em` to follow the text size. Colour comes from normal CSS, so themed text, links and button variants colour their icons automatically:

```html
<p style="color: var(--error); --icon-size: 1em">
  <span class="ag-icon" data-icon="alert-circle" aria-hidden="true"></span>
  Could not save your changes.
</p>
```

### Composing with controls

Place the icon inside the native button or link. Buttons already provide `ag-button__start` and `ag-button__end` for spacing before or after their label:

```html
<button type="button" class="ag-button" data-variant="primary" style="--icon-size:20px">
  <span class="ag-icon ag-button__start" data-icon="save" aria-hidden="true"></span>
  Save
</button>

<button type="button" class="ag-button" style="--icon-size:20px">
  Continue
  <span class="ag-icon ag-button__end" data-icon="arrow-right" aria-hidden="true"></span>
</button>

<button type="button" class="ag-button" aria-label="Search">
  <span class="ag-icon" data-icon="search" aria-hidden="true"></span>
</button>

<button type="button" class="ag-fab" aria-label="Add note">
  <span class="ag-icon" data-icon="plus" aria-hidden="true"></span>
</button>
```

The button owns focus, click handling and `disabled`. The icon inherits its colour and is covered by the button's disabled opacity. In navigation, use `ag-icon` inside `ag-location-index__link`; the link supplies the gap, and `--icon-size:16px` matches the existing navigation icon box. Directional arrows keep their named direction in RTL; select the opposite icon explicitly when needed.

### Accessibility and assets

Keep decorative icons `aria-hidden="true"`, especially when nearby text already explains them. For an icon-only button, provide `aria-label` on the button. If a standalone icon conveys meaning, give the icon `role="img"` and an accessible label instead of hiding it:

```html
<span class="ag-icon" data-icon="wifi-off" role="img" aria-label="Offline"></span>
```

The supplied SVGs are used as CSS masks. Their rounded strokes scale with the icon; size and colour are configurable, while individual SVG stroke settings are not exposed through the mask. The recipe is intended for empty `span` elements. Use ordinary `img` or inline `svg` markup separately if your application needs those elements.

The build places the original SVGs and their licence in `dist/assets/feather/`. Serve that directory beside `afterglow.css`, or let your bundler resolve the CSS asset URLs. The library does not contact an external icon service. Native `hidden` removes an icon. In forced-colour mode, icons use the parent's system text colour where supported, with a system foreground fallback in other browsers.

### Selective SCSS

The full stylesheet and the `present` category include the catalogue. Use `present/icon.classes` to load the icon recipe alone. To emit only selected names, use the pure mixin with the shared theme:

```scss
@use "ag/scss/foundation/theme";
@use "ag/scss/present/icon.mixins" as icon;

@include icon.styles(("search", "save", "x"));

// Or apply the recipe to your own selector, without emitting ag-icon classes:
.search-symbol {
  @include icon.icon("search");
}
```

`icon.glyph("name")` changes the image on a selector that already includes `icon.icon`. Unknown names in Sass are compile errors. **Present / Icon** demonstrates sizing, colour and composition; **Interact / Button / With Icons** shows common button arrangements.

## Tags

Tags annotate content with a category or display an applied filter. Use a plain `span`:

```html
<span class="ag-tag"><span class="ag-tag__label">Design</span></span>
<span class="ag-tag" data-variant="backdrop">
  <span class="ag-tag__label">Research</span>
</span>
```

There are two appearances: default and backdrop. Both use their full-strength fill; tags have no separate selected state or selection flag.

Tags can sit alongside an input inside an existing text field's control wrapper. A native input cannot contain HTML, so the tags and input are siblings. Hidden inputs carry the applied filter values when submitting a form:

```html
<label for="note-search">Search notes</label>
<div class="ag-text-field">
  <div class="ag-text-field__control" style="flex-wrap:wrap;padding-block:8px">
    <span class="ag-tag"><span class="ag-tag__label">Design</span></span>
    <input type="hidden" name="category" value="design">
    <input class="ag-text-field__input" id="note-search" name="query"
      type="search" placeholder="Search…" autocomplete="off"
      style="flex:1 1 120px;min-block-size:24px">
  </div>
</div>
```

Read filter values with `new FormData(form).getAll("category")`. Tag creation, removal and search results belong to the application; keep any hidden inputs in sync with the displayed tags. The **Filter Field** story demonstrates applied filters with editable text. Use `ag-tag` on an anchor for category navigation, or a `button type="button"` for an action. Plain annotations are not interactive or keyboard-focusable.

Tags are at least `24px` high and `64px` wide, grow with their text and stay within their container. The `ag-tag__label` child truncates long labels with an ellipsis without removing their accessible text. Lay out collections with wrapping flex/grid and a gap. RTL, keyboard focus, native button disabled/hidden and forced-colour states are supported. No icon, close button or Web Component is required.

Size tokens are `--tag-height`, `--tag-min-width`, `--tag-padding-inline` and `--tag-radius`. Typography uses the body font and caption size. Default colours use `--ctrl-fill-solid` and `--on-ctrl-fill-solid`; backdrop colours use `--onBackdrop` and `--onSurface`. Load `present/tag.classes` for this recipe alone, or compose the pure `tag`/`styles` mixins from `present/tag.mixins` with the shared theme. A composed text field also needs the `interact` styles.

## Buttons

```html
<button type="submit" class="ag-button" data-variant="primary">Save</button>
<button type="reset" class="ag-button">Reset</button>
<button type="button" class="ag-button" data-variant="outline">Cancel</button>
<button type="button" class="ag-button" data-variant="flat">
  More options
</button>
<button type="button" class="ag-button" data-dangerous>Delete</button>
<button type="button" class="ag-button" disabled>Unavailable</button>
<a href="/settings" class="ag-button">Settings</a>
```

`data-variant` accepts `default` (also used when omitted), `primary`, `outline` or `flat`. Add `data-dangerous` for destructive actions; remove the attribute to turn it off. `data-dangerous="false"` still has the attribute and therefore still applies the style.

Use explicit button types: `button` for application actions, `submit` for form submission and `reset` for native reset. Use an anchor with `href` for navigation. The native `disabled` attribute applies to buttons, not anchors; `aria-disabled` alone does not disable a link.

Optional leading and trailing content goes inside `ag-button__start` and `ag-button__end` spans:

```html
<button type="button" class="ag-button">
  <span class="ag-button__start" aria-hidden="true">+</span>
  Add item
</button>
```

Give an icon-only button an accessible name with `aria-label`.

### Floating action button

Use a separate native button recipe for the circular `56 × 56px` floating action button:

```html
<button type="button" class="ag-fab" aria-label="Add note">
  <span class="ag-fab__icon" data-icon="add" aria-hidden="true"></span>
</button>
```

The add icon is included with the stylesheet. You can supply your own decorative image with `class="ag-fab__icon"` and `alt=""`; the icon box is `24 × 24px`. Use native `disabled` when unavailable. The application owns the action and placement; the class does not pin the button to a screen corner. **Interact / FAB** shows native activation and the disabled state.

The fill uses `--ctrl-fill-solid` at 60% opacity with background blur, a cyan inner glow and a soft drop shadow. Its appearance therefore changes with the surface behind it. The 1px inside stroke overlays the glow; it does not reduce the button or icon dimensions. `--fab-border`, `--fab-inner-glow` and `--fab-blur` control these details. The Storybook **background** control and **Surfaces** story compare dark, panel and backdrop surfaces; these are preview settings, not additional FAB variants.

## Chips

A chip represents an item such as a location, category or person. Use a native container with an optional remove button:

```html
<span class="ag-chip" data-variant="default">
  <span class="ag-chip__icon ag-icon" data-icon="map-pin" aria-hidden="true"></span>
  <span class="ag-chip__label">Portland</span>
  <button class="ag-chip__remove" type="button" aria-label="Remove Portland">
    <span class="ag-icon" data-icon="x-circle" aria-hidden="true"></span>
  </button>
</span>
```

The five `data-variant` values are:

| Variant | Leading content | Appearance |
| --- | --- | --- |
| `default` | Optional icon | Filled, 36px tall |
| `outlined` | Optional icon | Transparent with an outline, 36px tall |
| `avatar` | Circular avatar | Filled, 30px tall |
| `avatar-outlined` | Circular avatar | Transparent with an outline, 30px tall |
| `backdrop` | Optional icon | Backdrop palette and smaller text, 32px tall |

These heights describe the default tokens and a single line of text. Width follows the content, up to the available space. Set `width` on `.ag-chip` when you want a particular width; the label truncates with an ellipsis if needed. Its full text remains available to assistive technology. Use a flex container with `flex-wrap: wrap` and your preferred gap for a collection of chips. Direction and spacing also work inside `dir="rtl"`.

**Icons.** Choose any Feather glyph with `data-icon`. For your own icon, apply `.ag-chip__icon` to an `<img alt="">` or use it as a wrapper for an SVG or another icon component. The leading slot is 20px square and does not depend on a particular glyph. Close buttons remain 24px square, or 28px in avatar variants. Keep decorative icons hidden from assistive technology. Image files retain their own colours; `ag-icon` masks inherit the chip's colour.

**Text only.** Omit the leading `.ag-chip__icon` element and choose `default`, `outlined` or `backdrop` as usual. Text-only is a content choice, so it works with all three appearances. The close button remains optional:

```html
<span class="ag-chip" data-variant="outlined">
  <span class="ag-chip__label">Design</span>
  <button class="ag-chip__remove" type="button" aria-label="Remove Design">
    <span class="ag-icon" data-icon="x-circle" aria-hidden="true"></span>
  </button>
</span>
```

Change `data-variant` to `default` for a filled chip or `backdrop` for the backdrop palette. Omit the button for a chip containing just text; its start and end spacing will be balanced. To toggle an existing icon, set its native `hidden` property:

```js
chip.querySelector(".ag-chip__icon").hidden = !withIcon;
```

Storybook exposes a boolean `withIcon` control and a **None** choice in the icon selector. Either removes the leading icon, independently of the appearance and close button. Its example builder also omits the icon when `icon` is missing or blank. Avatar variants continue to display their circular avatar. These example arguments generate native markup; no chip helper or custom element is needed.

**Avatars.** Replace the icon with the existing Avatar recipe and set `data-shape="circle"`. Inside a chip, its size is 28px with no extra shadow or border:

```html
<span class="ag-chip" data-variant="avatar-outlined">
  <span class="ag-avatar" data-shape="circle" data-variant="image" aria-hidden="true">
    <img class="ag-avatar__image" src="/people/sandra.jpg" alt="">
  </span>
  <span class="ag-chip__label">Sandra Adams</span>
  <button class="ag-chip__remove" type="button" aria-label="Remove Sandra Adams">
    <span class="ag-icon" data-icon="x-circle" aria-hidden="true"></span>
  </button>
</span>
```

Photo, initials, flat-initials and blank avatars all work. For automatic initials or photo fallback, initialise the existing helper on the avatar, not the chip:

```js
import { enhanceAvatar } from "ag";

const avatar = enhanceAvatar(chip.querySelector(".ag-avatar"), {
  name: "Sandra Adams",
  imageUrl: "/people/sandra.jpg",
  decorative: true,
});
```

Set `data-variant="initials"` on the avatar to show initials immediately. `avatar.name` and `avatar.imageUrl` remain writable; call `avatar.destroy()` when disposing of the element. The [Avatar guide](#avatars) also covers initials supplied directly in HTML.

**Removal.** The chip body displays content; its remove button is the interactive element. Attach your application's handler to that button and update the underlying selection or data. Afterglow does not automatically delete content or change form values:

```js
chip.querySelector(".ag-chip__remove").addEventListener("click", () => {
  // Update application state and move focus to the next chip or an input.
  chip.remove();
});
```

Give each remove button a translated accessible label identifying the item. Keep `type="button"` so removal never submits a surrounding form. Use native `disabled` on the remove button to disable it and dim the chip. Omit the button, or set its `hidden` property, for a chip that cannot be removed. The whole chip supports native `hidden` too. A chip itself has no form value or selection state; if it represents submitted data, maintain that data in your form or application.

The label has an 8px start margin and a 16px end margin, set with logical properties on `.ag-chip__label`. Text-only chips without a visible close button use 8px for both margins. The `chip-icon-size` and `chip-avatar-size` theme tokens control leading content size. `chip-remove-size` controls the close button independently in non-avatar variants; avatar variants use `chip-avatar-size` for both the avatar and close button. Colours and typography reuse the existing surface, backdrop and body tokens. With category-only Sass imports, include both `interact` and `present` for chips composed with icons or avatars. The pure `interact/chip.mixins` module offers `chip` for container declarations and `styles` for the complete recipe, including child and state selectors.

## Textareas

A labelled native textarea works without a helper:

```html
<label class="ag-body" for="notes">Notes</label>
<textarea
  class="ag-textarea"
  id="notes"
  name="notes"
  placeholder="Text area…"
></textarea>
```

For the floating-label treatment, put the textarea before its associated label and keep the single-space placeholder:

```html
<div class="ag-textarea-field">
  <textarea
    class="ag-textarea"
    id="description"
    name="description"
    placeholder=" "
  ></textarea>
  <label class="ag-textarea-field__label" for="description">Description</label>
</div>
```

The label becomes smaller when the textarea has focus or content. The single-space placeholder lets CSS detect an empty value; it is not an accessible name. Always keep the real label and a unique matching ID. Native `required`, `readonly`, `disabled`, `maxlength`, `rows`, validation, reset and `FormData` work normally. `aria-invalid="true"` displays an application-reported error; connect an explanatory message with `aria-describedby`. Read-only text remains selectable and is submitted; disabled text is excluded from submission.

The textarea fills its container and can be resized vertically. `--textarea-min-height` defaults to `158px`; override it to allow a shorter field. `--field-hint` controls placeholder/label colour, and `--keyline` controls the border. Fill, text and inset shadow use the existing paper, on-paper and surface tokens. **Interact / Textarea** includes content, states and plain HTML examples.

## Text fields

Text fields belong to **Interact** and use native `input` elements. The standard and backdrop treatments, each with an optional compact size, need only HTML and CSS. Use native `type="text"`, `search`, `password`, `email`, `url`, `tel` or `number` for the appropriate editing behaviour. Password masking, search clearing where supported, numeric controls, autocomplete, selection, keyboard input, form submission and reset remain browser features.

```html
<div id="email-field" class="ag-text-field">
  <div class="ag-text-field__control">
    <input class="ag-text-field__input" id="email" name="email"
           type="email" autocomplete="off" required placeholder=" "
           aria-describedby="email-hint">
    <label class="ag-text-field__label" for="email">Email address</label>
  </div>
  <p class="ag-text-field__hint" id="email-hint">Use an address you can receive mail at.</p>
</div>
```

Keep the real label, a unique input ID and its matching `for`. The single-space placeholder enables CSS to detect an empty value; it is not the accessible name. In every variant, the label appears inside the empty input like a placeholder, including while focused. It disappears visually when a value is entered and returns when the input is cleared or reset, retaining its accessible name throughout. The label never moves above the input or adds to its height. Hints appear below while the field is focused or populated, and wrap to the available width. The input's `aria-describedby` keeps its authored hint associated even while that hint is visually hidden.

Use `autocomplete="off"` by default, as in the Storybook examples. Consumers can opt in with `autocomplete="on"` or an appropriate token such as `email` or `name`. Set this on the native input; CSS and the optional validation helper do not control autocomplete.

### Variants, compact size, icons and status

Set `data-variant` on `ag-text-field`:

| Variant | Input height | Appearance |
| ------- | ------------ | ---------- |
| `default` or omitted | `48px` | Paper fill, inset shadow and a full keyline |
| `backdrop` | `40px` | Translucent fill, light foreground and a full light border; place it on a backdrop surface |

All variants use a border on all four sides and the same placeholder-style label behaviour. Size is independent of the visual variant: set the Storybook `compact` boolean to `true`, or add `data-compact` to the wrapper in native HTML, for a `32px` input with `16px` icons. Compact is off by default and works with either variant.

```html
<div class="ag-text-field" data-compact>
  <div class="ag-text-field__control">
    <input class="ag-text-field__input" id="compact-name" name="name"
           type="text" autocomplete="off" placeholder=" ">
    <label class="ag-text-field__label" for="compact-name">Name</label>
  </div>
</div>
```

For a compact backdrop field, also set `data-variant="backdrop"` on the wrapper. Remove `data-compact` to restore the larger size; setting it to `"false"` still leaves the attribute present. To toggle from JavaScript, use `field.toggleAttribute("data-compact", compact)` with a boolean.

For a leading search icon, insert this before the input inside `ag-text-field__control`. Any Feather icon can be used; the input's type and icon are independent.

```html
<span class="ag-text-field__leading" aria-hidden="true">
  <span class="ag-icon" data-icon="search"></span>
</span>
```

Use `ag-text-field__trailing` after the label for a trailing decoration. Omit the wrapper entirely when no icon is needed. These icon wrappers are decorative; an action requires a native button with its own accessible name and handler. When loading separate categories, include the `present/icon` recipe for `ag-icon`.

Add `<span class="ag-text-field__status" aria-hidden="true"></span>` inside the control to opt into the validation glyph. It is hidden in the neutral state and uses the existing Feather check and alert-circle assets. Glyphs are 24px normally and 16px when compact, in either variant. Status glyph styling is included with the text-field recipe itself.

For static feedback without a helper, set `data-status="success"` or `data-status="error"` on the wrapper. For an error, also set `aria-invalid="true"` on the input and associate an explanatory `p.ag-text-field__error` using `aria-describedby`. Status colours and glyphs are visual feedback; an ARIA error flag alone does not block submission. Use native constraints or `input.setCustomValidity(message)` when submission must be blocked. `:user-invalid` supplies the error appearance for native validation as well. Include explanatory error text so colour is not the only signal.

Native `required`, `pattern`, `minlength`, `maxlength`, `min`, `max`, `step`, `multiple`, `readonly`, `disabled` and `form` attributes retain their usual meanings. Read-only values stay selectable and participate in submission; disabled fields are excluded. For visible input text, assign `input.value` directly.

### Optional inline validation

Enhance a field when it needs inline error messages. Ordinary browser validation continues to work without this helper.

```ts
import { enhanceTextField } from "ag";

const email = enhanceTextField(document.querySelector<HTMLElement>("#email-field")!);

email.input.value = "hello@example.com";
email.update();                         // Recheck programmatic changes.
email.validate();                       // Reveal feedback and return true/false.
email.setError("This address is already registered.");
email.setError(null);                    // Explicitly clear the server error.

// When removing the view:
email.destroy();
```

The helper evaluates native constraints and shows feedback after blur or an attempted submission. Once revealed, feedback updates on input; unfinished IME composition is left alone until composition ends. Empty optional fields remain neutral, and disabled/read-only fields do not receive helper validation feedback. A valid populated field receives the success treatment, but the status glyph is shown only if you included it in the markup. Browser validation messages retain the browser's language.

Supply a synchronous `validation` callback for application-specific rules. Return a plain-text error or `null`; native constraints are checked too. The callback is also checked before interaction so its custom validity can block an untouched form submission. It should be fast and have no side effects.

```ts
const displayName = enhanceTextField(nameField, {
  validation: (input) =>
    input.value && input.value.trim().length < 3
      ? "Use at least three non-space characters."
      : null,
});
```

For asynchronous server checks, your application owns the request and ignores stale responses before calling `setError`. A supplied server error takes priority and persists through typing until explicitly cleared or the native form is reset. No password-strength rules are built into the library; supply the rules your application actually requires.

| Member | Purpose |
| ------ | ------- |
| `input` | The native `HTMLInputElement` |
| `validate()` | Recheck constraints/callback, reveal feedback and return validity |
| `update()` | Recheck a programmatic value change, preserving whether feedback has been revealed |
| `setError(message)` | Set a persistent server/application error; pass `null` to clear it |
| `reset()` | Clear interaction feedback and server errors without changing the input's value |
| `destroy()` | Remove owned messages, listeners and custom validity; retain entered data |

The helper creates its own error paragraph with a unique ID and a polite live region. It adds that ID to `aria-describedby` only while an error is shown, preserving other description references. It also manages `aria-invalid` and `data-status`. Avoid separately controlling those same attributes while enhanced. Existing externally assigned custom validity is preserved when the helper's override is removed. Form reset clears helper feedback after the native reset, unless that reset was cancelled. `novalidate` and submitter `formnovalidate` remain available. Programmatic helper calls do not emit synthetic `input` or `change` events, and repeated enhancement returns the same controller.

### Size and theming

The default width is `344px`, capped by the containing width. Override `--text-field-width` or set the wrapper's `inline-size` to fill a form column. Hints and error messages add to the field's overall height below the control.

| CSS token | Default |
| --------- | ------- |
| `--text-field-width` | `344px` |
| `--text-field-height` | `48px` |
| `--text-field-compact-height` | `32px` |
| `--text-field-backdrop-height` | `40px` |
| `--text-field-padding-inline` | `16px` |
| `--text-field-icon-size` | `24px` |
| `--text-field-compact-icon-size` | `16px` |

Colours reuse paper, surface, keyline, field-hint, on-surface, backdrop, success and error tokens. Logical positioning supports RTL; forced-colour mode uses system colours and retains the focus outline. For selective Sass, use `interact/text-field.classes`, or include the pure `text-field.styles` mixin with the shared theme. The full **Interact** category includes this recipe.

**Interact / Text Field** includes editable controls, all visual variants, native HTML, disabled/read-only and narrow RTL examples, and **Live Validation** for custom rules, server errors and reset.

## Navigation

Use real links inside a labelled navigation landmark. Apply the menu-item classes as follows:

```html
<nav class="ag-location-index" aria-label="Notebook">
  <ul class="ag-location-index__list">
    <li>
      <a class="ag-location-index__link" href="/notes" aria-current="page"
        >Notes</a
      >
    </li>
    <li>
      <a class="ag-location-index__link" href="/shared">
        <span
          class="ag-location-index__icon"
          data-icon="shared"
          aria-hidden="true"
        ></span>
        Shared
      </a>
    </li>
  </ul>
</nav>
```

The application sets `aria-current="page"` on the current destination and removes it from other links. Other valid `aria-current` values also select the current appearance; `aria-current="false"` does not. Optional `ag-location-index__title` headings can introduce groups. Icons occupy `16 × 16px`; the `shared` icon is included with the stylesheet. Custom images can use the same icon class and empty `alt` text when decorative.

This is ordinary navigation, with native link behaviour and keyboard focus. It does not implement a menu-widget keyboard model, routing or automatic location tracking. `--selection-fill` controls the selected background; foreground colours reuse existing surface/control tokens. **Interact / Location Index** demonstrates current and ordinary links.

## Checkboxes

```html
<label class="ag-checkbox" data-variant="solid">
  <input
    id="updates"
    class="ag-check__input"
    type="checkbox"
    name="updates"
    value="yes"
    checked
  />
  <span class="ag-check__control" aria-hidden="true">
    <svg
      class="ag-check__tick"
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M13 1L4.75 9L1 5.36364"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="ag-check__mixed"></span>
  </span>
  <span class="ag-check__label">Receive updates</span>
</label>
```

Variants are `default`, `solid` and `backdrop`; `filled` is an alias for `solid`. Use `backdrop` when placing the control on `ag-background`. Native `checked`, `disabled`, `required`, `name`, `value` and form association work on the input.

Mixed state is a native DOM property, not an HTML attribute:

```ts
const updates = document.querySelector<HTMLInputElement>("#updates")!;
updates.indeterminate = true;
```

CSS supplies the mixed appearance. The property does not change the input's `checked` value or what the form submits. Native form reset does not clear `indeterminate`; clear it in your application or use `enhanceControls` for that behaviour.

## Radios and radio groups

Use a fieldset and legend for the group. Give the radios the same `name` and distinct `value` attributes:

```html
<fieldset class="ag-radio-group">
  <legend>Frequency</legend>
  <div class="ag-radio-group__options">
    <label class="ag-radio">
      <input
        class="ag-check__input"
        type="radio"
        name="frequency"
        value="daily"
      />
      <span class="ag-check__control" aria-hidden="true">
        <span class="ag-check__tick"></span>
      </span>
      <span class="ag-check__label">Daily</span>
    </label>
    <label class="ag-radio">
      <input
        class="ag-check__input"
        type="radio"
        name="frequency"
        value="weekly"
        checked
      />
      <span class="ag-check__control" aria-hidden="true">
        <span class="ag-check__tick"></span>
      </span>
      <span class="ag-check__label">Weekly</span>
    </label>
  </div>
</fieldset>
```

Set `data-orientation="vertical"` on the fieldset for a vertical layout; horizontal is the default. Use `disabled` on the fieldset to disable the group and `required` on a radio input to require a selection.

Variants are `default` and `backdrop`. For the backdrop palette, set `data-variant="backdrop"` on both the fieldset and each `ag-radio` label. The fieldset styles the legend; each label styles its control. The fieldset's `name` does not group radios: the inputs' names and native form ownership do.

Native keyboard selection needs no helper. `enhanceControls` adds Home/End and directional navigation that respects RTL and skips disabled options.

## Switches

A switch is a native checkbox with `role="switch"`:

```html
<label class="ag-switch">
  <input
    class="ag-check__input"
    type="checkbox"
    role="switch"
    name="notifications"
    value="enabled"
  />
  <span class="ag-check__label">Notifications</span>
  <span class="ag-switch__track" aria-hidden="true">
    <span class="ag-switch__thumb"></span>
  </span>
  <span class="ag-switch__status" aria-hidden="true">
    <span class="ag-switch__on">On</span>
    <span class="ag-switch__off">Off</span>
  </span>
</label>
```

Variants are `default` and `backdrop`. CSS moves the thumb and changes the visible On/Off text from the input's checked state. Keep the accessible label, here “Notifications”, constant. Use the input's native `checked` property to read or set its state; no Afterglow helper is required.

Status labels are optional and their wording is yours to supply. Put the positive (checked) label in `.ag-switch__on` and the negative (unchecked) label in `.ag-switch__off`:

```html
<span class="ag-switch__status" aria-hidden="true">
  <span class="ag-switch__on">Enabled</span>
  <span class="ag-switch__off">Disabled</span>
</span>
```

To hide both status labels, add `hidden` to `.ag-switch__status` or set that element's native boolean `hidden` property. The hidden status takes up no space. You can also omit the status element entirely when it is never needed.

For a switch selected as `switchElement`, bind your application's boolean and strings directly to the native elements:

```js
const showStatusLabel = false;
const positiveStatusLabel = "Enabled";
const negativeStatusLabel = "Disabled";
const status = switchElement.querySelector(".ag-switch__status");

status.hidden = !showStatusLabel;
status.querySelector(".ag-switch__on").textContent = positiveStatusLabel;
status.querySelector(".ag-switch__off").textContent = negativeStatusLabel;
```

Set `status.hidden = false` to show the current status again. In HTML, remove `hidden` to show it; `hidden="false"` still hides it. Keep `aria-hidden="true"` on the status element because the native switch already communicates its checked state to assistive technology. The status wording does not change the submitted input `value`.

Storybook exposes `showStatusLabel` (default `true`), `positiveStatusLabel` (default `"On"`) and `negativeStatusLabel` (default `"Off"`) as example controls. These generate the native markup above; they are not custom properties on the checkbox.

## Sliders

Use a native range input inside `ag-slider`. The helper keeps the fill and optional step marks in sync and creates a value tooltip above the handle. The tooltip appears while the handle is held or an adjustment key is pressed, then disappears on release, cancellation or loss of focus. Unnumbered marks align with the track's centerline and sit behind it in the stacking order, showing through the translucent track.

```html
<div id="volume-slider" class="ag-slider" data-marks>
  <div class="ag-slider__control">
    <input
      class="ag-slider__input"
      type="range"
      name="volume"
      aria-label="Volume"
      min="0"
      max="100"
      step="10"
      value="40"
    />
    <div class="ag-slider__track" aria-hidden="true">
      <div class="ag-slider__fill"></div>
      <div class="ag-slider__marks"></div>
    </div>
  </div>
</div>
```

Initialise the helper after the markup is mounted:

```ts
import { enhanceSlider } from "ag";

const root = document.querySelector<HTMLElement>("#volume-slider")!;
const slider = enhanceSlider(root, {
  formatValue: (value) => `${value}%`,
});

slider.input.addEventListener("input", () => {
  console.log(slider.input.valueAsNumber);
});
```

`formatValue` is optional and receives a string. Its result supplies both the tooltip text and `aria-valuetext`. The input still needs a native `label`, `aria-label` or `aria-labelledby`; the tooltip does not name the control.

To select a lower and upper value, add `data-range` to the wrapper and supply **two native range inputs**, in lower-then-upper order. Give each a distinct accessible label and form name:

```html
<div id="price-range" class="ag-slider" data-range data-marks>
  <div class="ag-slider__control">
    <input class="ag-slider__input" type="range"
      name="minimumPrice" aria-label="Minimum price"
      min="0" max="100" step="5" value="25" />
    <input class="ag-slider__input" type="range"
      name="maximumPrice" aria-label="Maximum price"
      min="0" max="100" step="5" value="75" />
    <div class="ag-slider__track" aria-hidden="true">
      <div class="ag-slider__fill"></div>
      <div class="ag-slider__marks"></div>
    </div>
  </div>
</div>
```

```ts
const rangeRoot = document.querySelector<HTMLElement>("#price-range")!;
const range = enhanceSlider(rangeRoot, { formatValue: value => `$${value}` });

rangeRoot.addEventListener("input", () => {
  console.log(range.input.valueAsNumber, range.upperInput!.valueAsNumber);
});

range.setValues(30, 80);
```

The fill spans the selected interval. Handles can meet but cannot pass one another; dragging a handle past its partner stops at that value. Clicking the track moves the nearest available handle. Both handles retain native focus and keyboard interaction, and tab order stays lower then upper. Form submission includes both named inputs. The helper updates each handle's accessible limits as its partner moves.

Use identical `min`, `max` and `step` on both inputs. The first input owns the shared scale: subsequent changes to its bounds or step are copied to the upper input. Set `disabled` or `data-readonly` on both inputs to apply the state to the whole range. Read-only sliders also need `enhanceControls`.

| Configuration | Where to put it |
| --- | --- |
| `min`, `max`, `step`, `value`, `disabled`, `name` | Native range input |
| `data-range` | Container with two inputs, lower first |
| `data-variant="backdrop"` | `ag-slider` container |
| `data-orientation="vertical"` | Container; values increase from top to bottom, with the tooltip beside the handle |
| `dir="rtl"` | Container or ancestor for horizontal RTL |
| `data-marks` | Container to generate unnumbered step marks |

Omit `data-marks` when marks are unnecessary. Generated marks are capped at 1,001; `step="any"` has no discrete marks. The helper creates and removes `ag-slider__tooltip` elements; do not author them yourself. The previous `ag-slider__labels` / `ag-slider__label` markup has been replaced by these tooltips and should be removed from existing recipes.

The slider reserves space above its track for the tooltip. Marks share the track's position and need no additional space below it. A single-value slider still supports optional custom visual content in `ag-slider__thumb`; the native input continues to handle interaction. Two-handle sliders use the native thumbs.

Use `enhanceSlider` for the complete appearance and two-handle coordination. A single native input remains usable before enhancement, but the decorated fill, generated marks and tooltip need the helper.

For programmatic changes:

```ts
slider.setValue(60); // Single value, or the lower handle clamped to its partner.
slider.input.value = "70";
slider.update(); // Required after direct property writes.

range.setValues(30, 80); // Sets both values; reversed pairs are sorted.
range.upperInput!.value = "90";
range.update();

// When the owning view is disposed:
slider.destroy();
range.destroy();
```

`setValue()` and `setValues()` use native bounds and step rounding and do not dispatch `input` or `change`. Notify application state explicitly for programmatic updates. Attribute changes to bounds, step, orientation and marks are observed; the helper follows native input/change events and uncancelled form reset. For direct property writes, keep the lower value at or below the upper value before calling `update()`; if they cross, `update()` clamps the lower value to the upper value.

The tooltip colours inherit the existing surface and backdrop theme tokens. Local `--ag-slider-tooltip-fill` and `--ag-slider-tooltip-color` overrides are available. `--ag-thumb-diameter` and `--ag-track-width` control the existing handle and track dimensions.

## Progress bars

Use native `progress` inside the `ag-progress` wrapper. A surrounding `label` supplies the accessible name and positions the caption below the bar:

```html
<label class="ag-progress">
  <progress id="upload-progress" class="ag-progress__bar" value="25" max="100"></progress>
  <span class="ag-progress__label">Uploading files…</span>
</label>
```

No Afterglow JavaScript is required. The browser controls the fill from `value` and `max`, so property assignments update both the visual progress and native accessibility values:

```ts
const progress = document.querySelector<HTMLProgressElement>("#upload-progress")!;
progress.max = 20; // Total files, bytes, steps, or another positive unit.
progress.value = 7; // Seven of twenty: 35%.

progress.removeAttribute("value"); // Unknown amount of work: indeterminate.
progress.value = 12; // Return to determinate progress.
```

`value="0"` means zero progress; it is different from omitting `value`. If `max` is omitted, HTML uses `1`, so `value="0.25"` represents 25%. Values are bounded by the browser to `0`–`max`. Keep `max` positive. Reaching `max` fills the bar but does not change the label or hide the component; the application decides what completion means. For an amount within a range that is not task progress, use a native `meter` instead.

### Variants and status text

Set `data-variant` on the wrapper. Its values are `default` (the default), `error` and `caution`:

```html
<label class="ag-progress" data-variant="error">
  <progress class="ag-progress__bar" value="40" max="100"></progress>
  <span class="ag-progress__label">Connection lost. Please retry.</span>
</label>

<label class="ag-progress" data-variant="caution">
  <progress class="ag-progress__bar" value="80" max="100"></progress>
  <span class="ag-progress__label">Some files could not be uploaded.</span>
</label>
```

The variant changes the track, fill and label colours without changing the progress value. Describe the status in text as well as colour. Update the label with `textContent` when the status changes, and use your application's live region for important announcements. Do not add a second `role="progressbar"` or manually maintain `aria-valuenow` alongside the native element.

### Indeterminate progress

Omit `value` when the amount of work is unknown:

```html
<label class="ag-progress">
  <progress class="ag-progress__bar" max="100"></progress>
  <span class="ag-progress__label">Preparing your files…</span>
</label>
```

A rounded segment moves along the track. It becomes stationary when the user requests reduced motion or the wrapper uses the `error` variant. The native progress element remains indeterminate in both cases. Right-to-left containers reverse the direction of the fill and indeterminate movement.

### Layout, optional labels and theming

The default width is `142px`, constrained by the available space. Set `--progress-width:100%` to fill a container. Labels are centred and wrap, including long filenames. The default track is `1px` thick with a `3px` rounded fill and a small bold caption using the existing body font stack.

```html
<div class="ag-progress" style="--progress-width:100%">
  <progress class="ag-progress__bar" value="25" max="100" aria-label="Uploading files"></progress>
</div>
```

This omits the visible caption while retaining an accessible name. You can also connect an external label using `label[for]` and the progress element's `id`, or use `aria-labelledby`. A progress bar does not accept input and should not be placed inside a button or made focusable.

`--progress-width`, `--progress-height` and `--progress-label-gap` control width, fill thickness and space below the visible bar. Colours reuse `--ctrlTextDesat`, `--error` and `--caution`; caption typography uses `--body-font-stack` and `--caption-text-size`. Use local theme overrides to change these values. Forced-colour mode uses system colours. Native `hidden` works on the wrapper, bar and caption.

For selective Sass, use `indicate/progress.classes`, or include the complete `progress.styles` mixin from `indicate/progress.mixins` together with the shared theme. The complete mixin includes the required selectors and indeterminate keyframes.

**Indicate / Progress** includes editable controls, all three variants, zero/complete/indeterminate states, live property updates and layout examples.

## Circular progress

Circular progress belongs to **Indicate**. It uses a native `progress` element with a title beneath the ring. The helper derives the state from the native value and adds the ring and status icons; there is no custom element to register.

```html
<label id="upload-progress" class="ag-circular-progress">
  <progress class="ag-circular-progress__native" value="0" max="100"></progress>
  <span class="ag-circular-progress__title">Upload</span>
</label>
```

```ts
import { enhanceCircularProgress } from "ag";

const root = document.querySelector<HTMLElement>("#upload-progress")!;
const upload = enhanceCircularProgress(root);

upload.title = "Upload photos"; // Visible title and accessible name.
upload.value = 38;             // In progress, 38% around the ring.
upload.value = 100;            // Complete: full ring with a checkmark.

upload.error = true;           // Error: red ring, exclamation mark and title.
upload.error = false;          // Restore the state implied by the current value.
upload.value = 0;              // Not started: thin empty ring.

// When the owning view is removed:
upload.destroy();
```

### States and values

| State | How to select it | Appearance |
| ----- | ---------------- | ---------- |
| `not-started` | `value = 0` | Thin, muted ring |
| `in-progress` | `0 < value < max` | Clockwise arc over the thin track |
| `complete` | `value >= max` | Full ring and checkmark |
| `error` | `error = true`, or `data-error` on the wrapper | Red circled exclamation mark and title |

Error takes precedence and preserves the amount completed. Clearing it returns to the appropriate value-based state, so a failed operation can resume. Reaching the maximum marks completion automatically; the application decides whether to hide the component or start another task.

Use `value = null` when work is underway but the amount is unknown. This removes the native `value` attribute and displays a rotating partial ring in the `in-progress` state. Reduced-motion users see a stationary arc. Zero is a known amount and means not started; it is different from an omitted `value`.

Values and maximums use the same units: bytes, files or steps work just as well as percentages. The native element clamps values between zero and its maximum. Supply a positive `max`; the native default is `1` when omitted. Controller setters reject non-finite values and non-positive maximums before applying an update.

### Controller properties and methods

Initial options and `update(options)` accept `title`, `value`, `max`, `error` and `stateLabels`. Omitted options preserve the current values. For example:

```ts
const upload = enhanceCircularProgress(root, {
  title: "Upload photos",
  value: 0,
  max: 20,
});

upload.update({ value: 7, title: "7 of 20 photos" });
upload.state; // "in-progress", read-only.

// Native property writes are also observed; update() refreshes immediately.
upload.progress.value = 12;
upload.update();
```

| Member | Purpose |
| ------ | ------- |
| `title` | Read or assign the caption as plain text, including an empty string to hide it |
| `value` | Read or assign the native amount; `null` means indeterminate |
| `max` | Read or assign the positive total |
| `error` | Read or assign the failure flag |
| `state` | Read the effective state from the table above |
| `progress` | Access the native `HTMLProgressElement` |
| `update(options?)` | Apply partial options and synchronise appearance/accessibility immediately |
| `destroy()` | Remove the generated ring and observers, restore saved ARIA attributes, and show the native bar again |

The `title` property belongs to the controller; the HTML `title` attribute remains the browser's ordinary hover hint. You can also update the caption element's `textContent` directly. The helper observes its text, native `value`/`max` attributes, and `data-error`. Boolean `data-error` is enabled by its presence; remove it to clear an error.

### Markup, accessibility and theming

Keep `ag-circular-progress` on the wrapper, `ag-circular-progress__native` on the native progress element and `ag-circular-progress__title` on the caption. The helper creates an `aria-hidden` `ag-circular-progress__ring` and manages `data-state` and `data-enhanced`; leave those to the helper. Before enhancement, and after destruction, a small native progress bar remains visible with the title.

The native element supplies the accessible progress semantics and numeric range. The title provides its accessible name; for a title-free display, supply an explicit `aria-label` on the progress element. An authored `aria-labelledby` takes precedence. Do not add a second `role="progressbar"` or duplicate numeric ARIA attributes on the wrapper. The component accepts no input and does not enter the tab order.

Accessible state descriptions use `aria-valuetext`. Translate them with, for example, `upload.update({ stateLabels: { "not-started": "Pas commencé", "in-progress": "En cours", complete: "Terminé", error: "Erreur" } })`. The helper appends the percentage to known in-progress and error states. It does not announce every update through a live region; use your application's status announcements for meaningful milestones and failures. Programmatic updates emit no `input` or `change` events.

| CSS token | Default | Purpose |
| --------- | ------- | ------- |
| `--circular-progress-size` | `24px` | Ring diameter |
| `--circular-progress-track-width` | `1px` | Thin background ring |
| `--circular-progress-stroke-width` | `2px` | Progress arc and complete ring |
| `--circular-progress-title-gap` | `4px` | Space between the ring and title |

Colours reuse `--ctrlTextDesat` and `--error`; titles use `--body-font-stack`, `--small-caption-text-size` and `--line-height`. Long titles wrap within the available width. Rings advance clockwise in both LTR and RTL layouts, and forced-colour mode uses system colours. Keep the bundled Feather assets alongside the stylesheet for the check and error glyphs.

For dark backdrop surfaces, add `data-variant="backdrop"` to the component wrapper:

```html
<div class="ag-background">
  <label id="backdrop-upload" class="ag-circular-progress" data-variant="backdrop">
    <progress class="ag-circular-progress__native" value="38" max="100"></progress>
    <span class="ag-circular-progress__title">Upload</span>
  </label>
</div>
```

Initialise `enhanceCircularProgress` on the label as usual. This is a CSS variant: it uses `--onBackdrop` for the arc, completion icon and title, with `--backdropKeyline` for the empty track. In the error state, the circle has an `--error` fill and the icon and title use `--on-error`, matching the notification palette. Changing the variant does not change the progress value or behaviour. The variant selects the foreground treatment; the containing surface supplies its own backdrop.

For selective Sass, use `indicate/circular-progress.classes`, or the pure `circular-progress.styles` mixin from `indicate/circular-progress.mixins` with the shared theme. The `indicate` category includes its glyph styles without requiring the full `present` category.

**Indicate / Circular Progress** includes editable controls, all four states, **Backdrop** and **Backdrop States**, live title/value/error updates, layouts and native fallback examples.

## Staged progress

Staged progress belongs to **Indicate**. It shows a task as an ordered sequence of subtasks, each using the circular progress recipe above. There is no Web Component and no fixed stage count. Each subtask has its own title, amount, maximum and error flag.

```html
<ol id="publish-progress" class="ag-staged-progress" role="list"
    aria-label="Publish photos" data-orientation="horizontal">
  <li class="ag-staged-progress__stage">
    <label class="ag-circular-progress">
      <progress class="ag-circular-progress__native" value="100" max="100"></progress>
      <span class="ag-circular-progress__title">Prepare</span>
    </label>
  </li>
  <li class="ag-staged-progress__stage">
    <label class="ag-circular-progress">
      <progress class="ag-circular-progress__native" value="38" max="100"></progress>
      <span class="ag-circular-progress__title">Upload</span>
    </label>
  </li>
  <li class="ag-staged-progress__stage">
    <label class="ag-circular-progress">
      <progress class="ag-circular-progress__native" value="0" max="100"></progress>
      <span class="ag-circular-progress__title">Finish</span>
    </label>
  </li>
</ol>
```

```ts
import { enhanceStagedProgress } from "ag";

const root = document.querySelector<HTMLElement>("#publish-progress")!;
const task = enhanceStagedProgress(root);
const upload = task.stages[1];

upload.title = "Upload photos";
upload.value = 60;
upload.error = true;                  // Retain 60% while showing failure.
upload.error = false;                 // Resume from the retained amount.
upload.value = 100;
task.stages[2].value = null;           // Start work with an unknown amount.

root.dataset.orientation = "vertical";

// When disposing the view:
task.destroy();
```

`stages` is a read-only snapshot of circular progress controllers in DOM order. Each controller supports all the properties and methods described in **Circular progress**, including `update({ value, max, error, title, stateLabels })`. Native `progress.value` and `progress.max` changes are also observed. Several stages can fail independently; clearing one error leaves the others untouched. The application decides when to start a subtask, whether to stop after an error, and when to retry. This display does not schedule work or invent an aggregate percentage.

### Stage lists and lifecycle

Keep one direct `li.ag-staged-progress__stage` per subtask, containing its `label.ag-circular-progress`. Add, remove or reorder these list items normally. The helper automatically enhances new complete stage markup and releases removed stages. To access a newly added controller immediately, call `task.refresh()` after editing the list. Read `task.stages` again after a reorder; controllers for surviving elements keep their identity and current values.

| Member | Purpose |
| ------ | ------- |
| `stages` | Read the current circular progress controllers in list order |
| `refresh()` | Reconcile list changes and synchronise stage displays immediately |
| `destroy()` | Stop observation, remove decoration created by this helper and restore native bars |

Repeated enhancement returns the same staged controller. Let the sequence own the lifecycle of the circles it creates; call `task.destroy()` when removing its view. If a circle was already enhanced independently, the sequence reuses it and leaves its cleanup with the original owner. An empty list and a single stage are supported; a single visible stage has no connecting line.

### Layout, connections and accessibility

`data-orientation="horizontal"` is the default. Titles sit beneath their rings and wrap within each stage's width. The sequence scrolls horizontally when it has more stages than the available space, preserving their order. The helper makes an overflowing list keyboard-focusable and removes that extra tab stop once everything fits; an authored `tabindex` is preserved.

With `data-orientation="vertical"`, rings run down the leading edge and titles sit alongside them. Titles wrap to the available width. Both layouts respect `dir="rtl"`. Connections follow the previous stage: a completed stage has a full-colour outgoing line, while pending, running and failed stages have a muted line. Errors remain local to their stage; they do not turn the remaining sequence red. The last visible stage has no outgoing line, and hidden list items are omitted from the layout.

Give the list an accessible name with `aria-label` or `aria-labelledby`. Keep `role="list"` to preserve list announcements in browsers that otherwise suppress them when list markers are removed. Each native progress element supplies its own accessible name, amount and state. Connections are decorative CSS; this is a status display, not a step-navigation widget. Use application-level status announcements for significant milestones and failures rather than announcing every numeric update.

For a backdrop surface, set `data-variant="backdrop"` on **both the list and each circular progress label**. The list sets the connection colour, while the circles use their existing backdrop treatment. Place the sequence inside `ag-background` or another backdrop surface.

| CSS token | Default | Purpose |
| --------- | ------- | ------- |
| `--staged-progress-stage-width` | `80px` | Horizontal stage width, including its wrapping title |
| `--staged-progress-gap` | `32px` | Space between stage boxes in either orientation |
| `--staged-progress-connector-gap` | `8px` | Clearance between a connecting line and a ring; also the vertical title gap |
| `--staged-progress-connector-width` | `1px` | Connecting line thickness |

The circular progress tokens still control ring diameter, stroke and title spacing. Default rings have a 72px connecting line horizontally. Keep enough stage spacing for the chosen ring size and connector clearance. Forced-colour mode uses system colours for both circles and connections; indeterminate stages retain the circular progress reduced-motion behaviour.

For selective Sass, import `indicate/staged-progress.classes`; it includes the circular progress recipe once. When using pure mixins, include both `circular-progress.styles` and `staged-progress.styles` with the shared theme. The full **Indicate** category includes both recipes.

**Indicate / Staged Progress** includes editable stage arrays, vertical and backdrop variants, multiple errors, empty/single/many-stage support through the stage control, layout examples and a **Live Updates** story for editing, adding and removing subtasks.

## Notifications

Notifications contain an icon, message and close button. They use native HTML and `popover="manual"`, with an optional helper for timing and announcements. There is no custom element to register.

This complete HTML example can be opened and dismissed without an Afterglow helper:

```html
<button
  type="button"
  class="ag-button"
  popovertarget="saved-notification"
  popovertargetaction="show"
>
  Show notification
</button>
<div
  id="saved-notification"
  class="ag-notification"
  data-variant="success"
  data-position="bottom-right"
  popover="manual"
>
  <span class="ag-notification__icon" aria-hidden="true"></span>
  <p class="ag-notification__message">Your changes have been saved.</p>
  <button
    type="button"
    class="ag-notification__close"
    aria-label="Dismiss notification"
    popovertarget="saved-notification"
    popovertargetaction="hide"
  ></button>
</div>
```

Keep the native close button and message element. The icon is decorative: CSS uses the supplied SVGs as masks so their colours follow the theme. The close button has a larger hit area than its visible glyph. Omit `popover` only for an inline notification managed by your application.

The notification sizes itself around its contents: the message has a minimum width of `160px` and a maximum of `320px`, with icons, gaps and padding added around it. Longer text wraps at the maximum. In a narrow view, a popover's message can shrink below the minimum to keep the close button visible.

| `data-variant`                     | Appearance                                        |
| ---------------------------------- | ------------------------------------------------- |
| `default` (also used when omitted) | Slate background with information icon            |
| `alert`                            | Red background with alert icon                    |
| `success`                          | Green background with check icon                  |
| `caution`                          | Yellow background with caution icon and dark text |

Info (`default`) and error (red `alert`) icons are `20 × 20px`; the success icon is `16 × 11px`, and the warning (yellow `caution`) icon is `20 × 17px`.

`data-position` accepts `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center` or `bottom-right`. The default is `top-right`. Left and right mean physical corners, including in RTL layouts. Native manual popovers remain open through outside clicks and Escape; their close buttons still work. See [manual popover behaviour](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using#using_manual_popover_state).

### Timed or manual dismissal

Add the helper for automatic dismissal, animation, screen-reader announcements and stacking:

```ts
import { enhanceNotification } from "ag";

const element = document.querySelector<HTMLElement>("#saved-notification")!;
const notification = enhanceNotification(element, {
  position: "bottom-right",
  timeout: 5000,
});

// Call after saving, or from another application event:
await notification.show();

// Overrides apply to this opening. Zero keeps it open until dismissed.
await notification.show({ timeout: 0, position: "top-center" });

// Programmatic dismissal:
await notification.hide();

// When the owning view is removed:
notification.destroy();
```

`timeout` is in milliseconds and defaults to **0**, requiring a close-button or programmatic dismissal. A positive timeout begins after entry animation. It pauses while the notification is hovered, contains keyboard focus, or the document is hidden, then resumes with the remaining time. Showing an already-open notification resets its timeout and announces the current message.

`show()` and `hide()` resolve after their animations finish; `open` reports native visibility, including during exit. The helper honours reduced motion and does not focus the notification when showing it. If dismissal removes the focused close button, it restores the focus captured when opening.

The helper emits a bubbling `close` event after dismissal. `event.detail.reason` is `close-button`, `timeout`, `programmatic` or `native`. This is a completion event, not a cancellable dismissal request. Native `hidePopover()` closes immediately and is reported as `native`; use the helper's `hide()` for animated closing.

Separate helper-enabled notifications at the same position in the same view stack vertically, with the oldest nearest the edge. Closing one removes its gap. Reuse an element for a replaceable message, or create separate elements and controllers for separate notifications. Use unique IDs for native popover buttons.

### Position within a view

Pass a mounted element as `container` to use that view's visible bounds:

```ts
const view = document.querySelector<HTMLElement>("#editor-view")!;
await notification.show({ container: view, position: "top-right", timeout: 0 });
```

The helper follows resizing and scrolling. `container: null` uses the viewport. Positioning does not move the markup: put the notification inside the view in the DOM when it should inherit that view's theme. Native popovers use the browser's top layer, so container overflow does not clip them.

### Announcements and styling

The helper announces only message text through a persistent polite live region. Set `announcement: "assertive"` for an urgent interruption, or `"off"` when the application already announces the same status. The visual `alert` variant does not automatically make the announcement assertive. Keep notifications with essential actions open using `timeout: 0`.

The HTML-only example provides visibility and dismissal; use the helper when announcing dynamic application status. `destroy()` removes the helper's live region, observers and listeners. Application listeners remain your responsibility.

| CSS token                          | Default | Use                                                  |
| ---------------------------------- | ------- | ---------------------------------------------------- |
| `--notification-message-min-width` | `160px` | Minimum text width; reduced for narrow popover views |
| `--notification-message-max-width` | `320px` | Maximum text width before wrapping                   |
| `--notification-offset`            | `16px`  | Distance from view edges                             |
| `--notification-gap`               | `12px`  | Gap between children and between stacked cards       |
| `--notification-padding-block`     | `18px`  | Top and bottom padding                               |
| `--notification-padding-inline`    | `16px`  | Left and right padding                               |

Backgrounds reuse `--onPanelAlt`, `--error`, `--success` and `--caution`. Message text uses `--on-ctrl-fill-solid`, `--on-error`, `--on-success` and `--onPanel`, respectively. Alert/success icons use `--panel`; other icons and close buttons follow the text colour. Typography uses `--body-font-stack`, `--body2-text-size` and `--line-height`; animation uses the existing motion tokens.

**Indicate / Notification** in Storybook includes the variant gallery, configurable example, six positions within a view, timed stacking and the native HTML example.

## Dialogs

Use a labelled native dialog. This example uses HTML invoker commands and needs no Afterglow helper:

```html
<button
  type="button"
  class="ag-button"
  commandfor="settings-dialog"
  command="show-modal"
>
  Open settings
</button>
<dialog id="settings-dialog" class="ag-dialog" aria-labelledby="settings-title">
  <div style="padding: 2rem">
    <h2 id="settings-title" class="ag-h2">Settings</h2>
    <p class="ag-body">Choose your preferences.</p>
    <button
      type="button"
      class="ag-button"
      commandfor="settings-dialog"
      command="close"
      autofocus
    >
      Close
    </button>
  </div>
</dialog>
```

`commandfor` refers to the dialog's unique ID. Check [button command browser compatibility](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#browser_compatibility) for your target browsers. If invoker commands are unavailable, attach click handlers that call native `dialog.showModal()` and `dialog.close()`, or use the helper with explicit handlers below. The helper is not an invoker-command polyfill.

The native dialog API also supports non-modal `show()` and immediate closing through `<form method="dialog">`. Use `showModal()` or `show()` to open a dialog; toggling a CSS class does not provide native modal behaviour.

### Animated dialog behaviour

For the same dialog, replace the command buttons with ordinary buttons having IDs `open-settings` and `close-settings`, and initialise:

```ts
import { enhanceDialog } from "ag";

const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog")!;
const openButton = document.querySelector<HTMLButtonElement>("#open-settings")!;
const closeButton =
  document.querySelector<HTMLButtonElement>("#close-settings")!;
const modal = enhanceDialog(dialog);
const events = new AbortController();
const options = { signal: events.signal };

openButton.addEventListener("click", () => void modal.show(), options);
closeButton.addEventListener("click", () => void modal.hide(), options);
dialog.addEventListener("dismiss", () => void modal.hide(), options);

// Call when the owning view is disposed.
function disposeSettings() {
  events.abort(); // Removes the application listeners above.
  modal.destroy(); // Removes helper listeners and closes the dialog.
}
```

Escape and backdrop interaction emit a `dismiss` request. **The consumer decides whether to close and calls `hide()`**, as the example does. This lets an application check for unsaved changes before closing.

`show()` returns a promise after opening and starting its entry animation. `hide(returnValue?)` returns a promise after its exit animation and close; modal focus containment remains in place during that exit. The native `close` event remains available and does not bubble. `dismiss()` emits `dismiss` and `cancel` requests; it does not itself hide the dialog. Calling native `close()` or submitting a dialog-method form closes immediately, so use `hide()` when the exit animation matters.

`enhanceDialog(dialog, { modal: false, trapFocus: false })` sets defaults for a non-modal dialog with native focus behaviour. `show({ modal: false, trapFocus: false })` overrides options for one opening. Both options default to `true`; modal dialogs always use the browser's native focus containment.

### Placement and size

Set these on the dialog:

| Option             | Values                                               |
| ------------------ | ---------------------------------------------------- |
| `data-anchor`      | `center` (default), `left`, `right`, `top`, `bottom` |
| `data-stretch`     | `none` (default), `vertical`, `horizontal`, `full`   |
| `--default-width`  | CSS length; defaults to `640px`                      |
| `--default-height` | CSS length; defaults to `480px`                      |

Dimensions are bounded by the viewport. Set content padding yourself. For example:

```css
#settings-dialog {
  --default-width: 32rem;
  --default-height: auto;
}
```

## Forms and optional control behaviour

Use native forms, labels, input names and values. `input` and `change` events originate on the actual inputs and bubble to ancestors. There is no wrapper component value to read.

In a form containing the checkbox, radio and switch recipes, a submit handler can read their values directly:

```ts
const form = document.querySelector<HTMLFormElement>("#preferences")!;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(form);
  console.log(values.get("frequency"));
  console.log(values.has("updates"));
});
```

Give your form `id="preferences"` for this example. Unchecked checkboxes and switches, disabled controls and inputs without a name are omitted from form data. Use `FormData.getAll()` for repeated names. HTML attributes such as `checked` and `value` establish reset defaults; live properties such as `input.checked` and `input.value` describe current state. Use native `required` and `setCustomValidity()` for validation.

### Read-only controls

Checkboxes, radios and ranges do not support native `readonly`. To retain focus and form submission while preventing user changes, add `data-readonly` to the input or to its containing fieldset and initialise `enhanceControls` on that root or an ancestor:

```ts
import { enhanceControls } from "ag";

const form = document.querySelector<HTMLFormElement>("#preferences")!;
const updates = form.querySelector<HTMLInputElement>('input[name="updates"]')!;
const controls = enhanceControls(form);

updates.setAttribute("data-readonly", "");
controls.update(); // Apply immediately; attribute changes are also observed.

// To make it editable again:
updates.removeAttribute("data-readonly");
controls.update();

// When the owning view is disposed:
controls.destroy();
```

The helper sets `aria-readonly` and temporarily suspends `required` on read-only inputs, restoring the previous state when read-only is removed or the helper is destroyed. It does not replace application validation. `data-readonly` alone is not sufficient to prevent all changes. Use native `disabled` when the control should be unavailable and excluded from submission.

`enhanceControls` also supplies radio-group Home/End and directional shortcuts and clears checkbox mixed state after an uncancelled form reset. Ordinary checkbox, radio and switch interaction does not need it. For read-only decorated sliders, initialise both `enhanceControls` and `enhanceSlider`.

## Themes and SCSS

The stylesheet declares all public design tokens on `:root`, including colours, typography, spacing and motion. The registry in [`foundation/_tokens.scss`](src/styles/foundation/_tokens.scss) combines foundation primitives and category token maps. Component styles reference the declared variables, and your own CSS can use them without repeating fallback values:

```css
.summary {
  background: var(--panel);
  color: var(--onPanel);
  font-size: var(--h3-text-size);
}
```

Override public CSS custom properties on `:root` for an application theme or on an ancestor for a local theme. When changing typography inputs locally, add `ag-theme` to that ancestor so the derived type sizes recalculate there:

```html
<section class="ag-theme ag-panel ag-body preferences">
  <h2 class="ag-h2">Preferences</h2>
  <p class="ag-caption">This caption uses the local type scale.</p>
</section>
```

```css
.preferences {
  --panel: #fffdf6;
  --onPanel: #53534a;
  --ctrlText: #006779;
  --ctrl-fill-solid: #006779;
  --on-ctrl-fill-solid: #ffffff;
  --body-text-size: 18px;
  --text-scale: 1.2;
}
```

Use the exact token spelling: some names are camelCase and others are hyphenated. Grid tokens `--gridX`, `--gridY` and `--gridType` are unitless; `--grid-x`, `--grid-y` and `--grid-type` represent lengths.

`ag-theme` recalculates the eight derived type tokens: heading sizes 1–5, body2, caption and small caption. It inherits base tokens, such as colours, body size and scale, from the surrounding theme. Nested `ag-theme` containers can override just the inputs they need. Explicit derived overrides, such as `--h5-text-size: 24px`, belong on that same theme container and inherit through its descendants. A nested theme starts a fresh calculation of derived sizes.

This boundary is necessary because CSS resolves variable references where a custom property is declared, before inheritance. Changing `--body-text-size` on an arbitrary descendant changes body text there, but does not recalculate an inherited heading or caption token; add `ag-theme` at that point. Colour overrides do not need the class, and root overrides recalculate the root's derived tokens automatically. See the [CSS variable inheritance rules](https://www.w3.org/TR/css-variables-1/#cycles).

Load Afterglow before application overrides and keep resets from overriding recipe descendants unintentionally. Styles apply through ordinary CSS; there is no Shadow DOM boundary or global reset. Preserve visible keyboard focus and accessible colour contrast when theming. Afterglow includes forced-colour rules and reduced-motion handling.

### SCSS mixins

Use the compiled stylesheet for all HTML recipes, or compile the full Sass entry point with `@use "pkg:ag/scss"`. To load a subset, category entry points emit their own recipe classes plus the shared default theme:

```scss
@use "pkg:ag/scss/foundation"; // Default theme and typography classes.
@use "pkg:ag/scss/frame"; // Surfaces, layouts and dialog.
@use "pkg:ag/scss/interact"; // Buttons, inputs and navigation.
// Also available: indicate and present.
```

The theme is emitted once per Sass compilation. Categories do not automatically load other categories' classes: add `interact` when using action buttons in a card or notification, for example. Individual `*.classes` modules are also available, such as `pkg:ag/scss/interact/textarea.classes`.

For your own classes, import pure token and mixin modules. They produce no CSS until a mixin is included. Load the theme explicitly if it is not already supplied by the compiled stylesheet or a category entry:

```scss
@use "pkg:ag/scss/foundation/theme";
@use "pkg:ag/scss/foundation/tokens" as tokens;
@use "pkg:ag/scss/foundation/typography.mixins" as type;
@use "pkg:ag/scss/frame/surface.mixins" as frames;

.preferences {
  @include tokens.theme(
    (
      "body-text-size": 18px,
      "text-scale": 1.25,
    )
  );
  @include frames.panel;
  @include type.body;
  padding: 2rem;
}
```

These package imports use Dart Sass's [Node package importer](https://sass-lang.com/documentation/cli/dart-sass/#pkg-importernode). Bundlers with a package-aware Sass resolver can use their equivalent import paths. Keep exported icons available to your CSS pipeline when composing recipes that reference assets.

`tokens.theme()` is the Sass equivalent of an `ag-theme` boundary: it emits the derived expressions and then any supplied overrides. Map keys use the CSS token name without `--`; unknown names produce a Sass error. With this mixin, the example needs only `class="preferences"` to establish its local theme. You can also use `tokens.theme()` with no arguments and declare overrides in the same rule yourself.

Surface mixins are `background`, `surface`, `panel` and `paper`; typography mixins are `body`, `caption` and `headline($level)`. Each category also has a pure `mixins` barrel with prefixed names, such as `frame.surface-panel` and `foundation.layout-flex-row(12px)`.

Complex native recipes expose a `styles` mixin which emits the complete documented `.ag-*` selectors. This lets you opt into or scope the recipe while retaining its required child markup:

```scss
@use "pkg:ag/scss/foundation/theme";
@use "pkg:ag/scss/interact/button.mixins" as button;

.checkout {
  @include button.styles;
}
```

The existing imports `pkg:ag/scss/tokens`, `frames`, `typography`, `button`, `checkable`, `slider`, `dialog` and `notification` remain compatibility entry points. They retain their previous CSS emission and exported Sass members. Prefer the explicit category modules for new code. See [Architecture.md](Architecture.md) for module ownership and the conventions for adding recipes.

## Using a UI framework

Render the same native elements in your framework's templates. In React, translate `class` to `className` and SVG attributes to their JSX equivalents. Use the framework's normal checked/value bindings and event handlers; no custom-element adapter is needed.

Initialise helpers with real element references after the view mounts, and call each controller's `destroy()` during unmount or effect cleanup. If a framework writes a range value as a property, call `slider.update()` after that write, or use `slider.setValue()` when the application owns the input directly. Set checkbox mixed state through an element reference's `indeterminate` property.

Server-render the HTML and CSS normally; run helper initialisation only in the browser. Let the slider helper own generated `ag-slider__marks` children, `ag-slider__tooltip` elements and inline decoration positions. Keep application state in sync through the input's events. The library provides behaviour helpers, not framework component wrappers.

All helpers return the existing controller when called again with the same root element. Assign one lifecycle owner to each controller, avoid overlapping `enhanceControls` roots, and remember that destroying a controller removes its own listeners, not listeners attached by your application. For avatars, initialise `enhanceAvatar` after mounting and assign `controller.name` when the person's name changes, or render static initials with `getAvatarInitials`.

## Future Web Components

There are currently no Web Components to register or custom tags to use. The native recipes in this guide are the consumer API; earlier tags such as `<ag-button>` are no longer supported.

A future Web Component should be introduced only when native HTML and styling cannot provide the required behaviour and appearance. Native controls that can meet the design should continue to use the recipes above.

When a Web Component is added, its section in this guide will include:

- The exact registration import and custom element tag, with a complete example.
- Supported attributes and JavaScript properties, their types, defaults and how to update them.
- Events, their payloads and whether they bubble, plus any public methods.
- Slots or child content, accessible labels and keyboard behaviour.
- Form participation, validation and reset behaviour, where applicable.
- Public CSS custom properties and any exposed shadow parts, with a styling example.
- Any rendering, loading or cleanup requirements a consuming application must handle.

The `.ag-*` classes documented for native elements are not an implicit styling API inside a future component's Shadow DOM. Each component will document its own supported styling surface. This section describes the documentation contract; it does not introduce a new tag or registration API today.

## Keeping this guide current

For each new component or public API change:

1. Update the component table and add or revise a complete HTML recipe.
2. Document variants, required child markup, labels, form behaviour and default states.
3. State what works with HTML/CSS alone and what requires a helper.
4. Document helper imports, options, events, programmatic updates and cleanup where relevant.
5. Add the matching Storybook example and note any browser-specific dependency.
6. For a Web Component, include the registration, content, event and styling details listed above.
7. Update migration guidance if consumers need to change their imports or markup.

Keep consumer recipes here; link to them from the README instead of maintaining duplicate copies.
