import { describe, it, expect } from "vitest";
import { buildOutline, computeReadingStats } from "./outline";

describe("buildOutline", () => {
  it("extracts ATX headings with matching levels and slug ids", () => {
    const md = ["# Title", "", "## Section One", "", "### Detail"].join("\n");
    expect(buildOutline(md)).toEqual([
      { level: 1, text: "Title", id: "title" },
      { level: 2, text: "Section One", id: "section-one" },
      { level: 3, text: "Detail", id: "detail" },
    ]);
  });

  it("ignores '#' lines inside fenced code blocks", () => {
    const md = ["# Real", "", "```bash", "# not a heading", "```", "", "## After"].join("\n");
    expect(buildOutline(md).map((h) => h.text)).toEqual(["Real", "After"]);
  });

  it("handles tilde fences and indented fences too", () => {
    const md = ["~~~", "# hidden", "~~~", "# Visible"].join("\n");
    expect(buildOutline(md).map((h) => h.text)).toEqual(["Visible"]);
  });

  it("strips a leading frontmatter block so its title is not a heading", () => {
    const md = ["---", "title: My Doc", "---", "# Heading"].join("\n");
    expect(buildOutline(md)).toEqual([{ level: 1, text: "Heading", id: "heading" }]);
  });

  it("reduces inline markup to plain text for the outline label", () => {
    const md = "## A **bold** [link](http://x) and `code`";
    const [item] = buildOutline(md);
    expect(item.text).toBe("A bold link and code");
  });

  it("drops the closing ATX sequence (## Title ##)", () => {
    expect(buildOutline("## Title ##")[0].text).toBe("Title");
  });

  it("deduplicates ids the same way rehype-slug does", () => {
    const md = ["# Setup", "# Setup", "# Setup"].join("\n");
    expect(buildOutline(md).map((h) => h.id)).toEqual(["setup", "setup-1", "setup-2"]);
  });

  it("skips empty headings", () => {
    expect(buildOutline("#   \n## Real")).toEqual([
      { level: 2, text: "Real", id: "real" },
    ]);
  });

  it("does not throw on malformed markdown (unterminated fence)", () => {
    const md = ["# Before", "```", "# swallowed by open fence"].join("\n");
    expect(() => buildOutline(md)).not.toThrow();
    expect(buildOutline(md).map((h) => h.text)).toEqual(["Before"]);
  });

  it("returns an empty array for empty input", () => {
    expect(buildOutline("")).toEqual([]);
  });
});

describe("computeReadingStats", () => {
  it("counts words, non-whitespace characters, and reading minutes", () => {
    const stats = computeReadingStats("one two three");
    expect(stats.words).toBe(3);
    expect(stats.characters).toBe("onetwothree".length);
    expect(stats.readingMinutes).toBe(1);
  });

  it("returns zeros for empty or whitespace-only input", () => {
    expect(computeReadingStats("")).toEqual({
      words: 0,
      characters: 0,
      readingMinutes: 0,
    });
    expect(computeReadingStats("   \n\t ").words).toBe(0);
  });

  it("does not count markdown punctuation as words", () => {
    expect(computeReadingStats("# --- > * |").words).toBe(0);
  });

  it("treats hyphenated and apostrophed tokens as single words", () => {
    expect(computeReadingStats("state-of-the-art it's fine").words).toBe(3);
  });

  it("excludes frontmatter from the counts", () => {
    const md = ["---", "title: ignored words here", "---", "real body"].join("\n");
    expect(computeReadingStats(md).words).toBe(2);
  });

  it("rounds reading time up with a one-minute floor", () => {
    const words = Array.from({ length: 201 }, (_, i) => `w${i}`).join(" ");
    expect(computeReadingStats(words).readingMinutes).toBe(2);
  });

  it("handles a very large document without choking", () => {
    const big = "lorem ipsum dolor sit amet ".repeat(50_000); // ~250k words
    const stats = computeReadingStats(big);
    expect(stats.words).toBe(5 * 50_000);
    expect(stats.readingMinutes).toBe(Math.ceil((5 * 50_000) / 200));
  });
});
