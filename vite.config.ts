import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
export default defineConfig({
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  plugins: [
    {
      name: "afterglow-static-example",
      generateBundle(_options, bundle) {
        // Storybook also reads this Vite config; keep its manager page intact.
        if (!bundle["afterglow.mjs"]) return;
        this.emitFile({
          type: "asset",
          fileName: "index.html",
          source: readFileSync("index.html", "utf8").replace(
            "/src/styles/afterglow.scss",
            "./afterglow.css"
          ),
        });
      },
    },
  ],
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "afterglow.mjs",
    },
    sourcemap: true,
  },
});
