/**
 * Pure helpers for the panel.
 *
 * Kept free of DOM and Lit so they can be unit tested directly, which is where
 * the fiddly path handling belongs — a browser that mis-joins a path reads or
 * deletes the wrong object.
 */

import type { S3Entry } from "./types";

const TEXT_EXTENSIONS = new Set([
  "md",
  "markdown",
  "txt",
  "text",
  "log",
  "csv",
  "tsv",
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "xml",
  "html",
  "css",
  "js",
  "ts",
  "py",
  "sh",
  "sql",
]);

const EXTENSION_ICONS: Record<string, string> = {
  md: "mdi:language-markdown",
  markdown: "mdi:language-markdown",
  txt: "mdi:text-box-outline",
  log: "mdi:text-box-outline",
  csv: "mdi:table",
  tsv: "mdi:table",
  json: "mdi:code-json",
  yaml: "mdi:file-cog-outline",
  yml: "mdi:file-cog-outline",
  toml: "mdi:file-cog-outline",
  xml: "mdi:xml",
  html: "mdi:language-html5",
  css: "mdi:language-css3",
  js: "mdi:language-javascript",
  ts: "mdi:language-typescript",
  py: "mdi:language-python",
  sh: "mdi:console",
  pdf: "mdi:file-pdf-box",
  png: "mdi:file-image-outline",
  jpg: "mdi:file-image-outline",
  jpeg: "mdi:file-image-outline",
  gif: "mdi:file-image-outline",
  webp: "mdi:file-image-outline",
  svg: "mdi:svg",
  zip: "mdi:folder-zip-outline",
  gz: "mdi:folder-zip-outline",
  tar: "mdi:folder-zip-outline",
  mp3: "mdi:music",
  mp4: "mdi:video-outline",
};

/** The extension of a path, lowercased and without the dot. */
export function extensionOf(path: string): string {
  const name = baseName(path);
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

/** The last segment of a path. */
export function baseName(path: string): string {
  const trimmed = (path ?? "").replace(/\/+$/, "");
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}

/** Join a folder and a name into a single path. */
export function joinPath(folder: string, name: string): string {
  const cleanFolder = (folder ?? "").replace(/^\/+|\/+$/g, "");
  const cleanName = (name ?? "").replace(/^\/+/g, "");
  if (!cleanFolder) return cleanName;
  if (!cleanName) return cleanFolder;
  return `${cleanFolder}/${cleanName}`;
}

/** The folder containing a path. Empty string means the scope root. */
export function parentPath(path: string): string {
  const trimmed = (path ?? "").replace(/\/+$/g, "");
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? "" : trimmed.slice(0, slash);
}

export interface Crumb {
  label: string;
  path: string;
}

/**
 * Breadcrumbs for a path, always starting at the scope root.
 *
 * The root label is supplied by the caller so it can name the configured
 * folder, or fall back to something generic when the whole bucket is allowed.
 */
export function breadcrumbs(path: string, rootLabel = "Files"): Crumb[] {
  const crumbs: Crumb[] = [{ label: rootLabel, path: "" }];
  let current = "";
  for (const part of (path ?? "").split("/").filter(Boolean)) {
    current = joinPath(current, part);
    crumbs.push({ label: part, path: current });
  }
  return crumbs;
}

/** A short, human readable size. */
export function humanSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/** Whether a file is the sort of thing this panel can edit as text. */
export function isTextFile(path: string): boolean {
  const extension = extensionOf(path);
  // No extension at all is usually a text file (README, LICENSE, .env).
  return extension === "" || TEXT_EXTENSIONS.has(extension);
}

/** An mdi icon name for a listing entry. */
export function iconFor(entry: S3Entry): string {
  if (entry.is_folder) return "mdi:folder-outline";
  return EXTENSION_ICONS[extensionOf(entry.path)] ?? "mdi:file-outline";
}

/** A file name without its extension. Folders are returned unchanged. */
export function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  // A leading dot is part of the name (".gitignore"), not an extension.
  if (dot <= 0) return name;
  return name.slice(0, dot);
}

/** What a row shows as an entry's name. */
export function displayName(entry: S3Entry, showDetails = true): string {
  if (entry.is_folder || showDetails) return entry.name;
  return stripExtension(entry.name);
}

/**
 * A one line summary of an entry's metadata.
 *
 * Empty when details are switched off, which drops the "Folder" label too:
 * with every file row losing its detail line, a lone label on folders would
 * stand out rather than inform.
 */
export function describeEntry(entry: S3Entry, showDetails = true): string {
  if (!showDetails) return "";
  if (entry.is_folder) return "Folder";
  const parts: string[] = [];
  if (entry.size !== null && entry.size !== undefined) {
    parts.push(humanSize(entry.size));
  }
  if (entry.last_modified) parts.push(entry.last_modified.slice(0, 10));
  return parts.join(" · ");
}

/** Sort folders first, then by name. */
export function sortEntries(entries: S3Entry[]): S3Entry[] {
  return [...entries].sort((a, b) => {
    if (a.is_folder !== b.is_folder) return a.is_folder ? -1 : 1;
    return a.path.localeCompare(b.path, undefined, { sensitivity: "base" });
  });
}
