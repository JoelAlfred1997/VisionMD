import type { ThemeId, ThemeMeta } from "../../types";

/**
 * Registry of built-in themes. The `id` maps to a `[data-theme="<id>"]`
 * selector in styles/themes.css. Order here is the order shown in the picker.
 */
export const THEMES: ThemeMeta[] = [
  {
    id: "vision-classic",
    name: "Vision Classic",
    description: "Clean, modern default with calm neutrals.",
    isDark: false,
  },
  {
    id: "academic",
    name: "Academic",
    description: "Formal serif layout for reports and research.",
    isDark: false,
  },
  {
    id: "github-clean",
    name: "GitHub Clean",
    description: "Familiar README readability, slightly refined.",
    isDark: false,
  },
  {
    id: "interview-notes",
    name: "Interview Notes",
    description: "Highlighted sections for explainer documents.",
    isDark: false,
  },
  {
    id: "dark-focus",
    name: "Dark Focus",
    description: "Comfortable low-glare dark reading theme.",
    isDark: true,
  },
];

export const DEFAULT_THEME: ThemeId = "dark-focus";

/** Look up theme metadata, falling back to the default if unknown. */
export function getTheme(id: string | null | undefined): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Type guard for a known theme id (used to validate persisted values). */
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEMES.some((t) => t.id === value);
}
