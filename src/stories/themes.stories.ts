import { element } from "./fixtures";

export default { title: "Afterglow/Themes" };

const markup = `<main class="ag-body" style="padding:24px;display:grid;gap:24px;max-width:800px">
  <section class="ag-panel" style="padding:24px">
    <h2 class="ag-h2">Default theme</h2>
    <p>Tokens are declared on the document root and inherited by these elements.</p>
    <p class="ag-caption">Default caption size</p>
    <button class="ag-button" type="button" data-variant="primary">Default action</button>
  </section>
  <section class="ag-theme ag-panel ag-body" style="--panel:#fffdf6;--body-text-size:20px;--text-scale:1.25;--ctrl-fill-solid:#006779;padding:24px">
    <h2 class="ag-h2">Local theme</h2>
    <p>The heading and caption follow this section's base size and scale.</p>
    <p class="ag-caption">Locally derived caption size</p>
    <button class="ag-button" type="button" data-variant="primary">Local action</button>
    <section class="ag-theme ag-body" style="--text-scale:1.1;margin-top:24px">
      <h3 class="ag-h3">Nested theme</h3>
      <p style="font-size:var(--caption-text-size);color:var(--ctrlText)">This ordinary paragraph uses tokens directly, without fallback values. The nested theme inherits the outer colour and body size, with its own type scale.</p>
    </section>
  </section>
</main>`;

export const DefaultAndLocal = () => element(markup);
DefaultAndLocal.parameters = { docs: { source: { code: markup } } };
