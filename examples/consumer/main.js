import { enhancePopover, enhanceSlider, validateMarkup } from "ag";

const issues = validateMarkup(document);
if (issues.length)
  throw new Error(issues.map((issue) => issue.message).join("\n"));
const controllers = [
  enhancePopover(document.querySelector("#panel"), {
    trigger: document.querySelector("#details"),
  }),
  enhanceSlider(document.querySelector("#volume")),
];
window.addEventListener(
  "pagehide",
  () => controllers.forEach((controller) => controller.destroy()),
  { once: true }
);
