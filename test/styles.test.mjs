import { test } from "node:test";
import assert from "node:assert/strict";
import { compileString, NodePackageImporter } from "sass";
import {
  readdirSync,
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const styles = resolve("src/styles");
const compile = (source) => compileString(source, { loadPaths: [styles] }).css;
const categories = ["foundation", "frame", "indicate", "interact", "present"];

test("every token and mixin module can be imported without emitting CSS", () => {
  const modules = categories.flatMap((category) =>
    readdirSync(`${styles}/${category}`)
      .filter((file) => /(?:tokens|primitives|mixins)\.scss$/.test(file))
      .map((file) => `${category}/${file.slice(1, -5)}`)
  );
  const source = modules
    .map((path, index) => `@use "${path}" as module${index};`)
    .join("\n");
  assert.equal(compile(source), "");
});

test("category entries emit their own recipes with one shared default theme", () => {
  const recipes = {
    foundation: ".ag-body",
    frame: ".ag-dialog",
    indicate: ".ag-notification",
    interact: ".ag-textarea",
    present: ".ag-article",
  };
  for (const [category, selector] of Object.entries(recipes)) {
    const css = compile(`@use "${category}";`);
    assert.ok(
      css.includes(`${selector} {`),
      `${category} includes its recipes`
    );
    assert.equal(css.match(/:where\(:root\)/g)?.length, 1);
    for (const [other, otherSelector] of Object.entries(recipes)) {
      if (other !== category)
        assert.ok(
          !css.includes(`${otherSelector} {`),
          `${category} excludes ${other}`
        );
    }
  }
  const css = compile('@use "afterglow";');
  assert.equal(css.match(/:where\(:root\)/g)?.length, 1);
  assert.equal(css.match(/:where\(\.ag-theme\)/g)?.length, 1);
});

test("pure mixins compose consumer classes without emitting Afterglow recipes", () => {
  const css = compile(`
    @use "foundation/mixins" as base;
    @use "frame/mixins" as frame;
    @use "interact/mixins" as interact;
    .custom {
      @include base.type-body;
      @include base.layout-flex-row(12px);
      @include frame.surface-panel;
      @include base.motion-entry(opacity, transform);
    }
    .field { @include interact.textarea-textarea; }
  `);
  assert.ok(css.includes("gap: 12px"));
  assert.ok(css.includes("transition-property: opacity, transform"));
  assert.ok(css.includes("prefers-reduced-motion: reduce"));
  assert.ok(css.includes("background: var(--paper)"));
  assert.ok(!css.includes(".ag-") && !css.includes(":root"));
});

test("complete recipe mixins support explicit opt-in and scoping", () => {
  const css = compile(
    '@use "interact/button.mixins" as button; .checkout { @include button.styles; }'
  );
  assert.ok(css.includes(".checkout .ag-button {"));
  assert.ok(!css.includes(":root"));
});

test("theme boundaries inherit base tokens and validate overrides", () => {
  const css = compile(
    '@use "foundation/tokens" as t; .theme { @include t.theme(("body-text-size": 20px, "h5-text-size": 32px)); }'
  );
  assert.ok(css.includes("--body-text-size: 20px"));
  assert.ok(
    css.includes(
      "--h1-text-size: calc(var(--h2-text-size) * var(--text-scale))"
    )
  );
  assert.equal(
    css.match(/--h5-text-size:/g)?.length,
    2,
    "explicit size follows derived formula"
  );
  assert.ok(
    !css.includes("--panel:"),
    "partial theme does not reset inherited colours"
  );
  assert.throws(
    () =>
      compile('@use "foundation/tokens" as t; .x { color: t.token("typo"); }'),
    /Unknown Afterglow token/
  );
  assert.throws(
    () =>
      compile(
        '@use "foundation/tokens" as t; .x { @include t.theme(("typo": red)); }'
      ),
    /Unknown Afterglow token/
  );
});

test("legacy Sass entry points retain CSS emission and exported mixins", () => {
  const legacy = compile(`
    @use "tokens" as t; @use "frames" as frame; @use "typography" as type;
    @use "button"; @use "checkable"; @use "slider"; @use "dialog"; @use "notification";
    .custom { @include frame.panel; @include type.body; color: t.$ctrlText; }
  `);
  for (const selector of [
    ".ag-panel",
    ".ag-button",
    ".ag-checkbox",
    ".ag-slider",
    ".ag-dialog",
    ".ag-notification",
    ".custom",
  ]) {
    assert.match(
      legacy,
      new RegExp(`${selector.replace(".", "\\.")}\\s*[,\\{]`)
    );
  }
  assert.equal(legacy.match(/:where\(:root\)/g)?.length, 1);
});

test("package exports resolve full, category, pure and compatibility imports", () => {
  const consumer = mkdtempSync(resolve(tmpdir(), "afterglow-sass-consumer-"));
  mkdirSync(`${consumer}/node_modules`);
  symlinkSync(process.cwd(), `${consumer}/node_modules/ag`, "dir");
  try {
    const css = compileString(
      `
    @use "pkg:ag/scss";
    @use "pkg:ag/scss/interact";
    @use "pkg:ag/scss/foundation/tokens" as t;
    @use "pkg:ag/scss/frame/surface.mixins" as frame;
    @use "pkg:ag/scss/frames" as legacy;
    .custom { @include frame.panel; color: t.$ctrlText; }
    `,
      { importers: [new NodePackageImporter(consumer)] }
    ).css;
    assert.ok(css.includes(".custom {"));
    assert.equal(css.match(/:where\(:root\)/g)?.length, 1);
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
});
