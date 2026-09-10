import { esbuildPlugin } from "@web/dev-server-esbuild";
import { playwrightLauncher } from "@web/test-runner-playwright";

export default {
  hostname: "127.0.0.1",
  files: "test/**/*.test.js",
  nodeResolve: {
    dedupe: ["lit", "lit-html", "lit-element", "@lit/reactive-element"],
  },
  plugins: [esbuildPlugin({ ts: true, tsconfig: "./tsconfig.json" })],
  browsers: [
    playwrightLauncher({
      product: "chromium",
      launchOptions: process.env.WTR_BROWSER_CHANNEL
        ? { channel: process.env.WTR_BROWSER_CHANNEL }
        : {},
    }),
  ],
  testFramework: { config: { timeout: 5000 } },
};
