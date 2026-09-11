import { element } from "../../stories/fixtures";

export default {
  title: "Frame/Layouts",
  parameters: { controls: { disable: true } },
};

const navigation = `<nav class="ag-location-index" aria-label="Notebook">
  <ul class="ag-location-index__list"><li><a href="#layout-notes" class="ag-location-index__link" aria-current="page">Notes</a></li><li><a href="#layout-collections" class="ag-location-index__link">Collections</a></li></ul>
</nav>`;
const article = `<article class="ag-article"><h1 id="layout-notes">Your notebook</h1><p>A familiar place for ideas, observations and things to come back to.</p><h2 id="layout-collections">Collections</h2><p>Group related notes and keep the details close.</p></article>`;

export const Application = () =>
  element(`<div class="ag-appframe ag-background ag-body" data-layout="application" style="box-sizing:border-box;padding:24px;min-height:560px;--app-nav-width:200px;--app-tools-width:220px">
  <header class="ag-appframe__header"><h1 class="ag-h3" style="margin:0">Afterglow</h1></header>
  <aside class="ag-appframe__nav ag-panel">${navigation}</aside>
  <main class="ag-appframe__main ag-paper">${article}</main>
  <aside class="ag-appframe__tools ag-panel" style="padding:16px"><label for="layout-note">Quick note</label><textarea class="ag-textarea" id="layout-note" placeholder="Text area…"></textarea></aside>
</div>`);

export const MasterDetail = () =>
  element(`<div class="ag-master-detail ag-panel" style="padding:16px;--master-width:220px">
  <aside class="ag-master-detail__master">${navigation}</aside>
  <main class="ag-master-detail__detail ag-paper">${article}</main>
  <footer class="ag-master-detail__aux ag-body">Resize the preview to see the regions stack.</footer>
</div>`);

export const Card = () =>
  element(`<section class="ag-background ag-body" style="height:auto;box-sizing:border-box;padding:24px">
  <article class="ag-card ag-panel" style="max-width:480px">
    <header class="ag-card__header"><h2 class="ag-h3" style="margin:0">A useful frame</h2></header>
    <div class="ag-card__body"><p style="margin:0">The card arranges a header, content and actions. Its colours and elevation come from the existing panel class.</p></div>
    <footer class="ag-card__footer"><button class="ag-button" type="button">Cancel</button><button class="ag-button" type="button" data-variant="primary">Continue</button></footer>
  </article>
</section>`);
