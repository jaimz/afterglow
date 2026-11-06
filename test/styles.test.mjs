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
import { execFileSync } from "node:child_process";

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
  assert.ok(!css.includes(":where(.ag-theme)"));
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

test("the icon catalogue covers every asset and allows selective Sass composition", () => {
  execFileSync(process.execPath, ["scripts/build-icons.mjs", "--check"]);
  const names = readdirSync(`${styles}/assets/feather`)
    .filter((file) => file.endsWith(".svg"))
    .map((file) => file.slice(0, -4));
  const css = compile('@use "present/icon.classes";');
  for (const name of names) {
    assert.ok(css.includes(`.ag-icon[data-icon=${name}]`), name);
    assert.ok(css.includes(`./assets/feather/${name}.svg`), name);
  }
  const selected = compile(`
    @use "present/icon.mixins" as icon;
    .custom { @include icon.icon("search"); }
    .scoped { @include icon.styles(("check", "x")); }
  `);
  assert.ok(selected.includes(".custom {"));
  assert.ok(selected.includes(".scoped .ag-icon[data-icon=check]"));
  assert.ok(selected.includes("./assets/feather/search.svg"));
  assert.ok(!selected.includes("./assets/feather/feather.svg"));
  assert.ok(!selected.includes(":root"));
  assert.throws(
    () =>
      compile(
        '@use "present/icon.mixins" as icon; .custom { @include icon.icon("missing"); }'
      ),
    /Unknown Afterglow icon/
  );
});

test("theme boundaries inherit base tokens and validate overrides", () => {
  const css = compile(
    '@use "foundation/tokens" as t; .theme { @include t.theme(("body-text-size": 20px, "h5-text-size": 32px)); }'
  );
  assert.ok(css.includes("--body-text-size: 20px"));
  assert.ok(
    !css.includes("--h1-text-size:"),
    "derived defaults are not frozen on the ancestor"
  );
  assert.equal(css.match(/--h5-text-size:/g)?.length, 1);
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

test("short token and typography imports are pure; theme emission is explicit", () => {
  assert.equal(compile('@use "tokens"; @use "typography";'), "");
  const css = compile('@use "theme";');
  assert.equal(css.match(/:where\(:root\)/g)?.length, 1);
  assert.ok(css.includes("@font-face"));
});

test("all emitted custom property names are lower-case dashed and grid defaults are lengths", () => {
  const css = compile('@use "afterglow";');
  for (const name of css.matchAll(/--([\w-]+)\s*:/g))
    assert.match(name[1], /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
  assert.match(css, /--grid-x: 8px/);
  assert.match(css, /--grid-y: 8px/);
  assert.match(css, /--grid-type: 4px/);
});

test("documentation contents are synchronized", () => {
  execFileSync(process.execPath, ["scripts/sync-docs.mjs", "--check"]);
});

test("package exports resolve full, category and pure imports", () => {
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
    @use "pkg:ag/scss/tokens" as short;
    .custom { @include frame.panel; color: t.$ctrl-text; }
    `,
      { importers: [new NodePackageImporter(consumer)] }
    ).css;
    assert.ok(css.includes(".custom {"));
    assert.equal(css.match(/:where\(:root\)/g)?.length, 1);
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
});
