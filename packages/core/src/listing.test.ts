import { describe, expect, it } from "vitest";
import { checkListingType } from "./listing";

describe("checkListingType", () => {
  it("official items can be sold, traded, or either", () => {
    for (const t of ["sale", "trade", "sale_or_trade"] as const) expect(checkListingType({ isUnofficial: false }, t).ok).toBe(true);
  });
  it("unofficial items can be traded but not sold", () => {
    expect(checkListingType({ isUnofficial: true }, "trade").ok).toBe(true);
    expect(checkListingType({ isUnofficial: true }, "sale")).toEqual({ ok: false, reason: "unofficial_item_sale" });
    expect(checkListingType({ isUnofficial: true }, "sale_or_trade").ok).toBe(false);
  });
});
