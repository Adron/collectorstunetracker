/** Marketplace rules. Spec: docs/spec/01-product-spec.md §5.10, Q20. */

export const LISTING_TYPES = ["sale", "trade", "sale_or_trade"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export interface ListableItem {
  isUnofficial: boolean;
}

export type ListingCheck = { ok: true } | { ok: false; reason: "unofficial_item_sale" };

/** Unofficial items (bootlegs, homemade copies) may be traded but never sold. */
export function checkListingType(item: ListableItem, type: ListingType): ListingCheck {
  if (item.isUnofficial && type !== "trade") return { ok: false, reason: "unofficial_item_sale" };
  return { ok: true };
}
