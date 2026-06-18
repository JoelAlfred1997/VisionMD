import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/** localStorage keys for user preferences. Namespaced to avoid collisions. */
export const PREF_KEYS = {
  theme: "visionmd.theme",
  viewMode: "visionmd.viewMode",
  recentFiles: "visionmd.recentFiles",
} as const;

/**
 * `useState` mirrored to localStorage. Reads the stored value on mount and
 * writes back on every change. Safe when storage is unavailable (private mode,
 * quota, non-browser host): reads fall back to `defaultValue`, writes are
 * swallowed. An optional `validate` guard rejects stale/corrupt values so a
 * bad stored string can never become invalid state.
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  validate?: (value: unknown) => value is T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      const parsed = JSON.parse(raw) as unknown;
      if (validate && !validate(parsed)) return defaultValue;
      return parsed as T;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore: storage disabled or over quota — persistence is best-effort */
    }
  }, [key, value]);

  return [value, setValue];
}
