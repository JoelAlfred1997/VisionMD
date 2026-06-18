import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { PREF_KEYS, usePersistentState } from "./usePersistentState";

const KEY = "visionmd.test.value";

describe("usePersistentState", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("exposes namespaced preference keys", () => {
    expect(PREF_KEYS.theme).toBe("visionmd.theme");
    expect(PREF_KEYS.viewMode).toBe("visionmd.viewMode");
    expect(PREF_KEYS.recentFiles).toBe("visionmd.recentFiles");
  });

  it("returns the default when nothing is stored", () => {
    const { result } = renderHook(() => usePersistentState(KEY, "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("reads a previously stored value on mount", () => {
    window.localStorage.setItem(KEY, JSON.stringify("stored"));
    const { result } = renderHook(() => usePersistentState(KEY, "fallback"));
    expect(result.current[0]).toBe("stored");
  });

  it("persists updates back to localStorage", () => {
    const { result } = renderHook(() => usePersistentState(KEY, 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(window.localStorage.getItem(KEY)).toBe("42");
  });

  it("falls back to the default when a validate guard rejects the stored value", () => {
    window.localStorage.setItem(KEY, JSON.stringify("garbage"));
    const isAllowed = (v: unknown): v is "a" | "b" => v === "a" || v === "b";
    const { result } = renderHook(() => usePersistentState(KEY, "a", isAllowed));
    expect(result.current[0]).toBe("a");
  });

  it("falls back to the default when stored JSON is corrupt", () => {
    window.localStorage.setItem(KEY, "{not valid json");
    const { result } = renderHook(() => usePersistentState(KEY, "safe"));
    expect(result.current[0]).toBe("safe");
  });

  it("does not throw when reading from disabled storage", () => {
    vi.spyOn(Object.getPrototypeOf(window.localStorage), "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    const { result } = renderHook(() => usePersistentState(KEY, "default"));
    expect(result.current[0]).toBe("default");
  });

  it("does not throw when writing to disabled storage (over quota)", () => {
    vi.spyOn(Object.getPrototypeOf(window.localStorage), "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const { result } = renderHook(() => usePersistentState(KEY, "x"));
    expect(() => act(() => result.current[1]("y"))).not.toThrow();
    expect(result.current[0]).toBe("y"); // in-memory state still updates
  });
});
