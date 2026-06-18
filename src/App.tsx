import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "./components/AppShell";
import { Toolbar } from "./components/Toolbar";
import { ViewModeSelector } from "./components/ViewModeSelector";
import { ThemeSelector } from "./components/ThemeSelector";
import { ExportMenu } from "./components/ExportMenu";
import { SaveMenu } from "./components/SaveMenu";
import { RecentMenu } from "./components/RecentMenu";
import { SearchBar } from "./components/SearchBar";
import { Sidebar } from "./components/Sidebar";
import { Outline } from "./components/Outline";
import { StatusBar } from "./components/StatusBar";
import { EmptyState } from "./components/EmptyState";
import { ErrorBanner } from "./components/ErrorBanner";
import { MarkdownViewer } from "./features/markdown/markdownRenderer";
import { buildOutline, computeReadingStats } from "./features/markdown/outline";
import { RawViewer } from "./components/RawViewer";
import { SplitView } from "./components/SplitView";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { DEFAULT_THEME, getTheme, isThemeId } from "./features/theme/themes";
import {
  PREF_KEYS,
  usePersistentState,
} from "./features/preferences/usePersistentState";
import {
  confirmDiscardChanges,
  loadBrowserFile,
  loadPath,
  openFile,
  saveContentAs,
  saveToPath,
  type OpenResult,
  type SaveResult,
} from "./features/files/fileService";
import { useFileDrop } from "./features/files/useFileDrop";
import { useLaunchFile } from "./features/files/useLaunchFile";
import { useRecentFiles } from "./features/files/useRecentFiles";
import { useSearch } from "./features/search/useSearch";
import {
  exportToHtmlFile,
  printDocument,
} from "./features/export/exportDocument";
import { isViewMode, type MarkdownDocument, type ViewMode } from "./types";

export default function App() {
  const [theme, setTheme] = usePersistentState(
    PREF_KEYS.theme,
    DEFAULT_THEME,
    isThemeId
  );
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    PREF_KEYS.viewMode,
    "document",
    isViewMode
  );
  const [doc, setDoc] = useState<MarkdownDocument | null>(null);
  // Current (editable) source. `doc.content` is the last-saved baseline; this
  // is what every view renders and what the editor mutates.
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  // Off-screen, always-rendered document used as the export capture source so
  // export works in any view mode with Shiki/Mermaid output already baked in.
  const exportSourceRef = useRef<HTMLDivElement>(null);
  const recent = useRecentFiles();

  // Unsaved-edits state. The ref lets load actions check it without being
  // re-created when the content changes on every keystroke.
  const isDirty = doc !== null && content !== doc.content;
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  // Apply the active theme to <html> so CSS token overrides take effect.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /** Translate an OpenResult into UI state. */
  const applyResult = useCallback(
    (result: OpenResult) => {
    switch (result.status) {
      case "ok":
        setDoc(result.doc);
        setContent(result.doc.content);
        setError(null);
        // Only path-bearing files (Tauri) can be reopened later; the hook
        // ignores path-less browser drops.
        recent.add({ path: result.doc.path, name: result.doc.name });
        break;
      case "unsupported":
        setError(
          `"${result.name}" isn't a supported Markdown file (.md, .markdown, .mdown, .mkd).`
        );
        break;
      case "error":
        setError(result.message);
        break;
      case "cancelled":
        break;
    }
    },
    [recent]
  );

  /** Run an async loader with a loading state and error fallback. */
  const runLoader = useCallback(
    async (loader: () => Promise<OpenResult>) => {
      // Loading a new document replaces the current one — guard unsaved edits.
      if (dirtyRef.current && !(await confirmDiscardChanges())) return;
      setLoading(true);
      try {
        applyResult(await loader());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open file.");
      } finally {
        setLoading(false);
      }
    },
    [applyResult]
  );

  const handleOpenFile = useCallback(() => runLoader(openFile), [runLoader]);

  // Reopen a recent file by its stored path (Tauri). A path that no longer
  // exists surfaces a normal error banner; drop it from the list so it
  // doesn't linger as a dead entry.
  const handleOpenRecent = useCallback(
    (path: string) =>
      runLoader(async () => {
        const result = await loadPath(path);
        if (result.status === "error" || result.status === "unsupported") {
          recent.remove(path);
        }
        return result;
      }),
    [runLoader, recent]
  );

  // Drag-and-drop wiring (stable callbacks for the listener effects).
  const handleDropFile = useCallback(
    (file: File) => runLoader(() => loadBrowserFile(file)),
    [runLoader]
  );
  const handleDropPath = useCallback(
    (path: string) => runLoader(() => loadPath(path)),
    [runLoader]
  );
  const isDragging = useFileDrop({
    onFile: handleDropFile,
    onPath: handleDropPath,
  });

  // Open the file VisionMD was launched with (file association / "Open with")
  // and any file opened while it is already running. No-op in the browser.
  useLaunchFile(handleDropPath);

  // Outline + reading stats are derived from the current (editable) source so
  // they stay in sync while editing.
  const outline = useMemo(
    () => (doc ? buildOutline(content) : []),
    [doc, content]
  );
  const stats = useMemo(
    () => (doc ? computeReadingStats(content) : null),
    [doc, content]
  );

  // In-document search. The content key forces a re-walk when the document or
  // view mode (Document / Raw / Split) changes the rendered text.
  const search = useSearch(mainRef, {
    query: searchQuery,
    enabled: searchOpen && !!doc,
    contentKey: doc ? `${doc.name}:${content.length}:${viewMode}` : "",
  });

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Ctrl/Cmd+F opens the find bar instead of the browser's native find.
  useEffect(() => {
    if (!doc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc]);

  // Warn before leaving (browser tab close / reload) with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const themeName = getTheme(theme).name;

  const isDark = getTheme(theme).isDark;

  // Export the rendered document. Reads the off-screen capture source so the
  // output is the full document regardless of the current view mode.
  const handleExportHtml = useCallback(() => {
    const el = exportSourceRef.current;
    if (!doc || !el) return;
    exportToHtmlFile({ name: doc.name, theme, contentHtml: el.outerHTML });
  }, [doc, theme]);

  const handlePrint = useCallback(() => {
    const el = exportSourceRef.current;
    if (!doc || !el) return;
    printDocument({ name: doc.name, theme, contentHtml: el.outerHTML });
  }, [doc, theme]);

  // Commit a save result: on success make the saved text the new baseline (so
  // the dirty flag clears) and adopt any new path/name from Save As.
  const commitSave = useCallback(
    (snapshot: string, result: SaveResult) => {
      if (result.status === "ok") {
        setDoc((prev) =>
          prev
            ? {
                ...prev,
                path: result.path || prev.path,
                name: result.name,
                content: snapshot,
                size: result.size,
              }
            : prev
        );
        setError(null);
        if (result.path) recent.add({ path: result.path, name: result.name });
      } else if (result.status === "error") {
        setError(result.message);
      }
    },
    [recent]
  );

  // Save to the current file. With no path yet (browser drop / new) it falls
  // back to Save As. Snapshots the text so edits during the dialog don't skew
  // the saved baseline.
  const handleSave = useCallback(async () => {
    if (!doc) return;
    const snapshot = content;
    const result = doc.path
      ? await saveToPath(doc.path, snapshot)
      : await saveContentAs(snapshot, doc.name || "document.md");
    commitSave(snapshot, result);
  }, [doc, content, commitSave]);

  const handleSaveAs = useCallback(async () => {
    if (!doc) return;
    const snapshot = content;
    commitSave(snapshot, await saveContentAs(snapshot, doc.name || "document.md"));
  }, [doc, content, commitSave]);

  // Ctrl/Cmd+S saves; add Shift for Save As.
  useEffect(() => {
    if (!doc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (e.shiftKey) handleSaveAs();
        else handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc, handleSave, handleSaveAs]);

  /** Pick the viewer(s) for the current mode. Only called when a doc exists. */
  const renderContent = () => {
    switch (viewMode) {
      case "raw":
        return <RawViewer content={content} />;
      case "edit":
        return (
          <MarkdownEditor content={content} onChange={setContent} isDark={isDark} />
        );
      case "split":
        return (
          <SplitView
            left={<MarkdownViewer content={content} isDark={isDark} />}
            right={<RawViewer content={content} />}
          />
        );
      case "document":
      default:
        return <MarkdownViewer content={content} isDark={isDark} />;
    }
  };

  return (
    <>
    <AppShell
      sidebarVisible={sidebarVisible}
      mainRef={mainRef}
      toolbar={
        <Toolbar
          onOpenFile={handleOpenFile}
          onToggleSidebar={() => setSidebarVisible((v) => !v)}
        >
          {doc && <ViewModeSelector mode={viewMode} onChange={setViewMode} />}
          {doc && (
            <button
              type="button"
              className={`btn btn-icon ${searchOpen ? "btn-primary" : ""}`}
              onClick={() => setSearchOpen((v) => !v)}
              title="Find in document (Ctrl+F)"
              aria-label="Find in document"
              aria-pressed={searchOpen}
            >
              <Search size={16} />
            </button>
          )}
          {doc && (
            <SaveMenu
              dirty={isDirty}
              onSave={handleSave}
              onSaveAs={handleSaveAs}
            />
          )}
          {doc && (
            <ExportMenu
              onExportHtml={handleExportHtml}
              onPrint={handlePrint}
            />
          )}
          <RecentMenu
            recents={recent.recents}
            onOpen={handleOpenRecent}
            onRemove={recent.remove}
            onClear={recent.clear}
          />
          <ThemeSelector theme={theme} onChange={setTheme} />
        </Toolbar>
      }
      sidebar={
        <Sidebar hasDocument={!!doc}>
          {outline.length > 0 ? <Outline items={outline} /> : undefined}
        </Sidebar>
      }
      main={
        <>
          {searchOpen && doc && (
            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              current={search.current}
              total={search.total}
              onNext={search.goNext}
              onPrev={search.goPrev}
              onClose={closeSearch}
              supported={search.supported}
            />
          )}
          {error && (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          )}
          {loading ? (
            <div className="app-loading">Opening document…</div>
          ) : doc ? (
            renderContent()
          ) : (
            <EmptyState
              onOpenFile={handleOpenFile}
              isDragging={isDragging}
              recents={recent.recents}
              onOpenRecent={handleOpenRecent}
              onRemoveRecent={recent.remove}
              onClearRecents={recent.clear}
            />
          )}
        </>
      }
      statusbar={
        <StatusBar
          fileName={doc?.name}
          fileSize={doc?.size}
          words={stats?.words}
          readingMinutes={stats?.readingMinutes}
          themeName={themeName}
          dirty={isDirty}
        />
      }
    />
      {doc && (
        <div className="vmd-export-source" aria-hidden="true">
          <MarkdownViewer
            content={content}
            isDark={isDark}
            contentRef={exportSourceRef}
          />
        </div>
      )}
    </>
  );
}
