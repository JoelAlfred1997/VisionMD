import { useCallback } from "react";
import {
  PREF_KEYS,
  usePersistentState,
} from "../preferences/usePersistentState";
import type { RecentFile } from "../../types";

/** How many recent files to remember. Older entries are dropped. */
export const MAX_RECENT_FILES = 8;

function isRecentFile(value: unknown): value is RecentFile {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.path === "string" &&
    typeof v.name === "string" &&
    typeof v.lastOpened === "number"
  );
}

/** Validate a persisted recents list, rejecting stale/corrupt shapes. */
function isRecentFileList(value: unknown): value is RecentFile[] {
  return Array.isArray(value) && value.every(isRecentFile);
}

export interface RecentFilesApi {
  recents: RecentFile[];
  /** Record an opened file. No-op for path-less (browser-dropped) files. */
  add: (file: { path: string; name: string }) => void;
  /** Forget a single entry by path. */
  remove: (path: string) => void;
  /** Forget every entry. */
  clear: () => void;
}

/**
 * Persisted list of recently opened files (most-recent first). Only files with
 * a real path can be reopened, so path-less browser drops are not recorded.
 * The list is deduped by path and capped at {@link MAX_RECENT_FILES}.
 */
export function useRecentFiles(): RecentFilesApi {
  const [recents, setRecents] = usePersistentState<RecentFile[]>(
    PREF_KEYS.recentFiles,
    [],
    isRecentFileList
  );

  const add = useCallback(
    (file: { path: string; name: string }) => {
      if (!file.path) return;
      setRecents((prev) => {
        const deduped = prev.filter((r) => r.path !== file.path);
        const entry: RecentFile = {
          path: file.path,
          name: file.name,
          lastOpened: Date.now(),
        };
        return [entry, ...deduped].slice(0, MAX_RECENT_FILES);
      });
    },
    [setRecents]
  );

  const remove = useCallback(
    (path: string) => {
      setRecents((prev) => prev.filter((r) => r.path !== path));
    },
    [setRecents]
  );

  const clear = useCallback(() => setRecents([]), [setRecents]);

  return { recents, add, remove, clear };
}
