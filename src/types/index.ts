/**
 * Core type definitions for VisionMD.
 * Kept framework-agnostic so file/markdown logic stays testable in isolation.
 */

/** The reading/editing modes the user can switch between. */
export const VIEW_MODES = ["document", "raw", "split", "edit"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/** Type guard for a valid view mode (used to validate persisted values). */
export function isViewMode(value: unknown): value is ViewMode {
  return typeof value === "string" && (VIEW_MODES as readonly string[]).includes(value);
}

/** Identifiers for the built-in themes. Must match keys in THEMES and themes.css. */
export type ThemeId =
  | "vision-classic"
  | "academic"
  | "github-clean"
  | "interview-notes"
  | "dark-focus";

/** Theme metadata used to render the theme selector. */
export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  /** Whether this theme is dark, so we can hint the OS / scrollbars. */
  isDark: boolean;
}

/** A Markdown file that has been opened into the viewer. */
export interface MarkdownDocument {
  /** Absolute path when available (Tauri). Empty for browser-dropped files. */
  path: string;
  /** Display name, e.g. "README.md". */
  name: string;
  /** Raw, untouched Markdown source. VisionMD never mutates this. */
  content: string;
  /** Byte size if known, used for large-file handling. */
  size: number;
}

/** A single heading entry in the document outline. */
export interface OutlineItem {
  /** Heading depth, 1–3 are shown in the sidebar. */
  level: number;
  /** Rendered text of the heading. */
  text: string;
  /** Slug id used as the scroll anchor (matches rehype-slug output). */
  id: string;
}

/** Reading statistics shown in the status bar. */
export interface ReadingStats {
  words: number;
  characters: number;
  /** Estimated reading time in whole minutes (min 1 when there is content). */
  readingMinutes: number;
}

/** A recently opened file, persisted locally. */
export interface RecentFile {
  path: string;
  name: string;
  /** Unix ms timestamp of last open, for sorting. */
  lastOpened: number;
}

/** Supported Markdown file extensions (lowercase, without dot). */
export const SUPPORTED_EXTENSIONS = ["md", "markdown", "mdown", "mkd"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];
