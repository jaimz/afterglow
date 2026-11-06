# API cleanup migration

This is a breaking cleanup of the private `0.0.0` package. Update consumers together with the library; no ambiguous variable aliases are emitted.

## CSS variables and Sass names

All public CSS variables and Sass token aliases use lower-case dashed names. For example, `--motionSlowDuration` becomes `--motion-slow-duration`, `--onPanel` becomes `--on-panel`, and `t.$bodyTextSize` becomes `t.$body-text-size`. [The complete CSS rename map](docs/token-migration.json) is included in the package.

`--gridX`, `--gridY`, and `--gridType` are removed. Use `--grid-x`, `--grid-y`, and `--grid-type`, which are lengths. Convert overrides such as `--gridX: 10` to `--grid-x: 10px`. Remove pixel conversions: `calc(var(--gridX) * 2px)` becomes `calc(var(--grid-x) * 2)`. Sass `$frame-gridX` and `$gridX` both become `$grid-x`; likewise for Y and Type. The unused `--type-scale`/`$typeScale` is removed; use `--text-scale`/`$text-scale`.

## Local typography

`ag-theme` is no longer needed. Derived heading/caption defaults resolve at the element using them. Explicit size overrides inherit normally through nested containers; use `--h5-text-size: initial` to resume its default formula within a subtree.

Derived-size properties are optional overrides, not declarations on `:root`. Replace direct consumer declarations like `font-size: var(--h3-text-size)` with an `ag-h3` class or Sass `font-size: tokens.token("h3-text-size")`. The latter emits the full local fallback formula and respects an explicit override. Base size, text scale, colours and spacing remain directly usable CSS variables. Default visual sizes are unchanged.

## Helper lifecycle

Every controller has `refresh()` for immediate DOM reconciliation and `destroy()` for cleanup. Configurable helpers have `update(options)`; repeated enhancement applies supplied options to the existing controller. Use partial updates so you do not unintentionally reset a current selection with initial values.

Use `slider.update({ value: 40 })`, `slider.update({ values: [20, 80] })`, and `field.update({ value: "New name" })` for programmatic changes. Direct native property writes remain supported; follow them with `refresh()`. Native input properties do not emit input events when assigned. Update calls do not synthesize user input events. Trigger replacement is structural and requires destroying/re-enhancing the component.

Sliders now manage read-only behaviour automatically. Remove the extra slider-specific `enhanceControls` call; a surrounding form-level controller may remain. Overlapping control scopes safely share saved state and release only their own ownership.

Tabs automatically observe added/removed tabs and panels and changed tab availability; use `refresh()` for synchronous access. Use `validateMarkup(root)` during development or tests for actionable diagnostics on composite recipes. Controls, sliders, text fields and token fields validate their markup before enhancement.

## Text-field labels and placeholders

Remove `ag-text-field__label` and the `text-field.label` Sass mixin. Text fields no longer overlay or hide labels. Move the label out of the control row and position it in your own layout, retaining `for` matched to the native input's `id`. Alternatively, reference existing naming content with `aria-labelledby` on the input. Replace `placeholder=" "` with actual placeholder text, or omit the attribute. Labels and placeholders are independent; no validation-helper option is needed.

## Dialog dismissal and motion

Dialogs now close on Escape/backdrop interaction without an application listener. Remove listeners whose sole purpose is calling `hide()` on `dismiss`. To protect unsaved work, synchronously call `event.preventDefault()` on `dismiss` (or `cancel`); after asynchronous confirmation, call `hide()` explicitly.

Dialogs and notifications use shared motion timing: exits use the next faster speed, and entry/exit delays and reduced motion apply consistently. Default dialog/notification entry remains slow; exit is now medium.

## Imports and installation

Use `import "ag/css"` for the complete stylesheet and import optional helpers from `ag`. The compiled stylesheet's relative `assets/` directory must accompany it when served directly; bundlers resolve these files for package CSS imports.

For Sass, `pkg:ag/scss` and category entries emit classes; `*.classes` emits a recipe and its required structural dependencies. `*.mixins`, category `mixins`, and `pkg:ag/scss/tokens` are pure. `pkg:ag/scss/theme` emits theme/fonts explicitly; `pkg:ag/scss/typography` is now pure. Removed flat component imports (`button`, `checkable`, `dialog`, `frames`, `notification`, `slider`) must be replaced by category modules, for example `pkg:ag/scss/interact/button.classes` or `pkg:ag/scss/frame/dialog.mixins`.

`npm pack` builds the library and checks the documentation contents before packaging. See `examples/consumer` for a minimal application and run `npm run test:consumer` to verify an installed tarball, exports, assets and browser behaviour. The package remains private; this change does not publish it or choose a licence/distribution channel.


## Accessibility defaults

Typography defaults now use `rem` while preserving the original appearance at a 16px root size. Prefer relative consumer overrides; paginator selection artwork and tag line height grow with the text. Text inputs and textareas use at least `1rem`. Field hints, neutral/status colours, the rose backdrop palette, primary-button hover fill and control keylines have stronger default contrast. Backdrop fields use a dark translucent fill; `--caution-foreground` supplies dark amber for progress labels and bars. Caution notification text now uses `--on-caution`.

Place modal-related notifications inside their dialog. Other enhanced notifications wait while a modal or inert ancestor blocks them; `show()` resolves after queuing in this case, `open` remains false, and the timeout starts on display. `hide()` cancels a queued notification. See Usage for lifecycle details.

Each enhanced dialog opening clears `returnValue`, so cancellation cannot reuse an earlier confirmation result. Read the result on close before reopening.
