import { describe, it, expect } from "vitest";
import { DEFAULT_THEME, getTheme, isThemeId, THEMES } from "./themes";

describe("theme registry", () => {
  it("defaults to a dark theme", () => {
    expect(DEFAULT_THEME).toBe("dark-focus");
    expect(getTheme(DEFAULT_THEME).isDark).toBe(true);
  });

  it("includes the default theme in the registry", () => {
    expect(THEMES.some((t) => t.id === DEFAULT_THEME)).toBe(true);
  });

  it("has unique theme ids", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getTheme", () => {
  it("returns the matching theme metadata", () => {
    expect(getTheme("dark-focus").name).toBe("Dark Focus");
  });

  it("falls back to the first theme for unknown / nullish ids", () => {
    expect(getTheme("does-not-exist")).toBe(THEMES[0]);
    expect(getTheme(null)).toBe(THEMES[0]);
    expect(getTheme(undefined)).toBe(THEMES[0]);
  });
});

describe("isThemeId", () => {
  it("accepts known ids and rejects everything else", () => {
    expect(isThemeId("dark-focus")).toBe(true);
    expect(isThemeId("vision-classic")).toBe(true);
    expect(isThemeId("nope")).toBe(false);
    expect(isThemeId(123)).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });
});
