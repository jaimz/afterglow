// url=https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=87-13
// source=src/styles/interact/_breadcrumb.mixins.scss
// component=ag-breadcrumb
import figma from "figma";

const labels = figma.selectedInstance.findConnectedInstances(
  (node) => node.codeConnectId() === "afterglow-breadcrumb-label"
);
let crumbs = figma.code``;
labels.forEach((label, index) => {
  if (label.type !== "INSTANCE") return;
  const content = label.executeTemplate().example;
  const current = index === labels.length - 1 ? ' aria-current="page"' : "";
  crumbs = figma.code`${crumbs}
    <li class="ag-breadcrumb__item"${current}>${content}</li>`;
});

// The application may replace ancestor spans with links to its actual routes.
// Separators are supplied by CSS, so they stay decorative and follow RTL flow.
export default {
  example: figma.code`<nav class="ag-breadcrumb" aria-label="Breadcrumb">
  <ol class="ag-breadcrumb__list" role="list">${crumbs}
  </ol>
</nav>
<!-- Call enhanceBreadcrumb(nav) after rendering to shorten long labels. -->`,
  imports: ['import "ag/css";', 'import { enhanceBreadcrumb } from "ag";'],
  id: "afterglow-breadcrumb",
  metadata: { nestable: true },
};
