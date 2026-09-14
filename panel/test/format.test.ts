import { describe, expect, it } from "vitest";

import {
  applyMarkdown,
  baseName,
  breadcrumbs,
  describeEntry,
  displayName,
  ensureExtension,
  extensionOf,
  humanSize,
  iconFor,
  isTextFile,
  joinPath,
  parentPath,
  sortEntries,
  stripExtension,
} from "../src/format";
import type { S3Entry } from "../src/types";

function entry(path: string, overrides: Partial<S3Entry> = {}): S3Entry {
  return {
    path,
    name: baseName(path),
    is_folder: false,
    size: null,
    last_modified: null,
    ...overrides,
  };
}

describe("baseName and extensionOf", () => {
  it("takes the last segment", () => {
    expect(baseName("notes/2026/today.md")).toBe("today.md");
    expect(baseName("today.md")).toBe("today.md");
    expect(baseName("notes/")).toBe("notes");
    expect(baseName("")).toBe("");
  });

  it("reads the extension", () => {
    expect(extensionOf("notes/Today.MD")).toBe("md");
    expect(extensionOf("archive.tar.gz")).toBe("gz");
    // A dotfile is not an extension.
    expect(extensionOf(".gitignore")).toBe("");
    expect(extensionOf("README")).toBe("");
  });
});

describe("joinPath", () => {
  it("joins a folder and a name", () => {
    expect(joinPath("notes", "today.md")).toBe("notes/today.md");
    expect(joinPath("notes/sub", "today.md")).toBe("notes/sub/today.md");
  });

  it("handles the scope root", () => {
    expect(joinPath("", "today.md")).toBe("today.md");
    expect(joinPath("notes", "")).toBe("notes");
  });

  it("does not produce doubled separators", () => {
    expect(joinPath("notes/", "/today.md")).toBe("notes/today.md");
    expect(joinPath("/notes/", "today.md")).toBe("notes/today.md");
  });
});

describe("parentPath", () => {
  it("walks back up", () => {
    expect(parentPath("notes/sub/today.md")).toBe("notes/sub");
    expect(parentPath("notes/today.md")).toBe("notes");
    expect(parentPath("today.md")).toBe("");
  });

  it("tolerates a trailing separator", () => {
    expect(parentPath("notes/sub/")).toBe("notes");
  });
});

describe("breadcrumbs", () => {
  it("starts at the root label", () => {
    expect(breadcrumbs("", "Mini Notes")).toEqual([
      { label: "Mini Notes", path: "" },
    ]);
  });

  it("builds a crumb per segment with cumulative paths", () => {
    expect(breadcrumbs("notes/2026", "Mini Notes")).toEqual([
      { label: "Mini Notes", path: "" },
      { label: "notes", path: "notes" },
      { label: "2026", path: "notes/2026" },
    ]);
  });

  it("ignores empty segments", () => {
    expect(breadcrumbs("notes//2026/", "Files")).toEqual([
      { label: "Files", path: "" },
      { label: "notes", path: "notes" },
      { label: "2026", path: "notes/2026" },
    ]);
  });
});

describe("humanSize", () => {
  it("formats bytes", () => {
    expect(humanSize(0)).toBe("0 B");
    expect(humanSize(999)).toBe("999 B");
    expect(humanSize(1024)).toBe("1.0 KB");
    expect(humanSize(1536)).toBe("1.5 KB");
    expect(humanSize(1024 * 1024)).toBe("1.0 MB");
  });

  it("drops the decimal once the number is large", () => {
    expect(humanSize(50 * 1024)).toBe("50 KB");
  });

  it("says nothing for a missing size", () => {
    expect(humanSize(null)).toBe("");
    expect(humanSize(undefined)).toBe("");
  });
});

describe("isTextFile", () => {
  it("accepts text documents", () => {
    for (const path of [
      "notes.md",
      "notes.txt",
      "data.json",
      "config.yaml",
      "README",
      ".gitignore",
    ]) {
      expect(isTextFile(path), path).toBe(true);
    }
  });

  it("rejects binaries", () => {
    for (const path of ["photo.png", "archive.zip", "song.mp3", "doc.pdf"]) {
      expect(isTextFile(path), path).toBe(false);
    }
  });
});

describe("iconFor", () => {
  it("uses a folder icon for folders", () => {
    expect(iconFor(entry("notes", { is_folder: true }))).toBe("mdi:folder-outline");
  });

  it("picks an icon by extension", () => {
    expect(iconFor(entry("notes.md"))).toBe("mdi:language-markdown");
    expect(iconFor(entry("data.json"))).toBe("mdi:code-json");
  });

  it("falls back for anything unknown", () => {
    expect(iconFor(entry("weird.qqq"))).toBe("mdi:file-outline");
  });
});

describe("describeEntry", () => {
  it("labels a folder", () => {
    expect(describeEntry(entry("notes", { is_folder: true }))).toBe("Folder");
  });

  it("shows size and date for a file", () => {
    expect(
      describeEntry(
        entry("notes.md", { size: 2048, last_modified: "2026-09-14T10:00:00Z" }),
      ),
    ).toBe("2.0 KB · 2026-09-14");
  });

  it("copes with missing metadata", () => {
    expect(describeEntry(entry("notes.md"))).toBe("");
  });

  it("renders nothing at all when details are switched off", () => {
    expect(describeEntry(entry("notes.md", { size: 12 }), false)).toBe("");
    expect(describeEntry(entry("notes", { is_folder: true }), false)).toBe("");
  });
});

describe("stripExtension", () => {
  it("removes the last extension", () => {
    expect(stripExtension("Buy milk.md")).toBe("Buy milk");
    expect(stripExtension("archive.tar.gz")).toBe("archive.tar");
    expect(stripExtension("README")).toBe("README");
    // A leading dot is part of the name, not an extension.
    expect(stripExtension(".gitignore")).toBe(".gitignore");
  });
});

describe("displayName", () => {
  it("keeps the whole name when details are shown", () => {
    expect(displayName(entry("Buy milk.md"), true)).toBe("Buy milk.md");
    expect(displayName(entry("Buy milk.md"))).toBe("Buy milk.md");
  });

  it("drops the extension when they are hidden", () => {
    expect(displayName(entry("Buy milk.md"), false)).toBe("Buy milk");
  });

  it("leaves folder names alone either way", () => {
    const folder = entry("2026.notes", { is_folder: true });
    expect(displayName(folder, false)).toBe("2026.notes");
    expect(displayName(folder, true)).toBe("2026.notes");
  });
});

describe("sortEntries", () => {
  it("puts folders first, then sorts by name ignoring case", () => {
    const sorted = sortEntries([
      entry("banana.md"),
      entry("zeta", { is_folder: true }),
      entry("Apple.md"),
      entry("alpha", { is_folder: true }),
    ]);
    expect(sorted.map((item) => item.path)).toEqual([
      "alpha",
      "zeta",
      "Apple.md",
      "banana.md",
    ]);
  });

  it("does not reorder the caller's array", () => {
    const original = [entry("b.md"), entry("a.md")];
    sortEntries(original);
    expect(original.map((item) => item.path)).toEqual(["b.md", "a.md"]);
  });
});

describe("ensureExtension", () => {
  it("adds a markdown extension to a bare name", () => {
    expect(ensureExtension("Shopping list")).toBe("Shopping list.md");
    expect(ensureExtension("  spaced  ")).toBe("spaced.md");
  });

  it("leaves a name that already has an extension alone", () => {
    expect(ensureExtension("notes.txt")).toBe("notes.txt");
    expect(ensureExtension("archive.tar.gz")).toBe("archive.tar.gz");
  });

  it("cleans up a trailing dot rather than doubling it", () => {
    expect(ensureExtension("notes.")).toBe("notes.md");
    expect(ensureExtension("notes...")).toBe("notes.md");
  });

  it("returns nothing for an empty name, so the caller can complain", () => {
    expect(ensureExtension("")).toBe("");
    expect(ensureExtension("   ")).toBe("");
  });
});

describe("applyMarkdown", () => {
  it("wraps the selection and keeps it selected", () => {
    const result = applyMarkdown("bold", "hello world", 0, 5);
    expect(result.text).toBe("**hello** world");
    expect(result.text.slice(result.selectionStart, result.selectionEnd)).toBe("hello");
  });

  it("wraps italics and code the same way", () => {
    expect(applyMarkdown("italic", "hi", 0, 2).text).toBe("_hi_");
    expect(applyMarkdown("code", "x = 1", 0, 5).text).toBe("`x = 1`");
  });

  it("inserts markers and puts the caret between them when nothing is selected", () => {
    const result = applyMarkdown("bold", "", 0, 0);
    expect(result.text).toBe("****");
    expect(result.selectionStart).toBe(2);
    expect(result.selectionEnd).toBe(2);
  });

  it("turns the selection into a link and selects the placeholder url", () => {
    const result = applyMarkdown("link", "docs", 0, 4);
    expect(result.text).toBe("[docs](url)");
    expect(result.text.slice(result.selectionStart, result.selectionEnd)).toBe("url");
  });

  it("prefixes the lines a selection touches", () => {
    const text = "milk\nbread";
    const result = applyMarkdown("bullet", text, 0, text.length);
    expect(result.text).toBe("- milk\n- bread");
  });

  it("prefixes the whole line even when the selection is partial", () => {
    const text = "milk\nbread";
    const result = applyMarkdown("heading", text, 1, 2);
    expect(result.text).toBe("## milk\nbread");
  });

  it("removes a prefix that is already there", () => {
    const text = "- milk\n- bread";
    const result = applyMarkdown("bullet", text, 0, text.length);
    expect(result.text).toBe("milk\nbread");
  });

  it("leaves the text alone for an unknown action", () => {
    const result = applyMarkdown("nonsense", "unchanged", 0, 9);
    expect(result.text).toBe("unchanged");
  });

  it("clamps a selection that is out of range", () => {
    const result = applyMarkdown("bold", "hi", -5, 99);
    expect(result.text).toBe("**hi**");
    expect(result.selectionStart).toBe(2);
  });
});
