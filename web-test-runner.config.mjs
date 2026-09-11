import { esbuildPlugin } from "@web/dev-server-esbuild";
import { playwrightLauncher } from "@web/test-runner-playwright";
import { compile } from "sass";
import { readFileSync } from "node:fs";
const css = compile("src/styles/afterglow.scss").css;
const categoryStyles = new Map(
  ["frame", "indicate", "interact", "present"].map((category) => [
    `/afterglow-${category}.css`,
    compile(`src/styles/${category}/_index.scss`).css,
  ])
);
const products = (process.env.WTR_BROWSERS || "chromium").split(",");
export default {
  hostname: "127.0.0.1",
  files: "test/**/*.test.js",
  nodeResolve: true,
  plugins: [
    esbuildPlugin({ ts: true, tsconfig: "./tsconfig.json" }),
    {
      name: "afterglow-css",
      serve(context) {
        if (context.path === "/afterglow.css")
          return { body: css, type: "css" };
        if (categoryStyles.has(context.path))
          return { body: categoryStyles.get(context.path), type: "css" };
        if (
          /^\/assets\/(notification\/(info|alert|success|caution|close)|navigation\/shared|button\/add)\.svg$/.test(
            context.path
          )
        )
          return {
            body: readFileSync(`src/styles${context.path}`),
            type: "image/svg+xml",
          };
      },
    },
  ],
  browsers: products.map((product) =>
    playwrightLauncher({
      product,
      createPage: async ({ context }) => {
        const page = await context.newPage();
        if (process.env.WTR_DEBUG) {
          page.on("console", (message) =>
            console.log(product, message.type(), message.text())
          );
          page.on("pageerror", (error) => console.error(product, error));
          page.on("requestfailed", (request) =>
            console.error(product, request.url(), request.failure())
          );
        }
        return page;
      },
      launchOptions:
        product === "chromium" && process.env.WTR_BROWSER_CHANNEL
          ? { channel: process.env.WTR_BROWSER_CHANNEL }
          : {},
    })
  ),
  testFramework: { config: { timeout: 5000 } },
};
