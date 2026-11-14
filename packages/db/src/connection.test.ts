import { describe, expect, it } from "vitest";
import { withVerifiedSsl } from "./connection.ts";

describe("withVerifiedSsl", () => {
  it.each(["prefer", "require", "verify-ca"])("upgrades sslmode=%s to verify-full", (mode) => {
    expect(withVerifiedSsl(`postgres://u:p@h.neon.tech/db?sslmode=${mode}&channel_binding=require`)).toBe(
      "postgres://u:p@h.neon.tech/db?sslmode=verify-full&channel_binding=require",
    );
  });

  it("keeps verify-full, disable, and URLs without sslmode", () => {
    for (const url of ["postgres://h/db?sslmode=verify-full", "postgres://h/db?sslmode=disable", "postgres://postgres@localhost:5432/ctt"]) {
      expect(withVerifiedSsl(url)).toBe(url);
    }
  });

  it("only touches the sslmode parameter", () => {
    expect(withVerifiedSsl("postgres://h/db?channel_binding=require&sslmode=require")).toBe("postgres://h/db?channel_binding=require&sslmode=verify-full");
  });
});
