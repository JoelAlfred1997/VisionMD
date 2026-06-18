/**
 * Document outline + reading statistics.
 *
 * Framework-agnostic so it stays testable in isolation (per project
 * conventions). The outline uses the same `github-slugger` that `rehype-slug`
 * runs at render time, so the ids here match the heading anchors in the DOM and
 * clicking an outline entry always finds its target.
 */
import GithubSlugger from "github-slugger";
import type { OutlineItem, ReadingStats } from "../../types";

/** Average adult reading speed (words per minute) for the time estimate. */
const WORDS_PER_MINUTE = 200;

/** ATX heading: 1–6 leading `#`, required space, then the text. */
const ATX_HEADING = /^(#{1,6})[ \t]+(.*)$/;

/** Strip a leading YAML/TOML frontmatter block so its `---` isn't misread. */
function stripFrontmatter(source: string): string {
  const match = source.match(/^(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\1\r?\n?/);
  return match ? source.slice(match[0].length) : source;
}

/** Toggle fence state for a line; returns the new "inside fence" flag. */
function fenceToggle(line: string, inside: boolean): boolean {
  // A fence is 3+ backticks or tildes at the (optionally indented) line start.
  if (/^\s{0,3}(```+|~~~+)/.test(line)) return !inside;
  return inside;
}

/**
 * Reduce inline Markdown to the plain text a reader sees, matching what
 * `rehype-slug` slugs against (it works on rendered text content):
 * link/image markup, emphasis, inline code and raw HTML tags are removed.
 */
function toPlainText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images: no alt in text content
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // inline links -> label
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1") // reference links -> label
    .replace(/`+([^`]+)`+/g, "$1") // inline code
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // bold / italic
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/<[^>]+>/g, "") // raw HTML tags
    .replace(/\s+#+\s*$/, "") // closing ATX sequence (## Title ##)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract an ordered outline of ATX headings from Markdown source. Headings
 * inside fenced code blocks and frontmatter are ignored.
 */
export function buildOutline(source: string): OutlineItem[] {
  const body = stripFrontmatter(source);
  const slugger = new GithubSlugger();
  const items: OutlineItem[] = [];
  let inFence = false;

  for (const rawLine of body.split("\n")) {
    const wasInFence = inFence;
    inFence = fenceToggle(rawLine, inFence);
    // Skip the fence delimiter line itself and anything inside a code block.
    if (wasInFence || inFence) continue;

    const match = ATX_HEADING.exec(rawLine);
    if (!match) continue;

    const level = match[1].length;
    const text = toPlainText(match[2]);
    if (!text) continue; // empty heading -> no useful outline entry

    items.push({ level, text, id: slugger.slug(text) });
  }

  return items;
}

/**
 * Compute reading statistics for a document. Frontmatter is excluded; words are
 * counted as alphanumeric tokens so Markdown punctuation (`#`, `---`, `>`)
 * doesn't inflate the total. Reading time rounds up, with a 1-minute floor for
 * any non-empty document.
 */
export function computeReadingStats(source: string): ReadingStats {
  const body = stripFrontmatter(source);
  const words = body.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const characters = body.replace(/\s/g, "").length;
  const readingMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return { words, characters, readingMinutes };
}
