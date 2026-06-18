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

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return "Could not read the file.";
}
