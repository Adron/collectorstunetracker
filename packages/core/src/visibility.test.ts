import { describe, expect, it } from "vitest";
import { canView, isLessVisible, resolveVisibility, type VisibilityChain } from "./visibility";

const chain = (c: Partial<VisibilityChain>): VisibilityChain => ({
  profile: "public",
  collection: "private",
  groups: [],
  item: "inherit",
  ...c,
});

describe("resolveVisibility", () => {
  it("defaults to the collection when nothing overrides it", () => {
    expect(resolveVisibility(chain({ collection: "public" }))).toEqual({ visibility: "public", source: "collection" });
  });

  it("a private profile makes everything private", () => {
    expect(resolveVisibility(chain({ profile: "private", collection: "public", item: "public" })).visibility).toBe("private");
  });

  it("the nearest explicit group wins over outer groups and the collection", () => {
    const r = resolveVisibility(chain({ collection: "public", groups: ["unlisted", "inherit", "private", "inherit"] }));
    expect(r).toEqual({ visibility: "private", source: "group", groupIndex: 2 });
  });

  it("an item can be public inside a private collection (example from the spec)", () => {
    expect(resolveVisibility(chain({ collection: "private", groups: ["private"], item: "public" })).visibility).toBe("public");
  });

  it("a private group hides items inside a public collection (example from the spec)", () => {
    expect(resolveVisibility(chain({ collection: "public", groups: ["private"] })).visibility).toBe("private");
  });
});

describe("canView", () => {
  it("owners see everything", () => {
    expect(canView({ effective: "private", unlistedTokens: [] }, { isOwner: true })).toBe(true);
  });
  it("anyone sees public", () => {
    expect(canView({ effective: "public", unlistedTokens: [] }, { isOwner: false })).toBe(true);
  });
  it("unlisted needs a matching token from the item or an ancestor", () => {
    const target = { effective: "unlisted" as const, unlistedTokens: [null, "grp-tok", "col-tok"] };
    expect(canView(target, { isOwner: false })).toBe(false);
    expect(canView(target, { isOwner: false, tokens: ["wrong"] })).toBe(false);
    expect(canView(target, { isOwner: false, tokens: ["col-tok"] })).toBe(true);
  });
  it("private is owner-only", () => {
    expect(canView({ effective: "private", unlistedTokens: ["x"] }, { isOwner: false, tokens: ["x"] })).toBe(false);
  });
});

describe("isLessVisible", () => {
  it("orders private < unlisted < public", () => {
    expect(isLessVisible("public", "unlisted")).toBe(true);
    expect(isLessVisible("unlisted", "private")).toBe(true);
    expect(isLessVisible("private", "public")).toBe(false);
  });
});
