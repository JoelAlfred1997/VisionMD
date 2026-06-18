import { File as NodeFile } from "node:buffer";

/**
 * Test environment shims.
 *
 * Two host quirks make the default jsdom environment unreliable for our code:
 *  1. Node 25 injects an experimental global Web Storage that shadows jsdom's
 *     `localStorage` and is non-functional here (no backing file), so the
 *     persistence hooks can't round-trip values.
 *  2. jsdom's `File`/`Blob` do not implement `.text()`, which
 *     `loadBrowserFile()` relies on to read dropped files.
 *
 * We install a small, deterministic in-memory `localStorage` and swap in Node's
 * spec-compliant `File` (which implements `.text()`), so tests exercise the real
 * code paths the browser/WebView2 runtime would.
 */

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

Object.defineProperty(window, "localStorage", {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

// Node's File implements text()/arrayBuffer(); jsdom's does not.
globalThis.File = NodeFile as unknown as typeof globalThis.File;
window.File = NodeFile as unknown as typeof window.File;
