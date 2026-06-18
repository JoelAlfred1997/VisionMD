<div align="center">

# 👁️ VisionMD

### Markdown for machines. Beautiful documents for humans.

VisionMD is a fast, private **Markdown viewer & editor** that turns plain `.md`
files into calm, polished, document-style reading — and lets you edit the source
with a live preview and save when *you* choose. **It only ever touches your file when
you explicitly save.**

[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![VisionMD rendering a document in the Dark Focus theme](docs/screenshots/02-document-dark.png)

</div>

---

## What is VisionMD?

Markdown is great to *write*, but raw `.md` files are not pleasant to *read* — and
most editors show you a cramped, editor-flavoured preview. VisionMD makes a Markdown
file look like a finished document, and when you want to change it, drops you into a
live split editor.

You point it at a file and get a clean reading layout with a navigable outline,
syntax-highlighted code, rendered diagrams, callouts, full-document search, multiple
themes, and one-click export to PDF or HTML. Switch to **Edit** mode to change the
source with a live preview, then **Ctrl+S** to save. VisionMD never writes to your
file on its own — only when you save.

It runs as a lightweight native desktop app (via [Tauri](https://tauri.app)) and the
exact same UI also runs in any browser during development.

### Why you might want it

- 📖 **Read or edit.** A distraction-free reading surface for notes, READMEs, research,
  and lecture notes — with a live editor a click away when you need to make changes.
- 🔒 **Completely private.** No network, no telemetry, no accounts. Files stay on your
  machine, and nothing is written unless you save.
- 🎨 **Looks the way you want.** Five hand-tuned themes, from a calm light default to a
  low-glare dark mode and a formal academic serif.
- 🪶 **Tiny and fast.** A Tauri shell (system WebView, no bundled Chromium) means a small
  binary and quick startup.

---

## ✨ Features

| | Feature | Details |
|---|---|---|
| 📄 | **Document / Raw / Split views** | Read the polished render, inspect the source, or see both side-by-side. |
| ✏️ | **Live editor** | An **Edit** mode with the Markdown source on the left and a live preview on the right. |
| 💾 | **Save & Save As** | Edit and save back to your file with `Ctrl+S` (or `Ctrl+Shift+S` for a new file). An unsaved-changes indicator and a discard prompt keep your edits safe. |
| 🎨 | **5 themes** | Vision Classic, Academic, GitHub Clean, Interview Notes, and Dark Focus (default). Switch instantly; your choice is remembered. |
| 🧭 | **Outline sidebar** | Auto-generated from headings — click to jump to any section. |
| 🔍 | **In-document search** | `Ctrl/Cmd+F` highlights every match with next/previous navigation and a live count. |
| 🌈 | **Syntax highlighting** | Powered by [Shiki](https://shiki.style) with light/dark token sets that follow your theme. |
| 📊 | **Mermaid diagrams** | Flowcharts and diagrams render live and re-theme with the app. |
| 💬 | **GitHub callouts** | `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` render as styled admonitions. |
| 📑 | **GFM support** | Tables, task lists, strikethrough, autolinks, and frontmatter. |
| 🖨️ | **Export** | Save a faithful, self-contained **HTML** file or **Print → Save as PDF**, with all styling and diagrams baked in. |
| 🕘 | **Recent files** | Quick access to recently opened documents (native app). |
| 📊 | **Reading stats** | Word count, file size, and estimated reading time in the status bar. |
| 🛡️ | **Safe by design** | Rendered HTML is sanitized, scripts are never executed, and external links open with `noopener`. |
| 🖱️ | **Drag & drop** | Drop a `.md` file anywhere in the window to open it. |

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><strong>Welcome / empty state</strong><br/><img src="docs/screenshots/01-empty-state.png" alt="VisionMD welcome screen"/></td>
    <td width="50%"><strong>Document view — Dark Focus</strong><br/><img src="docs/screenshots/02-document-dark.png" alt="Document view in the Dark Focus theme"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Document view — Vision Classic (light)</strong><br/><img src="docs/screenshots/03-document-light.png" alt="Document view in the Vision Classic light theme"/></td>
    <td width="50%"><strong>Academic theme</strong><br/><img src="docs/screenshots/04-document-academic.png" alt="Document view in the Academic theme"/></td>
  </tr>
  <tr>
    <td width="50%"><strong>Split view (render + source)</strong><br/><img src="docs/screenshots/05-split-view.png" alt="Split view showing rendered document and raw source"/></td>
    <td width="50%"><strong>Find in document</strong><br/><img src="docs/screenshots/06-search.png" alt="In-document search with highlighted matches"/></td>
  </tr>
  <tr>
    <td colspan="2"><strong>Live editor — source + live preview</strong><br/><img src="docs/screenshots/08-edit-mode.png" alt="Edit mode: editable Markdown source on the left, live preview on the right, with an unsaved-changes indicator"/></td>
  </tr>
  <tr>
    <td colspan="2"><strong>Syntax highlighting &amp; tables</strong><br/><img src="docs/screenshots/07-code-mermaid.png" alt="Syntax-highlighted code blocks and a styled table"/></td>
  </tr>
</table>

---

## 🚀 Getting started

### Prerequisites

- **[Node.js](https://nodejs.org) 18+** and **npm** (for the web UI).
- To build the **native desktop app**, you also need the
  [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS:
  - **Windows:** Microsoft Visual Studio C++ Build Tools + WebView2 (preinstalled on Windows 11).
  - **macOS:** Xcode Command Line Tools.
  - **Linux:** `webkit2gtk` and related packages.
  - **Rust** (stable) via [rustup](https://rustup.rs) on all platforms.

### Install

```bash
git clone https://github.com/JoelAlfred1997/VisionMD.git
cd VisionMD
npm install
```

### Run in the browser (fastest)

The entire UI runs in a normal browser — handy for development and a quick look.

```bash
npm run dev
```

Then open **http://localhost:1420** and drag a `.md` file onto the window.

> In the browser, the native **Open** dialog and **Recent files** reopening aren't
> available (they need the desktop shell), but drag-and-drop works and everything else
> renders identically.

### Run as the native desktop app

```bash
npm run tauri dev
```

This launches the real VisionMD window with full file-system access (native Open
dialog, recent-file reopening, etc.).

### Build a release binary

```bash
npm run tauri build
```

This produces a standalone executable and installers in
`src-tauri/target/release/`:

- **`VisionMD.exe`** — the standalone app (in `target/release/`).
- **`bundle/msi/VisionMD_0.1.0_x64_en-US.msi`** — Windows MSI installer.
- **`bundle/nsis/VisionMD_0.1.0_x64-setup.exe`** — Windows NSIS installer.

(On macOS you get a `.app` / `.dmg`; on Linux an `.AppImage` / `.deb`.)

### Install it & run from an icon

1. Run `npm run tauri build`.
2. Double-click the installer in `src-tauri/target/release/bundle/` (MSI or NSIS).
   It installs VisionMD and adds a **Start-menu / desktop shortcut** you can click
   to launch it like any other app. (Right-click the shortcut → *Pin to Start* or
   *Pin to taskbar* if you like.)

> Prefer not to install? Just run `src-tauri/target/release/VisionMD.exe` directly,
> or make a shortcut to it. The file association below, however, needs the installer.

### Make VisionMD your default Markdown reader (Windows)

VisionMD registers itself as a handler for `.md`, `.markdown`, `.mdown`, and `.mkd`
files, and **opens the file you double-click** (it's a true file-association handler,
not just an app that launches blank). To set it as the default:

1. Install VisionMD with the MSI or NSIS installer (this registers the associations).
2. Right-click any `.md` file → **Open with → Choose another app**.
3. Pick **VisionMD**, tick **“Always use this app to open .md files”**, and click OK.

Now double-clicking any Markdown file opens it straight in VisionMD. If the app is
already open, the file loads in the existing window instead of starting a new one.

> To set the default per-extension in bulk: **Settings → Apps → Default apps →
> Choose defaults by file type**, then assign VisionMD to each Markdown extension.

---

## 📖 User guide

### 1. Opening a document

There are three ways to open a Markdown file:

- **Drag & drop** — drop a `.md` file anywhere on the window.
- **Open button** — click **Open** in the toolbar (native app) to pick a file.
- **Recent files** — click the 🕘 clock menu in the toolbar, or pick from the welcome
  screen, to reopen a recent document (native app).

Supported extensions: `.md`, `.markdown`, `.mdown`, `.mkd`.

> 🔒 VisionMD opens files for reading and never writes to your `.md` on its own. The
> status bar shows **“Saved”** until you make an edit, then **“Unsaved changes”** until
> you save.

### 2. View modes

When a document is open, a segmented control appears in the toolbar:

| Mode | What it shows |
|------|----------------|
| **Document** | The fully rendered, styled reading view. |
| **Raw** | The exact Markdown source (read-only). |
| **Split** | Rendered view and source side-by-side. |
| **Edit** | An editable source pane with a **live preview** beside it. |

Your last-used view mode is remembered between sessions.

### 3. Editing & saving

Switch to **Edit** mode to change the document. The left pane is an editable text area
for the Markdown source; the right pane is a live preview that updates as you type. The
outline and word count update live too.

- **Save** — click **Save** in the toolbar or press **`Ctrl+S`** (`Cmd+S` on macOS) to
  write your changes back to the open file.
- **Save As…** — use the chevron next to Save, or **`Ctrl+Shift+S`**, to write to a new
  file (a Save dialog lets you choose where).
- A **dot on the Save button** and an **“Unsaved changes”** indicator in the status bar
  show when you have edits that aren't saved yet.
- If you try to open another file (or close the window) with unsaved changes, VisionMD
  **asks before discarding** them.

> In the browser build there's no file system to write to, so **Save downloads** the
> `.md` instead. In the desktop app it writes straight to disk.

### 4. The outline

The left sidebar shows an **outline** built from the document's headings. Click any
entry to smoothly scroll to that section. Toggle the sidebar with the panel button in
the top-left of the toolbar.

### 5. Searching

Press **`Ctrl+F`** (or **`Cmd+F`** on macOS), or click the 🔍 search button, to open the
find bar. As you type, every match is highlighted and the active match is emphasised.

- **Enter** / **↓** — next match
- **Shift+Enter** / **↑** — previous match
- **Esc** — close the find bar

Search works in whichever view is active (Document, Raw, or Split) and the counter shows
your position, e.g. `3 / 11`.

### 6. Themes

Click the 🎨 palette menu in the toolbar to switch themes. Your choice is saved and
re-applied on next launch (with no flash of the wrong theme on startup).

| Theme | Mood | Best for |
|-------|------|----------|
| **Vision Classic** | Calm & modern | Everyday reading |
| **Academic** | Formal serif | Reports & research |
| **GitHub Clean** | Familiar | READMEs |
| **Interview Notes** | Highlighted sections | Explainer docs |
| **Dark Focus** *(default)* | Low-glare dark | Night reading |

### 7. Exporting

Click the ⬇️ **Export** menu in the toolbar:

- **Save as HTML** — downloads a single, self-contained `.html` file. All styles, syntax
  highlighting, and Mermaid diagrams are inlined, so it looks identical and works offline
  with no external assets.
- **Print · Save as PDF** — opens your system print dialog; choose “Save as PDF” to get a
  clean, app-chrome-free PDF.

Exports always reflect the **full document** (including any unsaved edits) in the current
theme, regardless of which view mode you're in.

### 8. Reading stats

The status bar along the bottom shows the file name, file size, **word count**, and an
estimated **reading time** (~200 words/minute), plus the active theme.

### ⌨️ Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save to the current file |
| `Ctrl/Cmd + Shift + S` | Save As… (new file) |
| `Ctrl/Cmd + F` | Open the find bar |
| `Enter` / `↓` | Next search match |
| `Shift+Enter` / `↑` | Previous search match |
| `Esc` | Close the find bar |

---

## 🧱 Tech stack & architecture

- **[Tauri 2](https://tauri.app)** — native desktop shell using the system WebView (no
  bundled browser → small binary). The Rust side exposes hardened `read_text_file` /
  `write_text_file` commands that validate the extension, cap file size, and never log
  file contents, plus single-instance + file-association handling so VisionMD can be the
  default `.md` app.
- **[React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)** — UI.
- **[Vite 7](https://vitejs.dev)** — dev server & bundler (dev URL `http://localhost:1420`).
- **[react-markdown](https://github.com/remarkjs/react-markdown)** with `remark-gfm`,
  `remark-frontmatter`, and a rehype pipeline (`raw → sanitize → slug → autolink`) so
  trusted heading anchors survive sanitization while untrusted HTML is neutralised.
- **[Shiki](https://shiki.style)** — syntax highlighting with dual light/dark themes
  driven by CSS variables.
- **[Mermaid](https://mermaid.js.org)** — diagrams, re-rendered on theme change with
  `securityLevel: "strict"`.
- **[Vitest](https://vitest.dev)** + Testing Library — unit tests.

**Conventions:** styling uses CSS Modules per component and CSS-variable design tokens
(no hardcoded colours); themes are applied via `<html data-theme="…">`; file access is
centralised in a service that runtime-detects Tauri vs. browser; core Markdown/file logic
is framework-agnostic and unit-tested.

### Project structure

```
visionmd/
├─ src/
│  ├─ App.tsx                 # State container + file-load orchestration
│  ├─ components/             # AppShell, Toolbar, Sidebar, StatusBar, SearchBar, menus…
│  ├─ features/
│  │  ├─ files/               # fileService (Tauri/browser), drag-drop, recent files
│  │  ├─ markdown/            # renderer, outline + reading-stats logic
│  │  ├─ search/              # CSS Custom Highlight API search hook
│  │  ├─ theme/               # theme registry
│  │  ├─ export/              # HTML/PDF export builder
│  │  └─ preferences/         # localStorage-backed persistence
│  ├─ styles/                 # global tokens, themes, markdown, export CSS
│  └─ types/                  # shared types
├─ src-tauri/                 # Rust shell (read/write commands, file associations, capabilities)
├─ sample-docs/               # visionmd-demo.md feature-tour document
├─ docs/                      # progress notes + screenshots
└─ public/
```

---

## 🧪 Development

```bash
npm run dev          # Vite dev server (browser) at http://localhost:1420
npm run tauri dev    # Native desktop app (hot-reloads the same UI)
npm run build        # Type-check (tsc) + production web build
npm test             # Run the Vitest unit suite once
npm run test:watch   # Vitest in watch mode
npm run tauri build  # Build a native release bundle
```

There's a feature-tour document at [`sample-docs/visionmd-demo.md`](sample-docs/visionmd-demo.md)
that exercises every renderer feature — drop it into the app to see everything at once.

---

## 🔐 Privacy & security

VisionMD is built to be safe with files you didn't write:

- **No network & no telemetry.** Nothing is uploaded, tracked, or phoned home.
- **Writes only when you save.** VisionMD never modifies your `.md` on its own — the only
  writes happen when you explicitly Save / Save As, and it warns before discarding edits.
- **Sanitized rendering.** Embedded HTML is sanitized; `<script>`, inline event handlers,
  and `javascript:` URLs are stripped and never executed.
- **Safe links.** External links open with `target="_blank"` + `rel="noopener noreferrer"`.
- **Hardened file I/O.** The native read/write commands validate the extension, enforce a
  size cap, and never log file contents — so the editor can only ever read or overwrite
  Markdown files.

---

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">
<sub>Built with Tauri, React, and TypeScript.</sub>
</div>
