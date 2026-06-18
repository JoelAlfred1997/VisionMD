import { useEffect, useRef } from "react";
import { isTauri } from "./fileService";

/**
 * Opens the file VisionMD was launched with (file association / "Open with" /
 * CLI argument) and any file opened while the app is already running.
 *
 * - On startup it asks the Rust side (`get_launch_file`) for the path the app
 *   was opened with and loads it.
 * - While running, the single-instance plugin forwards subsequent launches as
 *   an `open-file` event, which this hook also loads.
 *
 * No-op in the browser (there is no OS launch path there).
 *
 * `onPath` is read through a ref so the launch file is fetched and the event
 * listener is attached exactly **once** — `onPath`'s identity changes on every
 * render (it depends on app state), and re-running this effect would re-open
 * the launch file in a loop.
 */
export function useLaunchFile(onPath: (path: string) => void): void {
  const onPathRef = useRef(onPath);
  onPathRef.current = onPath;

  useEffect(() => {
    if (!isTauri()) return;

    let cancelled = false;
    let unlisten: (() => void) | undefined;

    (async () => {
      const [{ invoke }, { listen }] = await Promise.all([
        import("@tauri-apps/api/core"),
        import("@tauri-apps/api/event"),
      ]);

      // File the app was launched with (double-clicked in the OS, etc.).
      try {
        const initial = await invoke<string | null>("get_launch_file");
        if (initial && !cancelled) onPathRef.current(initial);
      } catch {
        /* No launch file or command unavailable — open to the welcome screen. */
      }

      // Files opened while VisionMD is already running (single-instance).
      const stop = await listen<string>("open-file", (event) => {
        if (event.payload) onPathRef.current(event.payload);
      });
      if (cancelled) stop();
      else unlisten = stop;
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
