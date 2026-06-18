import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MAX_RECENT_FILES, useRecentFiles } from "./useRecentFiles";
import { PREF_KEYS } from "../preferences/usePersistentState";

describe("useRecentFiles", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts empty", () => {
    const { result } = renderHook(() => useRecentFiles());
    expect(result.current.recents).toEqual([]);
  });

  it("adds a file and puts the most-recent first", () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => result.current.add({ path: "/a.md", name: "a.md" }));
    act(() => result.current.add({ path: "/b.md", name: "b.md" }));
    expect(result.current.recents.map((r) => r.path)).toEqual(["/b.md", "/a.md"]);
  });

  it("ignores path-less (browser-dropped) files", () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => result.current.add({ path: "", name: "dropped.md" }));
    expect(result.current.recents).toEqual([]);
  });

  it("deduplicates by path and moves the re-opened file to the front", () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => result.current.add({ path: "/a.md", name: "a.md" }));
    act(() => result.current.add({ path: "/b.md", name: "b.md" }));
    act(() => result.current.add({ path: "/a.md", name: "a.md" }));
    expect(result.current.recents.map((r) => r.path)).toEqual(["/a.md", "/b.md"]);
    expect(result.current.recents).toHaveLength(2);
  });

  it("caps the list at MAX_RECENT_FILES, dropping the oldest", () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => {
      for (let i = 0; i < MAX_RECENT_FILES + 3; i++) {
        result.current.add({ path: `/f${i}.md`, name: `f${i}.md` });
      }
    });
    expect(result.current.recents).toHaveLength(MAX_RECENT_FILES);
    // Newest first, oldest three dropped.
    expect(result.current.recents[0].path).toBe(`/f${MAX_RECENT_FILES + 2}.md`);
    expect(result.current.recents.some((r) => r.path === "/f0.md")).toBe(false);
  });

  it("removes a single entry by path", () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => result.current.add({ path: "/a.md", name: "a.md" }));
    act(() => result.current.add({ path: "/b.md", name: "b.md" }));
    act(() => result.current.remove("/a.md"));
    expect(result.current.recents.map((r) => r.path)).toEqual(["/b.md"]);
  });

  it("clears the whole list", () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => result.current.add({ path: "/a.md", name: "a.md" }));
    act(() => result.current.clear());
    expect(result.current.recents).toEqual([]);
  });

  it("persists entries under the recentFiles key", () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => result.current.add({ path: "/a.md", name: "a.md" }));
    const stored = window.localStorage.getItem(PREF_KEYS.recentFiles);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)[0].path).toBe("/a.md");
  });

  it("recovers from a corrupt stored value by starting empty", () => {
    window.localStorage.setItem(PREF_KEYS.recentFiles, JSON.stringify([{ bad: true }]));
    const { result } = renderHook(() => useRecentFiles());
    expect(result.current.recents).toEqual([]);
  });
});
