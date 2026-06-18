import { SUPPORTED_EXTENSIONS } from "../../types";
import type { MarkdownDocument } from "../../types";

/**
 * File access abstraction. On the desktop (Tauri) it uses the native open
 * dialog plus a Rust read command; in the browser it uses the File API.
 * The rest of the app calls these functions without knowing which runtime
 * it is in — this is what keeps the web build and the desktop build in sync.
 */

/** Result of an open attempt — explicit so the UI can react to each case. */
export type OpenResult =
  | { status: "ok"; doc: MarkdownDocument }
  | { status: "cancelled" }
  | { status: "unsupported"; name: string }
  | { status: "error"; message: string };

/** Result of a save attempt. On success it reports where it was written. */
export type SaveResult =
  | { status: "ok"; path: string; name: string; size: number }
  | { status: "cancelled" }
  | { status: "error"; message: string };

/** True when running inside the Tauri webview (vs. a plain browser). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Lowercase extension without the dot, e.g. "README.MD" -> "md". */
export function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isSupportedExtension(name: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(getExtension(name));
}

/** Final path/URL segment as a display name. */
export function baseName(pathOrName: string): string {
  const normalized = pathOrName.replace(/\\/g, "/");
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}

/** Comma-joined accept list for the browser file input. */
const ACCEPT = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(",");

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** Open the file picker appropriate for the current runtime and load it. */
export async function openFile(): Promise<OpenResult> {
  return isTauri() ? openFileTauri() : openFileBrowser();
}

/** Load a file the user dropped onto the window (browser File object). */
export async function loadBrowserFile(file: File): Promise<OpenResult> {
  if (!isSupportedExtension(file.name)) {
    return { status: "unsupported", name: file.name };
  }
  try {
    const content = await file.text();
    return {
      status: "ok",
      doc: { path: "", name: file.name, content, size: file.size },
    };
  } catch (err) {
    return { status: "error", message: errorMessage(err) };
  }
}

/** Load a file the user dropped onto the window (Tauri path string). */
export async function loadPath(path: string): Promise<OpenResult> {
  const name = baseName(path);
  if (!isSupportedExtension(name)) {
    return { status: "unsupported", name };
  }
  return readTauriPath(path, name);
}

/**
 * Save `content` to an existing file path (the document's own path). On the
 * desktop this overwrites the file; in the browser there is no path-backed
 * file, so callers should use `saveContentAs` instead.
 */
export async function saveToPath(
  path: string,
  content: string
): Promise<SaveResult> {
  if (!isTauri()) {
    return saveContentAs(content, baseName(path));
  }
  return writeTauriPath(path, content);
}

/**
 * Save `content` to a new file the user picks. On the desktop this opens the
 * native Save dialog; in the browser it downloads the file.
 */
export async function saveContentAs(
  content: string,
  suggestedName: string
): Promise<SaveResult> {
  return isTauri()
    ? saveAsTauri(content, suggestedName)
    : downloadContent(content, suggestedName);
}

/**
 * Ask the user to confirm discarding unsaved edits before an action that would
 * replace the current document. Returns true if it is safe to proceed.
 */
export async function confirmDiscardChanges(): Promise<boolean> {
  if (isTauri()) {
    const { ask } = await import("@tauri-apps/plugin-dialog");
    return ask("You have unsaved changes. Discard them?", {
      title: "Discard changes?",
      kind: "warning",
      okLabel: "Discard",
      cancelLabel: "Keep editing",
    });
  }
  return window.confirm("You have unsaved changes. Discard them?");
}

/* -------------------------------------------------------------------------- */
/* Tauri implementation                                                       */
/* -------------------------------------------------------------------------- */

async function openFileTauri(): Promise<OpenResult> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple: false,
    directory: false,
    title: "Open a Markdown file",
    filters: [{ name: "Markdown", extensions: [...SUPPORTED_EXTENSIONS] }],
  });

  if (selected === null || typeof selected !== "string") {
    return { status: "cancelled" };
  }
  return loadPath(selected);
}

async function readTauriPath(path: string, name: string): Promise<OpenResult> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const content = await invoke<string>("read_text_file", { path });
    return {
      status: "ok",
      doc: { path, name, content, size: byteLength(content) },
    };
  } catch (err) {
    return { status: "error", message: errorMessage(err) };
  }
}

async function writeTauriPath(
  path: string,
  content: string
): Promise<SaveResult> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_text_file", { path, content });
    return {
      status: "ok",
      path,
      name: baseName(path),
      size: byteLength(content),
    };
  } catch (err) {
    return { status: "error", message: errorMessage(err) };
  }
}

async function saveAsTauri(
  content: string,
  suggestedName: string
): Promise<SaveResult> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const path = await save({
    title: "Save Markdown file",
    defaultPath: suggestedName,
    filters: [{ name: "Markdown", extensions: [...SUPPORTED_EXTENSIONS] }],
  });

  if (!path) return { status: "cancelled" };
  return writeTauriPath(path, content);
}

/* -------------------------------------------------------------------------- */
/* Browser implementation                                                     */
/* -------------------------------------------------------------------------- */

async function openFileBrowser(): Promise<OpenResult> {
  const file = await pickBrowserFile();
  if (!file) return { status: "cancelled" };
  return loadBrowserFile(file);
}

/** Programmatic <input type="file"> click; resolves null if nothing chosen. */
function pickBrowserFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPT;
    input.style.display = "none";
    input.addEventListener("change", () => {
      resolve(input.files?.[0] ?? null);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  });
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Browser fallback for saving: download the content as a .md file. */
function downloadContent(content: string, suggestedName: string): SaveResult {
  try {
    const name = isSupportedExtension(suggestedName)
      ? suggestedName
      : `${suggestedName || "document"}.md`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    // The browser can't tell us where it landed and we keep no path handle.
    return { status: "ok", path: "", name, size: byteLength(content) };
  } catch (err) {
    return { status: "error", message: errorMessage(err) };
  }
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return "Could not read the file.";
}
