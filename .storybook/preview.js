import "../src/styles/afterglow.scss";
import { cleanupStories } from "../src/stories/fixtures";
export const decorators = [
  (story) => {
    cleanupStories();
    return story();
  },
];
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
};
