import { DesignToken } from "@microsoft/fast-foundation";

const { create } = DesignToken;

export const gridX = create<number>("gridX").withDefault(8);
export const gridY = create<number>("gridY").withDefault(8);
export const gridType = create<number>("gridType").withDefault(4);
