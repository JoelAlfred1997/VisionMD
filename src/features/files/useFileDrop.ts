import { useEffect, useState } from "react";
import { isTauri } from "./fileService";

interface FileDropHandlers {
  /** Called with a browser File when one is dropped (web runtime). */
  onFile: (file: File) => void;
  /** Called with an absolute path when one is dropped (Tauri runtime). */
  onPath: (path: string) => void;
}

/**
 * Window-level drag-and-drop. Returns whether a drag is currently hovering,
 * so the UI can show a drop affordance. Bridges the two runtimes: the browser
 * exposes File objects, Tauri exposes filesystem paths.
 */
export function useFileDrop({ onFile, onPath }: FileDropHandlers): boolean {
  const [isDragging, setIsDragging] = useState(false);

  // --- Tauri native drag-drop -------------------------------------------
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;

    (async () => {
      const { getCurrentWebview } = await import("@tauri-apps/api/webview");
      unlisten = await getCurrentWebview().onDragDropEvent((event) => {
        const { type } = event.payload;
        if (type === "enter" || type === "over") {
          setIsDragging(true);
        } else if (type === "leave") {
          setIsDragging(false);
        } else if (type === "drop") {
          setIsDragging(false);
          const path = event.payload.paths[0];
          if (path) onPath(path);
        }
      });
    })();

    return () => unlisten?.();
  }, [onPath]);

  // --- Browser drag-drop -------------------------------------------------
  useEffect(() => {
    if (isTauri()) return;

    let depth = 0; // track nested dragenter/leave to avoid flicker

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setIsDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDragLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFile(file);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFile]);

  return isDragging;
}

function hasFiles(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes("Files");
}
