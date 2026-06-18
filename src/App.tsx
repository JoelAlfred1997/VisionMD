import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "./components/AppShell";
import { Toolbar } from "./components/Toolbar";
import { ViewModeSelector } from "./components/ViewModeSelector";
import { ThemeSelector } from "./components/ThemeSelector";
import { ExportMenu } from "./components/ExportMenu";
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
import { DEFAULT_THEME, getTheme, isThemeId } from "./features/theme/themes";
import {
  PREF_KEYS,
  usePersistentState,
} from "./features/preferences/usePersistentState";
import {
  loadBrowserFile,
  loadPath,
  openFile,
  type OpenResult,
} from "./features/files/fileService";
import { useFileDrop } from "./features/files/useFileDrop";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  // Off-screen, always-rendered document used as the export capture source so
  // export works in any view mode with Shiki/Mermaid output already baked in.
  const exportSourceRef = useRef<HTMLDivElement>(null);
  const recent = useRecentFiles();

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

  // Outline + reading stats are derived from the open document's source.
  const outline = useMemo(
    () => (doc ? buildOutline(doc.content) : []),
    [doc]
  );
  const stats = useMemo(
    () => (doc ? computeReadingStats(doc.content) : null),
    [doc]
  );

  // In-document search. The content key forces a re-walk when the document or
  // view mode (Document / Raw / Split) changes the rendered text.
  const search = useSearch(mainRef, {
    query: searchQuery,
    enabled: searchOpen && !!doc,
    contentKey: doc ? `${doc.name}:${doc.size}:${viewMode}` : "",
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

  /** Pick the viewer(s) for the current mode. Only called when a doc exists. */
  const renderDocument = (document: MarkdownDocument) => {
    switch (viewMode) {
      case "raw":
        return <RawViewer content={document.content} />;
      case "split":
        return (
          <SplitView
            left={<MarkdownViewer content={document.content} isDark={isDark} />}
            right={<RawViewer content={document.content} />}
          />
        );
      case "document":
      default:
        return <MarkdownViewer content={document.content} isDark={isDark} />;
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
            renderDocument(doc)
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
        />
      }
    />
      {doc && (
        <div className="vmd-export-source" aria-hidden="true">
          <MarkdownViewer
            content={doc.content}
            isDark={isDark}
            contentRef={exportSourceRef}
          />
        </div>
      )}
    </>
  );
}
