// url=https://www.figma.com/design/7Hz5rGL1JRLfouCckw8FIq/AFMaster?node-id=13-847
// source=src/styles/present/_icon.mixins.scss
// component=ag-icon
import figma from "figma";

const icon = figma.selectedInstance.getEnum("Variant", {
  Favourite: "star",
  Bookmark: "bookmark",
  Image: "image",
  Clock: "clock",
  Users: "users",
  Settings: "settings",
  Help: "help-circle",
  Explore: "compass",
  Close: "x",
  Wifi: "wifi",
  "Wifi Off": "wifi-off",
  Plus: "plus",
  Menu: "menu",
  Search: "search",
  "More Vertical": "more-vertical",
  "More Horizontal": "more-horizontal",
  Heart: "heart",
  Location: "map-pin",
  "Close circle": "x-circle",
  "Chevron down": "chevron-down",
  "Chevron left": "chevron-left",
  "Chevron right": "chevron-right",
  "Chevron up": "chevron-up",
  Locked: "lock",
  Unlocked: "unlock",
  Camera: "camera",
  Play: "play",
  Pause: "pause",
  "Skip Back": "skip-back",
  "Skip Forward": "skip-forward",
});

export default {
  example: figma.code`<span class="ag-icon" data-icon="${icon}" aria-hidden="true"></span>`,
  imports: ['import "ag/css";'],
  id: "afterglow-icon",
  metadata: { nestable: true },
};
