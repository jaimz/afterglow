import { DesignToken } from "@microsoft/fast-foundation";

export const error = DesignToken.create<string>("error").withDefault("#cf3558");
export const onError =
  DesignToken.create<string>("on-error").withDefault("#f3eee6");

export const caution =
  DesignToken.create<string>("caution").withDefault("#ecbb5b");
export const onCaution =
  DesignToken.create<string>("on-caution").withDefault("#f3eee6");

export const success =
  DesignToken.create<string>("success").withDefault("#52a96a");
export const onSuccess =
  DesignToken.create<string>("on-success").withDefault("#f3eee6");
