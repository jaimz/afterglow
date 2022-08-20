import { DesignSystem } from "@microsoft/fast-foundation";

export function provideAGDesignSystem(element?: HTMLElement): DesignSystem {
  return DesignSystem.getOrCreate(element).withPrefix("ag");
}
