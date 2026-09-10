import { esbuildPlugin } from "@web/dev-server-esbuild";
import { playwrightLauncher } from "@web/test-runner-playwright";
import { compile } from "sass";
const css = compile("src/styles/afterglow.scss").css;
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
