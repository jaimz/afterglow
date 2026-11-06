# Minimal consumer

This example uses the installed package, native HTML and browser ES modules. It needs no app framework, Sass compiler or bundler.

1. At the Afterglow repository root, install dependencies and run `npm pack`.
2. Copy this directory outside the repository.
3. In the copied directory, run `npm install /absolute/path/to/ag-0.0.0.tgz`.
4. Serve that directory, for example `python3 -m http.server 8080`, and open `http://localhost:8080`.

The stylesheet keeps its bundled assets beside it in `node_modules/ag/dist`. The import map resolves `ag` to the packaged ES module. In a bundled app, use `import "ag/css"` and ordinary imports from `ag` instead of the link/import map.

The example demonstrates a local typography theme, icon button, keyboard-dismissable popover, read-only slider and controller cleanup. From the Afterglow repository, `npm run test:consumer` installs the tarball into a temporary copy and checks these behaviours. Set `WTR_BROWSER_CHANNEL=chrome` to use installed Chrome instead of Playwright Chromium.
