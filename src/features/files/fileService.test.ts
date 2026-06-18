import { describe, it, expect } from "vitest";
import {
  baseName,
  getExtension,
  isSupportedExtension,
  isTauri,
  loadBrowserFile,
  loadPath,
} from "./fileService";

describe("getExtension", () => {
  it("lowercases the extension after the last dot", () => {
    expect(getExtension("README.MD")).toBe("md");
    expect(getExtension("notes.tar.MARKDOWN")).toBe("markdown");
  });

  it("returns an empty string when there is no extension", () => {
    expect(getExtension("LICENSE")).toBe("");
    expect(getExtension("noext")).toBe("");
  });
});

describe("isSupportedExtension", () => {
  it("accepts every supported markdown extension", () => {
    for (const name of ["a.md", "a.markdown", "a.mdown", "a.mkd"]) {
      expect(isSupportedExtension(name)).toBe(true);
    }
  });

  it("rejects unsupported or extensionless names", () => {
    expect(isSupportedExtension("a.txt")).toBe(false);
    expect(isSupportedExtension("a.docx")).toBe(false);
    expect(isSupportedExtension("README")).toBe(false);
  });
});

describe("baseName", () => {
  it("returns the final segment for posix and windows paths", () => {
    expect(baseName("/home/user/notes.md")).toBe("notes.md");
    expect(baseName("C:\\Users\\joe\\notes.md")).toBe("notes.md");
    expect(baseName("notes.md")).toBe("notes.md");
  });
});

describe("isTauri", () => {
  it("is false in a plain browser/jsdom environment", () => {
    expect(isTauri()).toBe(false);
  });
});

describe("loadBrowserFile", () => {
  it("loads a supported file into an ok result", async () => {
    const file = new File(["# Hi\n\ncontent"], "doc.md", { type: "text/markdown" });
    const result = await loadBrowserFile(file);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.doc.name).toBe("doc.md");
      expect(result.doc.path).toBe(""); // browser drops have no path
      expect(result.doc.content).toContain("# Hi");
      expect(result.doc.size).toBe(file.size);
    }
  });

  it("rejects an unsupported file type", async () => {
    const file = new File(["nope"], "image.png", { type: "image/png" });
    const result = await loadBrowserFile(file);
    expect(result).toEqual({ status: "unsupported", name: "image.png" });
  });

  it("returns an error result when reading the file throws", async () => {
    // A File-like object whose text() rejects exercises the catch path.
    const broken = {
      name: "broken.md",
      text: () => Promise.reject(new Error("read failed")),
    } as unknown as File;
    const result = await loadBrowserFile(broken);
    expect(result).toEqual({ status: "error", message: "read failed" });
  });

  it("accepts an empty markdown file", async () => {
    const file = new File([""], "empty.md");
    const result = await loadBrowserFile(file);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.doc.content).toBe("");
      expect(result.doc.size).toBe(0);
    }
  });
});

describe("loadPath", () => {
  it("rejects an unsupported path without touching the runtime", async () => {
    const result = await loadPath("/tmp/photo.jpg");
    expect(result).toEqual({ status: "unsupported", name: "photo.jpg" });
  });

  it("surfaces an error when not running under Tauri (no invoke available)", async () => {
    // Supported extension, but isTauri() is false here so the dynamic Tauri
    // import path fails — it must degrade to an error result, not throw.
    const result = await loadPath("/tmp/notes.md");
    expect(result.status).toBe("error");
  });
});
