import {
  mkdtempSync,
  cpSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { compileString, NodePackageImporter } from "sass";
import assert from "node:assert/strict";

const root = process.cwd(),
  directory = mkdtempSync(join(tmpdir(), "afterglow-consumer-"));
let browser, server;
try {
  cpSync(resolve("examples/consumer"), directory, { recursive: true });
  const npm = (args, cwd = root) =>
    execFileSync("npm", [...args, "--cache", join(directory, ".npm-cache")], {
      cwd,
      encoding: "utf8",
    });
  const [packed] = JSON.parse(
    npm(["pack", "--ignore-scripts", "--json", "--pack-destination", directory])
  );
  npm(
    [
      "install",
      join(directory, packed.filename),
      "--ignore-scripts",
      "--package-lock=false",
      "--no-audit",
      "--no-fund",
    ],
    directory
  );
  // Resolve public package exports from the installed package, not source aliases.
  writeFileSync(
    join(directory, "verify.mjs"),
    `import { enhancePopover, validateMarkup } from 'ag';
    import { createRequire } from 'node:module';
    if (typeof enhancePopover !== 'function' || typeof validateMarkup !== 'function') throw Error('Missing exports');
    createRequire(import.meta.url).resolve('ag/css');`
  );
  execFileSync(process.execPath, ["verify.mjs"], { cwd: directory });
  const sass = compileString(
    '@use "pkg:ag/scss/tokens" as t; @use "pkg:ag/scss/frame/mixins" as frame; .sample { @include frame.surface-panel; font-size: t.token("h3-text-size"); }',
    {
      importers: [new NodePackageImporter(directory)],
    }
  ).css;
  assert.ok(
    !sass.includes(":root") && !sass.includes(".ag-panel"),
    "Pure imports must not emit classes/theme"
  );
  server = createServer((req, res) => {
    const path = resolve(
      directory,
      "." +
        new URL(req.url, "http://localhost").pathname.replace(
          /\/$/,
          "/index.html"
        )
    );
    if (!path.startsWith(directory + "/")) {
      res.writeHead(403).end();
      return;
    }
    try {
      const types = {
        html: "text/html",
        js: "text/javascript",
        mjs: "text/javascript",
        css: "text/css",
        svg: "image/svg+xml",
        woff2: "font/woff2",
        ttf: "font/ttf",
      };
      res.setHeader(
        "Content-Type",
        types[path.split(".").pop()] || "application/octet-stream"
      );
      res.end(readFileSync(path));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch(
    process.env.WTR_BROWSER_CHANNEL
      ? { channel: process.env.WTR_BROWSER_CHANNEL }
      : {}
  );
  const page = await browser.newPage();
  const errors = [],
    failed = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#details").click();
  await page.waitForFunction(() =>
    document.querySelector("#panel").matches(":popover-open")
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.querySelector("#panel").matches(":popover-open")
  );
  const result = await page.evaluate(() => ({
    focus: document.activeElement.id,
    font: getComputedStyle(document.querySelector("h1")).fontSize,
    readOnly: document.querySelector("input").getAttribute("aria-readonly"),
    gap: getComputedStyle(document.querySelector("main")).paddingLeft,
  }));
  assert.equal(result.focus, "details");
  assert.ok(Math.abs(parseFloat(result.font) - 18 * 1.25 ** 3) < 0.02);
  assert.equal(result.readOnly, "true");
  assert.equal(result.gap, "24px");
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  console.log(
    "Installed-package consumer passed: exports, pure Sass, fonts/icons, local typography, popover and read-only slider."
  );
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  rmSync(directory, { recursive: true, force: true });
}
