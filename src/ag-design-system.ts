import { registerAfterglow } from "./custom-element";

export { registerAfterglow };

/** Compatibility for the original Afterglow bootstrap; theming now uses CSS variables. */
export function provideAGDesignSystem(_element?: HTMLElement) {
  return {
    register(...components: Array<{ register(): void } | (() => void)>) {
      for (const component of components) {
        if (typeof component === "function") component();
        else component.register();
      }
      return this;
    },
  };
}
