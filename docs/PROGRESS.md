# VisionMD — Build Progress & Handoff

> **Purpose:** This file lets a *fresh chat* resume the phased build of VisionMD
> without re-investigating the environment or re-deriving conventions. Read this
> first, then continue from the next pending phase. **Update the phase table and
> "Last completed" line at the end of every phase.**

**Last completed:** Phase 13 (Editing: live editor + save) — ✅ verified
**Next up:** — (all planned phases complete)

---

## 1. Project facts

- **Location:** `E:\Learning\AI Learning\visionmd` (parent `E:\Learning\AI Learning` also holds `claude_architect_study_guide.pdf` — leave it alone).
- **Stack:** Tauri 2 + React 19 + TypeScript 5.8 + Vite 7. Package manager: npm.
- **Dev URL:** http://localhost:1420 (Vite, `strictPort`).
- **Frontend runs in a plain browser via `npm run dev`** — only the final native packaging needs Rust. Verify UI work in the browser preview; it mirrors the desktop app.
- **Preview launch config:** `E:\Learning\AI Learning\.claude\launch.json` (server name `visionmd`).

## 2. Environment (already resolved — do NOT re-install)

- **Node** v25.8.0, **npm** 11.11.0 — present.
- **Rust** 1.96.0 via rustup at `C:\Users\joela\.cargo\bin` (not always on PATH; prepend it in PowerShell: `$env:Path = "C:\Users\joela\.cargo\bin;" + $env:Path`).
- **MSVC** VS 2022 Build Tools + Windows SDK — installed. `cargo check` on `src-tauri` passes (exit 0).
- ⚠️ **Gotcha:** In the **Bash** tool, Git's `/usr/bin/link.exe` shadows the MSVC linker — Rust compiles fail there. **Run all `cargo`/`tauri` commands from the PowerShell tool**, where MSVC auto-detection works.
- WebView2 runtime present.

## 3. Conventions (match these)

- **Styling:** CSS Modules (`*.module.css`) for components; plain CSS for `src/styles/{global,themes,markdown}.css`. All colors come from **CSS variable design tokens** (defined in `global.css`, overridden per theme in `themes.css`). No hardcoded hex in components.
- **Themes:** applied via `<html data-theme="...">`. 5 themes already have token blocks in `themes.css`. Registry: `src/features/theme/themes.ts`.
- **Types:** central in `src/types/index.ts`. Keep file/markdown logic framework-agnostic and testable.
- **File access:** always go through `src/features/files/fileService.ts` (runtime-detects Tauri vs browser). Result type is the explicit `OpenResult` union.
- **Security/privacy:** never log file contents; never write to the user's `.md`; sanitize rendered HTML; no telemetry/network for local viewing.
- **Components:** small, single-purpose. `AppShell` does layout; `App.tsx` holds state.
- Run `npx tsc --noEmit` after each phase (must be exit 0). Verify visually in the browser preview.

## 4. Phase status

| Phase | Title | Status |
|------:|-------|--------|
| 0 | Environment & plan | ✅ done |
| 1 | Project setup / app shell | ✅ done |
| 2 | File opening & raw loading | ✅ done |
| 3 | Markdown rendering | ✅ done |
| 4 | Viewing modes (doc/raw/split + selector) | ✅ done |
| 5 | Themes (selector + persistence) | ✅ done |
| 6 | Outline + reading stats | ✅ done |
| 7 | Search | ✅ done |
| 8 | Code highlight + callouts + Mermaid | ✅ done |
| 9 | Export (print-to-PDF / HTML) | ✅ done |
| 10 | Recent files + polish + status bar | ✅ done |
| 11 | Testing & hardening | ✅ done |
| 12 | GitHub-ready finalisation (README/docs/license) | ✅ done |
| 13 | Editing (live editor + Save/Save As) | ✅ done |

## 5. Key files (current)

```
src/App.tsx                         state container + file-load orchestration
src/types/index.ts                  core types (ViewMode, ThemeId, MarkdownDocument, OutlineItem, ReadingStats, RecentFile, SUPPORTED_EXTENSIONS)
src/features/theme/themes.ts        THEMES registry, DEFAULT_THEME, getTheme(), isThemeId()
src/features/preferences/usePersistentState.ts  localStorage-backed useState hook + PREF_KEYS
src/components/ThemeSelector.tsx     theme dropdown (Palette trigger + popover list, outside-click/Esc close)
src/features/files/fileService.ts   openFile/loadBrowserFile/loadPath, isTauri(), validation, OpenResult
src/features/files/useFileDrop.ts   browser + Tauri drag-drop hook
src/features/markdown/markdownRenderer.tsx  <MarkdownViewer>: react-markdown + GFM/frontmatter, rehype-raw→sanitize→slug→autolink, safe external links, memoized
src/features/markdown/outline.ts    buildOutline() (github-slugger ids matching rehype-slug) + computeReadingStats()
src/features/search/useSearch.ts    in-doc search via CSS Custom Highlight API (walks <main>, builds Ranges, next/prev + scroll)
src/features/export/exportDocument.ts  buildExportDocument()/exportToHtmlFile()/printDocument() — inlines all stylesheets, downloads or iframe-prints
src/features/files/useRecentFiles.ts  persisted recents list (dedupe by path, cap 8, most-recent first); add/remove/clear; ignores path-less drops
src/components/RecentMenu.tsx        toolbar Recent dropdown (open/remove/clear; hidden when empty; ExportMenu close pattern) (+ .module.css)
src/components/Outline.tsx          sidebar outline nav; click → scrollIntoView heading anchor (+ Outline.module.css)
src/components/SearchBar.tsx        floating find bar (input + count + prev/next/close; Enter/Shift+Enter/Esc) (+ .module.css)
src/components/ExportMenu.tsx        toolbar dropdown (Save as HTML / Print · Save as PDF; outside-click/Esc close) (+ .module.css)
src/styles/export.css                .vmd-export-source off-screen capture render + @media print app rules
.claude/launch.json                 project-local preview config (server "visionmd", port 1420)
src/styles/global.css               design tokens, reset, layout grid, .btn, .app-loading
src/styles/themes.css               5 theme token blocks (incl. --doc-* tokens)
src/styles/markdown.css             .markdown-body document styling (ready for Phase 3)
src/components/                     AppShell, Toolbar, ViewModeSelector, SplitView, Sidebar, StatusBar, EmptyState, RawViewer, ErrorBanner, Logo (+ .module.css)
src-tauri/src/lib.rs                read_text_file command (validates ext, 25MB cap, no content logging)
src-tauri/capabilities/default.json core:default, opener:default, dialog:default
sample-docs/visionmd-demo.md        feature-tour test document
vitest.config.ts                    Vitest config (jsdom, setupFiles, src/**/*.test.{ts,tsx})
src/test/setup.ts                   test shims: in-memory localStorage + Node File() (jsdom/Node-25 quirks)
src/**/*.test.ts                    unit tests (outline, fileService, useRecentFiles, usePersistentState, themes)
index.html                          + pre-paint inline script applying saved/default theme (no dark-mode flash)
```

## 6. Installed dependencies (already present — don't reinstall)

`react-markdown`, `remark-gfm`, `remark-frontmatter`, `rehype-raw`, `rehype-sanitize`,
`rehype-slug`, `rehype-autolink-headings`, `shiki`, `mermaid`, `lucide-react`,
`@tauri-apps/plugin-dialog`. (Removed `@tauri-apps/plugin-fs` — using a custom Rust command.)

## 7. How to verify a phase

```powershell
# typecheck (must be exit 0)
cd "E:\Learning\AI Learning\visionmd"; npx tsc --noEmit
# unit tests (must be green) — Vitest, added in Phase 11
cd "E:\Learning\AI Learning\visionmd"; npm test
```
- Visual check: use the browser preview (server name `visionmd`, port 1420). Load `sample-docs/visionmd-demo.md` (drag-drop or Open).
- Native (optional, slow first build): `cargo`/`tauri` from PowerShell only, with `.cargo\bin` on PATH.

## 8. Phase 3 notes (done)

- `markdownRenderer.tsx` rehype order is **raw → sanitize → slug → autolink** so the
  trusted heading ids/anchors are added *after* sanitization and survive. The
  sanitize schema extends `defaultSchema` to allow `className`/`id` (for current
  styling + future Phase 8 syntax highlighting).
- Frontmatter is split out with a small regex and shown in a `.markdown-frontmatter`
  card; the body (after the block) is what `react-markdown` renders. `remark-frontmatter`
  is also enabled so any stray frontmatter syntax never crashes parsing.
- External links get `target="_blank" rel="noopener noreferrer"` via a custom `a`
  component; `javascript:` URLs are stripped by sanitize.
- `RawViewer.tsx` is intentionally kept (now unused) — it returns in Phase 4 behind
  the view-mode selector.
- **Verified** in browser preview via DOM/computed-style introspection (the screenshot
  capture tool was timing out, but the renderer was fully responsive): XSS `<script>`/
  `onerror`/`javascript:` all neutralized, GFM tables/tasks/strikethrough render, theme
  `--doc-*` tokens applied. `tsc --noEmit` exit 0.

## 9. Phase 4 notes (done)

- `ViewModeSelector.tsx` is a segmented control (Document / Raw / Split) bound to
  `ViewMode`, injected into the Toolbar's right-side `children` **only when a doc is
  loaded**. Uses `aria-pressed` + `role="group"`; labels collapse to icons under 720px.
- `App.tsx` holds `viewMode` state (default `"document"`); a `renderDocument()` helper
  picks `MarkdownViewer` (document), `RawViewer` (raw), or `SplitView` (both) — `RawViewer`
  is back in use as promised in the Phase 3 notes.
- `SplitView.tsx` is a flex row of two equal panes (`flex: 1 1 50%`, `overflow: hidden`);
  each viewer keeps its own internal `height:100%` scroll, so panes only clip + draw the
  divider. Stacks vertically under 640px. **Scroll sync deferred** (not required).
- View mode is **not persisted** — deferred to Phase 5/10 alongside theme persistence.
- **Verified** in browser preview via DOM introspection (screenshot tool still times out,
  same as Phase 3, but renderer is responsive): selector appears only with a doc loaded,
  switching to Raw swaps `article.markdown-body` → full-source `<pre>`, Split shows two
  equal 541px panes (left article + right pre) with the 1px divider. `tsc --noEmit` exit 0,
  no server errors.

## 10. Phase 5 notes (done)

- **Persistence** is a generic `usePersistentState(key, default, validate?)` hook
  (`src/features/preferences/usePersistentState.ts`): reads on mount, writes on change,
  and swallows all storage errors (private mode / quota / non-browser host) so it never
  throws. The optional `validate` type-guard rejects stale/corrupt stored values so a bad
  string can't become invalid state — verified by injecting junk into localStorage and
  confirming it falls back to the default (and rewrites the corrected value). Keys are
  namespaced under `PREF_KEYS` (`visionmd.theme`, `visionmd.viewMode`).
- `App.tsx` now uses the hook for **both** `theme` (guard `isThemeId`) and `viewMode`
  (guard `isViewMode`) — this also closes the Phase 4 view-mode persistence deferral.
  `isThemeId` lives in `themes.ts`; `isViewMode` + the `VIEW_MODES` const live in `types/index.ts`.
- `ThemeSelector.tsx` is a custom dropdown (not a native `<select>`) so each theme shows its
  name + description + a sun/moon light-dark hint. A `.btn`-styled trigger (Palette icon +
  current name + chevron) toggles a popover `ul[role=menu]` of `button[role=menuitemradio]`
  items with an accent check on the active one. Closes on Escape or outside `pointerdown`
  (listener attached only while open). Always shown in the Toolbar (theme is global);
  `ViewModeSelector` remains doc-only. Label/name hide under 720px like the other controls.
- **Verified** in browser preview via DOM/computed-style introspection (screenshot tool
  still times out, same as Phases 3–4): default theme applied + persisted on first load;
  opening the dropdown lists all 5 themes; selecting Dark Focus flips `data-theme`,
  `--bg`/body background, `color-scheme: dark`, and the trigger label, and writes
  `localStorage["visionmd.theme"]`; the choice survives a full reload; invalid stored
  values fall back to defaults. `tsc --noEmit` exit 0. (React state settles a tick after a
  synthetic `.click()`, so read it back in a *separate* eval round-trip, not the same one.)

## 11. Phase 6 notes (done)

- **Outline + stats logic** lives in `src/features/markdown/outline.ts` (framework-agnostic,
  per conventions): `buildOutline(source)` and `computeReadingStats(source)`. Both strip a
  leading frontmatter block first (same regex as the renderer).
- `buildOutline` parses **ATX headings only** (`# … ######`), tracks fenced code blocks
  (``` ``` ``` / `~~~`) so `#` lines inside code are ignored, and reduces each heading to its
  rendered text (`toPlainText`: drops link/image markup, emphasis, inline code, raw HTML, and
  the trailing `## …  ##` closing run). Crucially it slugs ids with the **same `github-slugger`**
  that `rehype-slug` uses (fresh instance per doc, document order → duplicate suffixes match),
  so outline ids === DOM heading ids. Setext headings (`===`/`---` underlines) are **not**
  supported (the demo and typical docs use ATX); revisit if needed.
- `computeReadingStats` counts words as Unicode alphanumeric tokens (`\p{L}\p{N}`, apostrophe/
  hyphen aware) so Markdown punctuation (`#`, `---`, `>`) doesn't inflate the count; `characters`
  excludes whitespace; `readingMinutes = ceil(words/200)` with a 1-min floor (0 for empty).
- `Outline.tsx` renders a `nav[aria-label="Document outline"]` of `<button>`s; click calls
  `document.getElementById(id).scrollIntoView({behavior:"smooth",block:"start"})` (no-op if the
  anchor is absent, e.g. Raw view). Depth drives indentation + `data-level` styling (clamped to 3).
  Headings already have `scroll-margin-top` in `markdown.css`.
- `App.tsx` derives `outline`/`stats` via `useMemo` keyed on `doc`, passes the `Outline` as
  `Sidebar` children (**pass `undefined`, not `false`**, when empty — `Sidebar` uses
  `children ?? placeholder` and `??` won't fall back on `false`), and feeds `words`/`readingMinutes`
  to the already-prop-ready `StatusBar`.
- **Verified** in the browser preview by simulating a browser file-drop of `sample-docs/visionmd-demo.md`
  (fetch → `File` → `DragEvent('drop')`): outline lists exactly the 9 headings and every id matches a
  rendered `h1–h3` id; frontmatter `title` is **not** treated as a heading; status bar shows
  "286 words / 2 min read"; clicking "Diagram" scrolled `.markdown-scroll` (0 → 1907, capped near
  doc end). `tsc --noEmit` exit 0, no console errors.

## 12. Phase 7 notes (done)

- **Highlighting is non-destructive** — uses the **CSS Custom Highlight API** (`CSS.highlights` +
  `Highlight`/`Range`, styled in `global.css` via `::highlight(vmd-search)` /
  `::highlight(vmd-search-active)`). This was chosen over injecting `<mark>` wrappers, which would
  fight react-markdown's virtual DOM and break on re-render. WebView2/Chromium support it;
  `useSearch` feature-detects and degrades to "Unavailable" otherwise.
- **`useSearch(rootRef, {query, enabled, contentKey})`** (`src/features/search/useSearch.ts`) walks
  every visible text node under the searched element (skips `<script>`/`<style>`), concatenates them
  with an offset map, `indexOf`-scans case-insensitively, and binary-searches the map to build a
  `Range` per match (so matches that **span inline tags** like `**bold**` boundaries still work).
  Inactive matches go in one highlight; the active one in a second highlight with `priority = 1` so
  it paints on top. Returns `{ total, current (1-based), goNext, goPrev, supported }`; nav wraps.
- **Searches whatever is rendered** (Document / Raw / Split) — the hook reads `<main>` via a
  `mainRef` (new optional prop on `AppShell`). `contentKey = "${name}:${size}:${viewMode}"` forces a
  re-walk after React commits a new doc or view. Active match is scrolled into view with
  `scrollIntoView({block:"center"})` on the match's parent element.
- **App wiring:** `searchOpen` + `searchQuery` state; a toolbar Search button (doc-only, goes
  `btn-primary` when active) and a window `Ctrl/Cmd+F` handler (preventing the native browser find)
  both open the bar. `SearchBar` is an absolutely-positioned floating panel inside `app-main`
  (already `position: relative`); Enter = next, Shift+Enter = prev, Esc = close. Highlight colors are
  theme tokens (`--search-hl` translucent yellow; active = `--accent`/`--accent-contrast`).
- **Verified** in the browser preview via DOM/`CSS.highlights` introspection (screenshot tool still
  times out, same as Phases 3–6): "VisionMD" → `1/11` with 11 highlighted ranges + 1 active; next/prev
  cycle and wrap (`1/11` → prev → `11/11`) and scroll the match into view; switching to Raw re-walked
  to 12 matches; emptying the query and closing both clear all highlights. `tsc --noEmit` exit 0, no
  console warnings/errors.

## 13. Phase 8 notes (done)

All three features live in `src/features/markdown/markdownRenderer.tsx` (+ styling in
`src/styles/markdown.css`). The `code`/`pre` flow was restructured: `pre` is overridden to a
**passthrough fragment** so the code renderer owns block layout, and a single `code` component
dispatches: inline (no `language-*` class **and** no newline) → plain `<code>`; ` ```mermaid ` →
`<Mermaid>`; everything else → `<CodeBlock>` (lang defaults to `"text"`).

- **Syntax highlighting (Shiki):** `CodeBlock` calls `codeToHtml` (full bundle, lazy-loads grammars)
  in an effect and injects the HTML via `dangerouslySetInnerHTML`. Shiki escapes the source, so this
  is safe even though it's post-sanitize. Uses **dual themes** (`github-light` + `github-dark`) with
  `defaultColor: false`, so tokens carry `--shiki-light`/`--shiki-dark` CSS vars and **CSS picks
  which** — base rules paint light; `[data-theme="dark-focus"]` overrides to dark (the only dark
  theme). Unknown languages fall back to `lang:"text"` (caught) rather than throwing; a plain
  `.code-fallback <pre>` shows pre-highlight/while-loading. Inner `<code>` reuses the existing
  `.markdown-body pre code` padding/scroll rules.
- **Callouts:** a tiny custom **rehype plugin** (`rehypeCallouts`) runs **after sanitize** (so the
  injected title node + classes are trusted). It walks blockquotes, matches `^\[!(\w+)\]` on the
  first paragraph's first text node, accepts only the 5 known types, strips the marker (drops the
  now-empty text node), tags the `<blockquote>` `callout callout-<type>`, and prepends a
  `.callout-title` div (custom inline title after the marker is honored, else the type label).
  Per-type color is a `--callout-color` token; the title icon is a CSS `mask` from an inline-SVG
  data URI per type (note=info, tip=lightbulb, important=message, warning=triangle, caution=octagon).
- **Mermaid:** `<Mermaid>` re-renders on theme change via a `MarkdownThemeContext` (provides
  `isDark`, threaded from `App` → `MarkdownViewer isDark={getTheme(theme).isDark}`; context updates
  reach the consumer even though `rendered` is memoized on `[body]`). Each render re-`initialize`s
  with `securityLevel:"strict"` and `theme: isDark ? "dark" : "default"`, then `mermaid.render()`;
  SVG injected via `dangerouslySetInnerHTML`. Failures show a `.mermaid-error` card with the raw
  source instead of crashing.
- **Verified** in the browser preview (simulated file-drop of the demo, then DOM/computed-style
  introspection — screenshots also worked this phase): 5 callouts correctly typed with markers
  stripped + icons masked; 2 Shiki blocks (python/ts) carrying `--shiki-*` token vars, 0 fallbacks;
  1 Mermaid SVG, no errors. Switching Dark Focus ⇄ Vision Classic flips Shiki token color
  (`#f97583`/`#24292e` bg ⇄ `#d73a49`/white bg) **and** reactively re-renders the Mermaid diagram to
  the matching theme. `tsc --noEmit` exit 0, no console warnings/errors.

## 14. Phase 9 notes (done)

- **One builder, two outputs.** `src/features/export/exportDocument.ts` `buildExportDocument()` assembles
  a single standalone HTML string; `exportToHtmlFile()` downloads it (Blob + anchor) and `printDocument()`
  writes it into a hidden `<iframe srcdoc>` and calls `contentWindow.print()` (user picks "Save as PDF").
  Printing the iframe — not the app window — keeps output free of app chrome and independent of view mode.
- **Faithful + offline by construction.** The export content is the *live-rendered* `.markdown-scroll`
  `outerHTML`, so Shiki highlighting and Mermaid SVGs are already baked in. `collectStyles()` inlines every
  accessible stylesheet (`document.styleSheets` → `cssRules`, try/catch skips cross-origin) into one
  `<style>`, and the export `<html data-theme="…">` carries the active theme so the `[data-theme]` token
  blocks + Shiki dark override apply. No external assets / network (fonts are system stacks). Appended
  `EXPORT_OVERRIDES` unclamp the fixed-height scroll container and add `@page` margins + `print-color-adjust`.
- **View-mode-independent capture.** `App` mounts a second, off-screen `<MarkdownViewer>` (class
  `.vmd-export-source`, `aria-hidden`, laid out but collapsed via `height:0;overflow:hidden`) whenever a doc
  is loaded, exposed through a new optional `contentRef` prop on `MarkdownViewer` (applied to `.markdown-scroll`).
  Export reads `exportSourceRef.current.outerHTML`, so it works even in Raw mode and always emits the document
  layout. Cost: one extra render per doc — acceptable for a local viewer.
- **UI:** `ExportMenu.tsx` is a Download-icon dropdown (mirrors `ThemeSelector`: outside-click/Esc close),
  rendered in the Toolbar only when a doc is loaded, between Find and the theme selector. `styles/export.css`
  also adds an `@media print` pass so a manual Ctrl+P of the app hides chrome and prints just the document.
- **Verified** in the browser preview via the intercept pattern (override `URL.createObjectURL` +
  `HTMLAnchorElement.click` to capture the Blob instead of saving): clicking "Save as HTML" yields a valid
  ~62 KB `<!doctype html>` with `<body class="vmd-export">`, the active `data-theme`, inlined `.markdown-body`
  CSS + Shiki dark rules, 2 baked Shiki blocks, 1 Mermaid SVG, 5 callouts, frontmatter, and filename
  `visionmd-demo.html`; the menu closes after. `tsc --noEmit` exit 0. (Screenshot tool still times out as in
  Phases 3–7 — verified via DOM/a11y snapshot instead; the HMR "Failed to reload App.tsx" console lines were
  transient mid-edit states, cleared by a full reload that rendered the app cleanly.)

## 15. Phase 10 notes (done)

- **Recents are path-keyed and Tauri-reopenable.** `src/features/files/useRecentFiles.ts` wraps
  `usePersistentState<RecentFile[]>` (new `PREF_KEYS.recentFiles = "visionmd.recentFiles"`, validated by
  `isRecentFileList`). `add({path,name})` **no-ops when `path` is empty** — browser-dropped files have no
  path and can't be reopened, so they're never recorded; entries are deduped by path, stamped `lastOpened`,
  unshifted to the front, and capped at `MAX_RECENT_FILES` (8). `remove(path)` / `clear()` round it out.
- **Wiring (`App.tsx`):** `applyResult`'s `"ok"` case calls `recent.add(...)` (deps now `[recent]`).
  `handleOpenRecent(path)` runs `loadPath(path)` through the existing `runLoader`, and **auto-prunes** the
  entry on `error`/`unsupported` so a moved/deleted file doesn't linger as a dead row.
- **Two surfaces, same handlers.** `EmptyState` gained an optional Recent-files section (open / per-row
  remove / Clear), and a toolbar `RecentMenu` (Clock trigger, hidden when the list is empty) gives the same
  list/open/remove/clear while a doc is open. Long paths are clipped from the left (`direction: rtl`) so the
  filename end stays visible.
- **Status-bar polish:** added a file-size item (`fileSize={doc.size}` → `formatBytes`, shown only when > 0,
  Database icon) between the filename and word count.
- **Verified** in the browser preview by seeding `localStorage["visionmd.recentFiles"]` with 3 entries +
  reload: both surfaces render the list; removing a row updates the UI **and** localStorage and survives a
  reload; clicking a recent in the **browser** correctly degrades — `loadPath` can't reach Tauri `invoke`, so
  it shows an error banner and prunes that dead entry (in Tauri the invoke succeeds and the doc loads); the
  toolbar dropdown reflects the pruned state and the Clear footer empties it. `tsc --noEmit` exit 0, no
  console errors. (Screenshots worked this phase.)

## 16. Phase 11 notes (done)

- **Test runner: Vitest** (`vitest.config.ts`, kept separate from `vite.config.ts` so the Tauri dev-server
  options don't bleed into the run). Environment `jsdom`; `include: src/**/*.test.{ts,tsx}` (tests are
  co-located next to source). Scripts: `npm test` (`vitest run`) and `npm run test:watch`. Added devDeps:
  `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@types/node`. **52 tests, all green.**
- **Host-quirk shims** in `src/test/setup.ts` (wired via `setupFiles`) — needed because the test host is not a
  real browser: (1) **Node 25 injects an experimental global Web Storage** that shadows jsdom's `localStorage`
  and is non-functional (no backing file, no working `clear`), so we install a small in-memory `MemoryStorage`
  on `window`; (2) **jsdom's `File`/`Blob` don't implement `.text()`** (which `loadBrowserFile` relies on), so
  we swap in Node's spec-compliant `File`. Without these, the persistence/file tests can't exercise the real
  code paths the WebView2 runtime uses.
- **Coverage:** `outline.test.ts` (ATX parsing, fenced-code & frontmatter exclusion, inline-markup stripping,
  slug dedupe, empty/closing-ATX headings, **malformed unterminated fence**, **~250k-word doc**);
  `fileService.test.ts` (`getExtension`/`isSupportedExtension`/`baseName`/`isTauri`, `loadBrowserFile`
  ok/unsupported/read-error/**empty file**, `loadPath` unsupported + non-Tauri error degradation);
  `useRecentFiles.test.ts` (**dedupe + cap-at-8 + most-recent-first**, path-less drops ignored, remove/clear,
  persistence, corrupt-value recovery); `usePersistentState.test.ts` (default/read/write, validate-guard and
  corrupt-JSON fallback, **storage-disabled read & over-quota write don't throw**); `themes.test.ts` (locks in
  the dark default + guards). Hooks tested with `@testing-library/react`'s `renderHook`/`act`.
- **`tsc --noEmit` exit 0** — test files live under `src/` so they're typechecked too (this is why `@types/node`
  was added: `src/test/setup.ts` imports `node:buffer`). `vite.config.ts`/`vitest.config.ts` are outside the
  tsconfig `include`, so the existing `@ts-expect-error` on `process` there is unaffected.

## 17. Dark mode is now the default

- `DEFAULT_THEME` in `src/features/theme/themes.ts` changed `vision-classic` → **`dark-focus`** (looks better).
- **No-flash:** an inline `<script>` in `index.html` applies the saved-or-default theme to `<html data-theme>`
  *before first paint* (the base `:root` tokens in `global.css` are light, so without this dark-default users
  would see a light flash). It JSON-parses `localStorage["visionmd.theme"]`, validates against the known id
  allowlist, and falls back to `dark-focus`; the allowlist + key must stay in sync with `themes.ts` /
  `usePersistentState.ts`. `App.tsx` still owns the runtime theme via `usePersistentState`.
- **Verified** in the browser preview: cleared the persisted theme + reloaded → `data-theme="dark-focus"`,
  `body` background `rgb(21,23,28)`, `color-scheme: dark`, and React re-persisted `"dark-focus"`. No console
  errors. (Screenshot tool still times out as in earlier phases — verified via DOM/computed-style instead.)

## 18. Phase 12 notes (done) — GitHub-ready finalisation

- **README rewritten** from the Tauri template stub into a full, presentable doc: hero screenshot + badges,
  "What is VisionMD?" intro, a features table, a 7-image screenshot gallery, getting-started (browser +
  native Tauri build), a detailed **user guide** (opening files, view modes, outline, search, themes,
  export, reading stats, keyboard shortcuts), tech-stack/architecture + project-structure tree, dev scripts,
  and a privacy/security section. License section links to the new `LICENSE`.
- **LICENSE added** — MIT (`Copyright (c) 2026 Joel Alfred`; edit the holder name if desired).
- **Screenshots** live in `docs/screenshots/` (`01-empty-state`, `02-document-dark`, `03-document-light`,
  `04-document-academic`, `05-split-view`, `06-search`, `07-code-mermaid`), 40–78 KB PNGs at 2× DPR, 1280×820.
  The built-in preview **screenshot MCP tool times out on this machine** (consistent with Phases 3–9), so they
  were captured with a throwaway **puppeteer-core** script driving the installed Chrome
  (`C:\Program Files\Google\Chrome\Application\chrome.exe`) against the running `npm run dev` server. The
  script set the theme via `localStorage`, simulated a browser file-drop of `sample-docs/visionmd-demo.md`,
  and screenshotted each scenario. The temp tooling was installed outside the repo (`~/.vmd-shots-tmp`) and
  **deleted afterwards**, so `package.json`/`package-lock.json` are untouched. To re-shoot: `npm run dev`, then
  drive Chrome headlessly the same way.
- **Acceptance met:** `npx tsc --noEmit` exit 0; `npm test` 52/52 green; app renders cleanly with no console
  errors. Only docs/license/screenshots changed — no source code touched.

## 19. Post-Phase-12: file associations / default Markdown reader

Added so VisionMD can be set as the OS default `.md` handler **and actually opens the
double-clicked file** (previously launching with a file arg just showed the welcome screen).

- **`tauri.conf.json`:** added `bundle.fileAssociations` for `md`/`markdown`/`mdown`/`mkd`
  (role `Viewer`), so the MSI/NSIS installer registers VisionMD as a Markdown handler and it
  appears in Windows "Open with". Also polished: `productName` `visionmd` → `VisionMD`, window
  title → `VisionMD`, default size 800×600 → 1180×800 with min 640×480.
- **`src-tauri/Cargo.toml`:** added `tauri-plugin-single-instance` (desktop-only target dep).
- **`src-tauri/src/lib.rs`:** `is_supported()` + `markdown_arg()` helpers; new `get_launch_file`
  command returns the first supported-extension CLI arg (the OS passes the path on launch).
  Single-instance plugin registered **first** (`#[cfg(desktop)]`): a second launch focuses the
  existing `main` window and emits an `open-file` event with the new path instead of spawning a
  duplicate window.
- **`src/features/files/useLaunchFile.ts`:** new hook (no-op outside Tauri) — on mount invokes
  `get_launch_file` and loads it, and `listen`s for `open-file`. Wired in `App.tsx` by passing
  the existing stable `handleDropPath` (`runLoader(() => loadPath(path))`); reuses all existing
  load/error plumbing.
- **README:** added "Install it & run from an icon" and "Make VisionMD your default Markdown
  reader (Windows)" sections.
- **Verified:** `npx tsc --noEmit` exit 0; `cargo check` exit 0 (single-instance resolved);
  `npm test` 52/52 green; browser preview still renders with no console errors (the hook is a
  Tauri-only no-op). Full `npm run tauri build` to produce the installers is the final step
  (slow first release compile + MSI/NSIS tooling download).
- **Bugfix:** the first cut of `useLaunchFile` keyed its effect on `onPath`, whose identity
  changes every render (it depends on recents state), so loading the launch file → state change
  → new `onPath` → effect re-ran → reloaded → continuous "Opening document…" flicker. Fixed by
  reading `onPath` through a ref and using an empty dep array (fetch launch file + attach the
  `open-file` listener exactly once on mount).

## 20. Phase 13: Editing — live editor + Save / Save As

VisionMD is now a viewer **and** editor (was deliberately read-only through Phase 12). The
read-only framing in the README/privacy text was updated to "only writes when you save".

- **New `edit` view mode** (`types/index.ts` `VIEW_MODES` gains `"edit"`; `ViewModeSelector`
  gains a Pencil-icon segment). `MarkdownEditor.tsx` = a `SplitView` with an editable
  `<textarea>` (source) on the left and a live `<MarkdownViewer>` on the right.
- **State model (`App.tsx`):** added `content` state = current editable source; `doc.content`
  is the last-saved baseline. `isDirty = doc && content !== doc.content`. All views, outline,
  reading stats, search `contentKey`, and the off-screen export source now render `content`
  (not `doc.content`), so everything stays live while editing. On load, `applyResult` sets both
  `doc` and `content`.
- **Saving:** Rust `write_text_file(path, content)` (validates ext + 25 MB cap, mirrors the read
  command) added to the invoke handler. `fileService` gains `saveToPath` (Tauri write; browser →
  download), `saveContentAs` (Tauri Save dialog via `@tauri-apps/plugin-dialog` `save` → write;
  browser → download), and `confirmDiscardChanges` (dialog `ask` in Tauri, `window.confirm` in
  browser). `App` has `commitSave(snapshot, result)` → makes the saved text the new baseline and
  adopts any new path/name (Save As) + adds to recents. `Ctrl/Cmd+S` = Save, `Ctrl/Cmd+Shift+S`
  = Save As. `SaveMenu.tsx` = split button (one-click Save + chevron → "Save As…") with a dirty
  dot; goes `btn-primary` when dirty.
- **Safety:** `runLoader` calls `confirmDiscardChanges()` before replacing a dirty doc (covers
  open/recent/drop/launch); a `beforeunload` guard warns on browser tab close/reload when dirty.
  StatusBar shows **"Unsaved changes"** (amber, Pencil) vs **"Saved"** (green, Check).
- **Capabilities:** added `dialog:allow-save` + `dialog:allow-ask` to `capabilities/default.json`.
- **Verified:** `tsc` exit 0; `cargo check` exit 0; `npm test` 52/52 green. Browser preview
  exercised live: dropped the demo, switched to Edit, typed → preview + outline + word count
  updated and the status bar flipped to "Unsaved changes"; no console errors. Rebuilt the
  release installers (MSI 5.5 MB / NSIS 4.5 MB / exe 12 MB). Added `docs/screenshots/08-edit-mode.png`
  to the README gallery.
- **Note / possible follow-up:** outline + stats recompute on every keystroke (keyed on
  `content`). Fine for typical docs; debounce if a very large file feels laggy while typing.
