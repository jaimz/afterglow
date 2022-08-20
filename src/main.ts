import { allComponents } from "./custom-element";
import { provideAGDesignSystem } from "./ag-design-system";

export const AGDesignSystem = provideAGDesignSystem().register(allComponents);
