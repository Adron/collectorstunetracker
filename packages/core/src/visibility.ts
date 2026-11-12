/**
 * Layered visibility: profile → collection → group(s) → item.
 * Spec: docs/spec/01-product-spec.md §5.9, docs/spec/03-domain-and-data-model.md §9.1.
 */

export const VISIBILITIES = ["private", "unlisted", "public"] as const;
export type Visibility = (typeof VISIBILITIES)[number];
export type VisibilitySetting = Visibility | "inherit";
export type ProfileVisibility = "private" | "public";

export interface VisibilityChain {
  profile: ProfileVisibility;
  /** The collection's setting. Collections can't inherit. */
  collection: Visibility;
  /** Group settings from the outermost group down to the item's own group. */
  groups: readonly VisibilitySetting[];
  item: VisibilitySetting;
}

export interface Resolved {
  visibility: Visibility;
  /** Which level decided it, for "Public, inherited from Main Shelf"-style explanations. */
  source: "profile" | "collection" | "group" | "item";
  /** Index into `groups` when source = "group". */
  groupIndex?: number;
}

/** The profile master switch wins; otherwise the most specific explicit setting wins. */
export function resolveVisibility(chain: VisibilityChain): Resolved {
  if (chain.profile === "private") return { visibility: "private", source: "profile" };
  if (chain.item !== "inherit") return { visibility: chain.item, source: "item" };
  for (let i = chain.groups.length - 1; i >= 0; i--) {
    const g = chain.groups[i]!;
    if (g !== "inherit") return { visibility: g, source: "group", groupIndex: i };
  }
  return { visibility: chain.collection, source: "collection" };
}

export interface Viewer {
  isOwner: boolean;
  /** Unlisted tokens presented by the viewer (from the URL). */
  tokens?: readonly string[];
}

export interface Viewable {
  effective: Visibility;
  /** Unlisted tokens of the thing and its ancestors (item, groups, collection). */
  unlistedTokens: readonly (string | null | undefined)[];
}

export function canView(target: Viewable, viewer: Viewer): boolean {
  if (viewer.isOwner) return true;
  if (target.effective === "public") return true;
  if (target.effective === "unlisted") {
    const presented = new Set(viewer.tokens ?? []);
    return target.unlistedTokens.some((t) => !!t && presented.has(t));
  }
  return false;
}

/** Rank for "is this change making things more or less visible?" (less visible ⇒ purge caches first). */
const RANK: Record<Visibility, number> = { private: 0, unlisted: 1, public: 2 };
export const isLessVisible = (from: Visibility, to: Visibility): boolean => RANK[to] < RANK[from];

/** Fields that never appear on public or unlisted pages, whatever the visibility (03 §9.1). */
export const ALWAYS_PRIVATE_ITEM_FIELDS = [
  "price_paid",
  "price_currency",
  "acquired_from",
  "location_id",
  "private_notes_md",
] as const;

export const ALWAYS_PRIVATE_IMAGE_TYPES = ["receipt", "coa", "damage"] as const;
