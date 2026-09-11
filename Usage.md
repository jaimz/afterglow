# Using Afterglow

Afterglow is a design system built from native HTML and SCSS. Add its stylesheet, use the HTML recipes below, and add JavaScript helpers where the interaction needs them. There are no custom elements to register and no FAST or Lit runtime to load.

This guide describes the current consumer API. New components and changes to existing components should be documented here alongside their Storybook examples. See the [README](README.md) for working on the library, running tests and migrating older custom-element markup.

- [How to use the API](#how-to-use-the-api)
- [Choose the behaviour you need](#choose-the-behaviour-you-need)
- [Frames and typography](#frames-and-typography)
- [Buttons](#buttons)
- [Checkboxes](#checkboxes)
- [Radios and radio groups](#radios-and-radio-groups)
- [Switches](#switches)
- [Sliders](#sliders)
- [Notifications](#notifications)
- [Dialogs](#dialogs)
- [Forms and optional control behaviour](#forms-and-optional-control-behaviour)
- [Themes and SCSS](#themes-and-scss)
- [Using a UI framework](#using-a-ui-framework)
- [Future Web Components](#future-web-components)
- [Keeping this guide current](#keeping-this-guide-current)

## How to use the API

Load Afterglow's compiled stylesheet once, before your application's overrides. The examples below assume it is already loaded. With a bundler, the stylesheet import is `import "ag/css"`; a plain HTML page can link to a served copy of `afterglow.css`. When serving compiled files directly, keep the accompanying `dist/assets/` folder beside the CSS file so Notification icons resolve. Bundlers process these relative asset URLs when importing the stylesheet.

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

| Part of the system              | HTML and CSS provide                                                                     | Optional JavaScript provides                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Frames and typography           | Backgrounds, colour, depth and type styles                                               | Nothing required                                                                                             |
| Buttons                         | Appearance, focus, activation and native form actions                                    | Your application's action handlers                                                                           |
| Checkboxes, radios and switches | Selection, labels, keyboard activation, disabled states and form participation           | `enhanceControls` adds read-only behaviour, extra radio shortcuts and mixed-state reset handling             |
| Sliders                         | A styled native range input with native values and interaction                           | `enhanceSlider` synchronises the custom fill, marks and label positions, and normalises vertical/RTL arrows  |
| Notifications                   | Four visual variants, native popover visibility, six positions and a close button        | `enhanceNotification` adds optional timeouts, placement within a view, stacking, animation and announcements |
| Dialogs                         | A styled native dialog, modal behaviour and HTML invoker commands in supporting browsers | `enhanceDialog` adds animated closing, dismissal requests and optional non-modal focus containment           |

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

Frames do not lay out the application for you. Set padding, gaps, widths and responsive layout in your application CSS. Percentage heights need a containing block with an appropriate height.

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

Use `ag-body` for body text, `ag-caption` for captions and `ag-h1` through `ag-h5` for heading styles. Choose actual heading elements for the document hierarchy; a class does not add heading semantics. The default font stack prefers Lato, with system fallbacks. Supply Lato from your application if you want that typeface; Afterglow does not download fonts.

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

## Sliders

The input owns the range value and interaction. The surrounding markup provides Afterglow's track, fill, marks and labels:

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
    <div class="ag-slider__labels" aria-hidden="true">
      <span
        class="ag-slider__label"
        data-position="0"
        style="--ag-slider-position: 0%"
      >
        <span>Quiet</span>
      </span>
      <span
        class="ag-slider__label"
        data-position="100"
        style="--ag-slider-position: 100%"
      >
        <span>Loud</span>
      </span>
    </div>
  </div>
</div>
```

Initialise the helper after the markup is mounted:

```ts
import { enhanceSlider } from "ag";

const root = document.querySelector<HTMLElement>("#volume-slider")!;
const slider = enhanceSlider(root, {
  formatValue: (value) => `${value} percent`,
});

slider.input.addEventListener("input", () => {
  console.log(slider.input.valueAsNumber);
});
```

`formatValue` is optional. It receives the input value as a string and supplies `aria-valuetext`; decorative endpoint labels do not name the input.

| Configuration                                     | Where to put it                                             |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `min`, `max`, `step`, `value`, `disabled`, `name` | Native range input                                          |
| `data-variant="backdrop"`                         | `ag-slider` container                                       |
| `data-orientation="vertical"`                     | `ag-slider` container; values increase from top to bottom   |
| `dir="rtl"`                                       | Container or an ancestor for horizontal RTL                 |
| `data-marks`                                      | Container to generate step marks                            |
| `data-position="50"`                              | A label; use a value in the input's range, not a percentage |
| `data-hide-mark`                                  | A label to hide its individual mark                         |

The `ag-slider__labels` block is optional. Omit `data-marks` when step marks are unnecessary. Generated marks are capped at 1,001; `step="any"` does not generate discrete marks. A custom visual thumb can be supplied as `ag-slider__thumb` inside `ag-slider__control`; enhancement positions it while the native input continues to handle interaction.

Without the helper, the native input is usable, but the custom fill will not track its value and step marks are not generated. Static `--ag-slider-position` percentages keep labels positioned before enhancement. Use the helper for the complete decorated appearance.

For programmatic changes:

```ts
slider.setValue(60); // Updates the native value and decorations.
slider.input.value = "70";
slider.update(); // Required after direct property writes.

// When this slider is removed or its owning view is disposed:
slider.destroy();
```

`setValue()` does not dispatch `input` or `change` events. Notify application state explicitly when changing a value programmatically. Attribute changes to bounds, step and label positions are observed, and the helper follows native input/change events and form reset.

## Notifications

Notifications follow the [Figma Notification design](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=149-43): an icon, message and close button. They use native HTML and `popover="manual"`, with an optional helper for timing and announcements. There is no custom element to register.

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

Keep the native close button and message element. The icon is decorative: CSS uses the original Figma SVGs as masks so their colours follow the theme. The close button has a larger hit area than its visible glyph. Omit `popover` only for an inline notification managed by your application.

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

| CSS token                          | Default | Use                                                 |
| ---------------------------------- | ------- | --------------------------------------------------- |
| `--notification-message-min-width` | `160px` | Minimum text width; reduced for narrow popover views |
| `--notification-message-max-width` | `320px` | Maximum text width before wrapping                  |
| `--notification-offset`            | `16px`  | Distance from view edges                            |
| `--notification-gap`               | `12px`  | Gap between children and between stacked cards       |
| `--notification-padding-block`     | `18px`  | Top and bottom padding                              |
| `--notification-padding-inline`    | `16px`  | Left and right padding                              |

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

The stylesheet declares all 76 public design tokens on `:root`, including colours, typography, spacing and motion. These defaults come from the maps in [`src/styles/_tokens.scss`](src/styles/_tokens.scss). Component styles reference the declared variables, and your own CSS can use them without repeating fallback values:

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

Use the compiled stylesheet for the HTML recipes. If you are composing your own classes in Sass, frame and typography modules also expose mixins:

```scss
@use "pkg:ag/scss/frames" as frames;
@use "pkg:ag/scss/typography" as type;
@use "pkg:ag/scss/tokens" as tokens;

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

These package imports use Dart Sass's [Node package importer](https://sass-lang.com/documentation/cli/dart-sass/#pkg-importernode). The full stylesheet is available as `pkg:ag/scss` when compiling Sass instead of importing the compiled CSS; include it once.

`tokens.theme()` is the Sass equivalent of an `ag-theme` boundary: it emits the derived expressions and then any supplied overrides. Map keys use the CSS token name without `--`; unknown names produce a Sass error. With this mixin, the example needs only `class="preferences"` to establish its local theme. You can also use `tokens.theme()` with no arguments and declare overrides in the same rule yourself.

Frame mixins are `background`, `surface`, `panel` and `paper`; typography mixins are `body` and `caption`. Their modules emit the default token theme once per Sass compilation, along with the corresponding utility classes. Importing only these modules does not include button, checkable, slider or dialog styles. Use the full entry point when using those recipes.

## Using a UI framework

Render the same native elements in your framework's templates. In React, translate `class` to `className` and SVG attributes to their JSX equivalents. Use the framework's normal checked/value bindings and event handlers; no custom-element adapter is needed.

Initialise helpers with real element references after the view mounts, and call each controller's `destroy()` during unmount or effect cleanup. If a framework writes a range value as a property, call `slider.update()` after that write, or use `slider.setValue()` when the application owns the input directly. Set checkbox mixed state through an element reference's `indeterminate` property.

Server-render the HTML and CSS normally; run helper initialisation only in the browser. Let the slider helper own the generated children of `ag-slider__marks` and its inline decoration positions. Keep application state in sync through the input's events. The library provides behaviour helpers, not framework component wrappers.

All four helpers return the existing controller when called again with the same root element. Assign one lifecycle owner to each controller, avoid overlapping `enhanceControls` roots, and remember that destroying a controller removes its own listeners, not listeners attached by your application.

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
