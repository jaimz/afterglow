import { element } from "../../stories/fixtures";

export default {
  title: "Interact/Location Index",
  parameters: { controls: { disable: true } },
};

export const Default = () =>
  element(`<section class="ag-panel ag-body" style="padding:24px;max-width:320px">
  <nav class="ag-location-index" aria-label="Documents">
    <div><h2 class="ag-location-index__title">Library</h2>
      <ul class="ag-location-index__list">
        <li><a class="ag-location-index__link" href="#shared-documents" aria-current="page"><span class="ag-location-index__icon" data-icon="shared" aria-hidden="true"></span>Shared with me</a></li>
        <li><a class="ag-location-index__link" href="#my-documents"><span class="ag-location-index__icon" data-icon="shared" aria-hidden="true"></span>My documents</a></li>
      </ul>
    </div>
  </nav>
  <p class="ag-caption">Native links provide navigation. The application sets aria-current for the current destination.</p>
</section>`);
