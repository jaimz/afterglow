// url=https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=87-5
// source=src/styles/interact/_breadcrumb.mixins.scss
// component=ag-breadcrumb__link
import figma from "figma";

const instance = figma.selectedInstance;
const label = instance
  .getString("Location")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");
const icon = instance.getInstanceSwap("Icon");
const iconCode =
  icon?.type === "INSTANCE" ? icon.executeTemplate().example : undefined;

export default {
  example: figma.code`<span class="ag-breadcrumb__link">
  ${iconCode}
  <span class="ag-breadcrumb__label">${label}</span>
</span>`,
  imports: ['import "ag/css";'],
  id: "afterglow-breadcrumb-label",
  metadata: { nestable: true },
};
