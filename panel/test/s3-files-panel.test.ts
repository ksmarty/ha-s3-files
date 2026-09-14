/**
 * The panel element.
 *
 * Driven through a fake `hass`, so these exercise the real render and click
 * paths: which rows appear, what a click does, and — importantly — that a
 * switched-off permission removes the control rather than failing on use.
 */

import { afterEach, describe, expect, it } from "vitest";

import "../src/s3-files-panel";
import type { HomeAssistant } from "../src/types";

interface Call {
  service: string;
  data: Record<string, unknown>;
}

const FULL_PERMISSIONS = {
  allow_list: true,
  allow_read: true,
  allow_write: true,
  allow_delete: true,
  allow_move: false,
  allow_mkdir: false,
};

function entry(path: string, name: string, isFolder = false) {
  return {
    path,
    name,
    is_folder: isFolder,
    size: isFolder ? null : 12,
    last_modified: "2026-09-14T10:00:00Z",
  };
}

interface Setup {
  permissions?: Partial<typeof FULL_PERMISSIONS>;
  files?: Record<string, unknown[]>;
  contents?: Record<string, string>;
  fail?: Record<string, string>;
  /** Whether rows show the extension, size and date. Defaults to true. */
  showDetails?: boolean;
}

function makeHass(setup: Setup) {
  const calls: Call[] = [];
  const info = {
    bucket: "ha-files",
    scope: "Mini Notes",
    notes_folder: "",
    show_file_details: setup.showDetails ?? true,
    permissions: { ...FULL_PERMISSIONS, ...(setup.permissions ?? {}) },
  };

  const hass = {
    callService: async (
      _domain: string,
      service: string,
      data: Record<string, unknown> = {},
    ) => {
      calls.push({ service, data });
      if (setup.fail?.[service]) throw new Error(setup.fail[service]);

      switch (service) {
        case "get_info":
          return { context: { id: "test" }, response: info };
        case "list_files":
          return {
            context: { id: "test" },
            response: { files: setup.files?.[String(data.path ?? "")] ?? [] },
          };
        case "read_file":
          return {
            context: { id: "test" },
            response: { content: setup.contents?.[String(data.path)] ?? "" },
          };
        case "write_file":
          return {
            context: { id: "test" },
            response: {
              path: data.path,
              size: String(data.content ?? "").length,
            },
          };
        default:
          return { context: { id: "test" }, response: {} };
      }
    },
  } as unknown as HomeAssistant;

  return { hass, calls, info };
}

/** Let the element finish its async load and re-render. */
async function flush(element: Element, rounds = 6): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    await (
      element as unknown as { updateComplete: Promise<unknown> }
    ).updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

async function mount(setup: Setup) {
  const { hass, calls } = makeHass(setup);
  const element = document.createElement("s3-files-panel") as HTMLElement;
  (element as unknown as { hass: HomeAssistant }).hass = hass;
  document.body.append(element);
  await flush(element);
  return { element, calls, shadow: element.shadowRoot! };
}

function rows(shadow: ShadowRoot): HTMLElement[] {
  return Array.from(shadow.querySelectorAll<HTMLElement>(".row"));
}

function click(target: Element | null | undefined): void {
  (target as HTMLElement).click();
}

function editorDialog(shadow: ShadowRoot) {
  return Array.from(shadow.querySelectorAll("ha-dialog")).find((dialog) => {
    const heading = (dialog as unknown as { heading?: string }).heading ?? "";
    return heading === "New file" || heading === "Edit file";
  }) as (HTMLElement & { heading?: string }) | undefined;
}

function saveButton(shadow: ShadowRoot): Element | null {
  return editorDialog(shadow)?.querySelector('ha-button[slot="primaryAction"]') ?? null;
}

function editorTextarea(shadow: ShadowRoot): HTMLTextAreaElement {
  return editorDialog(shadow)!.querySelector("textarea.markdown") as HTMLTextAreaElement;
}

/** Type into the editor's textarea, as a user would. */
function typeContent(shadow: ShadowRoot, value: string): void {
  const area = editorTextarea(shadow);
  area.value = value;
  area.dispatchEvent(new Event("input"));
}

/** Type into the new-file name field. */
function typeName(shadow: ShadowRoot, value: string): void {
  const input = editorDialog(shadow)!.querySelector("input") as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

/** The per-row action menu: the element itself is not implemented in jsdom, so
 * its items are read and invoked directly. */
function menuItems(
  shadow: ShadowRoot,
  index = 0,
): { label: string; action: () => void }[] {
  const menu = rows(shadow)[index].querySelector("ha-icon-overflow-menu") as
    | (HTMLElement & { items?: { label: string; action: () => void }[] })
    | null;
  return menu?.items ?? [];
}

function menuAction(shadow: ShadowRoot, label: string, index = 0): (() => void) | undefined {
  return menuItems(shadow, index).find((item) => item.label === label)?.action;
}

function renameDialog(shadow: ShadowRoot): HTMLElement | undefined {
  return Array.from(shadow.querySelectorAll("ha-dialog")).find(
    (dialog) => (dialog as unknown as { heading?: string }).heading === "Rename file",
  ) as HTMLElement | undefined;
}

function renameInput(shadow: ShadowRoot): HTMLInputElement {
  return renameDialog(shadow)!.querySelector("input") as HTMLInputElement;
}

function typeRename(shadow: ShadowRoot, value: string): void {
  const input = renameInput(shadow);
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

function renameButton(shadow: ShadowRoot): Element | null {
  return (
    renameDialog(shadow)?.querySelector('ha-button[slot="primaryAction"]') ?? null
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("S3 files panel", () => {
  it("lists the files and folders in the scope", async () => {
    const { shadow } = await mount({
      files: {
        "": [entry("Notes", "Notes", true), entry("Buy milk.md", "Buy milk.md")],
      },
    });

    expect(rows(shadow)).toHaveLength(2);
    expect(rows(shadow)[0].textContent).toContain("Notes");
    expect(rows(shadow)[1].textContent).toContain("Buy milk.md");
    // Folders are listed first even when the response is in another order.
    expect(rows(shadow)[0].textContent).toContain("Folder");
  });

  it("shows which bucket and folder it is browsing", async () => {
    const { shadow } = await mount({ files: { "": [] } });
    expect(shadow.textContent).toContain("Mini Notes");
    expect(shadow.textContent).toContain("ha-files");
  });

  it("says so when the folder is empty", async () => {
    const { shadow } = await mount({ files: { "": [] } });
    expect(shadow.textContent).toContain("Nothing here yet");
  });

  it("browses into a folder when it is clicked", async () => {
    const { shadow, calls } = await mount({
      files: {
        "": [entry("Notes", "Notes", true)],
        Notes: [entry("Notes/a.md", "a.md")],
      },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    expect(calls.filter((call) => call.service === "list_files").at(-1)?.data).toEqual(
      { path: "Notes" },
    );
    expect(rows(shadow)[0].textContent).toContain("a.md");
  });

  it("opens a file for editing and loads its contents", async () => {
    const { shadow, calls } = await mount({
      files: { "": [entry("Buy milk.md", "Buy milk.md")] },
      contents: { "Buy milk.md": "buy milk" },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    expect(calls.some((call) => call.service === "read_file")).toBe(true);
    expect(editorTextarea(shadow).value).toBe("buy milk");
  });

  it("saves an edited file with overwrite on", async () => {
    const { shadow, calls } = await mount({
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "old" },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    typeContent(shadow, "new");
    await flush(shadow.host);
    click(saveButton(shadow));
    await flush(shadow.host);

    const written = calls.find((call) => call.service === "write_file");
    expect(written?.data).toEqual({
      path: "a.md",
      content: "new",
      overwrite: true,
    });
  });

  it("hides the editor behind a clear message for binary files", async () => {
    const { shadow, calls } = await mount({
      files: { "": [entry("photo.png", "photo.png")] },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    expect(shadow.textContent).toContain("not look like a text file");
    // It should not even try to read it as text.
    expect(calls.some((call) => call.service === "read_file")).toBe(false);
  });

  it("deletes a file only after confirmation", async () => {
    const { shadow, calls } = await mount({
      files: { "": [entry("a.md", "a.md")] },
    });

    const remove = menuAction(shadow, "Delete");
    expect(remove).toBeDefined();

    remove!();
    await flush(shadow.host);
    // Nothing has been deleted yet: the dialog is asking first.
    expect(calls.some((call) => call.service === "delete_file")).toBe(false);

    const confirm = Array.from(shadow.querySelectorAll("ha-dialog"))
      .find((dialog) => (dialog as unknown as { heading?: string }).heading === "Delete file")
      ?.querySelector('ha-button[slot="primaryAction"]');
    click(confirm);
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "delete_file")?.data).toEqual({
      path: "a.md",
    });
  });

  it("marks the delete buttons as destructive", async () => {
    // The variant is an attribute selector in ha-button, so it must be set as
    // an attribute: a property binding would not reach the styling.
    const { shadow } = await mount({
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "hi" },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    const inEditor = Array.from(
      editorDialog(shadow)!.querySelectorAll('ha-button[slot="secondaryAction"]'),
    ).find((button) => button.textContent?.trim() === "Delete");
    expect(inEditor?.getAttribute("variant")).toBe("danger");

    click(inEditor);
    await flush(shadow.host);

    const confirm = Array.from(shadow.querySelectorAll("ha-dialog"))
      .find((dialog) => (dialog as unknown as { heading?: string }).heading === "Delete file")
      ?.querySelector('ha-button[slot="primaryAction"]');
    expect(confirm?.getAttribute("variant")).toBe("danger");
  });

  it("can delete from the editor as well as the row", async () => {
    const { shadow, calls } = await mount({
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "hi" },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    const deleteInDialog = Array.from(
      editorDialog(shadow)!.querySelectorAll('ha-button[slot="secondaryAction"]'),
    ).find((button) => button.textContent?.trim() === "Delete");
    expect(deleteInDialog).toBeDefined();

    click(deleteInDialog);
    await flush(shadow.host);
    click(
      Array.from(shadow.querySelectorAll("ha-dialog"))
        .find((dialog) => (dialog as unknown as { heading?: string }).heading === "Delete file")
        ?.querySelector('ha-button[slot="primaryAction"]'),
    );
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "delete_file")?.data).toEqual({
      path: "a.md",
    });
  });
});

describe("creating a file", () => {
  it("saves the name and the contents together, with a markdown extension", async () => {
    const { shadow, calls } = await mount({ files: { "": [] } });

    click(
      Array.from(shadow.querySelectorAll("ha-button")).find((button) =>
        button.textContent?.includes("New file"),
      ),
    );
    await flush(shadow.host);

    typeName(shadow, "Shopping list");
    typeContent(shadow, "- milk\n- bread");
    await flush(shadow.host);

    // The name field is empty and the destination is shown separately.
    expect(shadow.textContent).toContain("Saved to Shopping list.md");

    click(saveButton(shadow));
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "write_file")?.data).toEqual({
      path: "Shopping list.md",
      content: "- milk\n- bread",
      overwrite: true,
    });
  });

  it("keeps a name that already has an extension", async () => {
    const { shadow, calls } = await mount({ files: { "": [] } });

    click(
      Array.from(shadow.querySelectorAll("ha-button")).find((button) =>
        button.textContent?.includes("New file"),
      ),
    );
    await flush(shadow.host);

    typeName(shadow, "notes.txt");
    typeContent(shadow, "hello");
    await flush(shadow.host);
    click(saveButton(shadow));
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "write_file")?.data.path).toBe(
      "notes.txt",
    );
  });

  it("creates the file inside the folder being browsed", async () => {
    const { shadow, calls } = await mount({
      files: { "": [entry("Journal", "Journal", true)], Journal: [] },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    click(
      Array.from(shadow.querySelectorAll("ha-button")).find((button) =>
        button.textContent?.includes("New file"),
      ),
    );
    await flush(shadow.host);

    // The name field must not be pre-filled with the folder, or the folder
    // would be lost or duplicated into the filename.
    expect((editorDialog(shadow)!.querySelector("input") as HTMLInputElement).value).toBe("");

    typeName(shadow, "Today");
    await flush(shadow.host);
    // The destination is shown as the name is typed.
    expect(shadow.textContent).toContain("Saved to Journal/Today.md");

    click(saveButton(shadow));
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "write_file")?.data.path).toBe(
      "Journal/Today.md",
    );
  });

  it("asks for a name before saving", async () => {
    const { shadow, calls } = await mount({ files: { "": [] } });

    click(
      Array.from(shadow.querySelectorAll("ha-button")).find((button) =>
        button.textContent?.includes("New file"),
      ),
    );
    await flush(shadow.host);

    typeContent(shadow, "no name given");
    await flush(shadow.host);
    click(saveButton(shadow));
    await flush(shadow.host);

    expect(shadow.textContent).toContain("Give the file a name");
    expect(calls.some((call) => call.service === "write_file")).toBe(false);
  });
});

describe("renaming a file", () => {
  const allowed = { allow_move: true };

  it("is offered only when moving is switched on", async () => {
    const { shadow } = await mount({
      permissions: { allow_move: false },
      files: { "": [entry("a.md", "a.md")] },
    });
    expect(menuAction(shadow, "Rename")).toBeUndefined();
  });

  it("is not offered for a folder", async () => {
    const { shadow } = await mount({
      permissions: allowed,
      files: { "": [entry("Journal", "Journal", true)] },
    });
    expect(menuAction(shadow, "Rename")).toBeUndefined();
  });

  it("renames a file and keeps its extension", async () => {
    const { shadow, calls } = await mount({
      permissions: allowed,
      files: { "": [entry("Buy milk.md", "Buy milk.md")] },
    });

    menuAction(shadow, "Rename")!();
    await flush(shadow.host);

    // Pre-filled with the name without its extension, so it cannot be lost.
    expect(renameInput(shadow).value).toBe("Buy milk");
    expect(shadow.textContent).toContain("Renamed to Buy milk.md");

    typeRename(shadow, "Shopping");
    await flush(shadow.host);
    expect(shadow.textContent).toContain("Renamed to Shopping.md");

    click(renameButton(shadow));
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "move_file")?.data).toEqual({
      source: "Buy milk.md",
      destination: "Shopping.md",
      overwrite: false,
    });
  });

  it("keeps the file in the folder it was in", async () => {
    const { shadow, calls } = await mount({
      permissions: allowed,
      files: {
        "": [entry("Journal", "Journal", true)],
        Journal: [entry("Journal/Today.md", "Today.md")],
      },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    menuAction(shadow, "Rename")!();
    await flush(shadow.host);
    typeRename(shadow, "Tomorrow");
    await flush(shadow.host);
    click(renameButton(shadow));
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "move_file")?.data).toEqual({
      source: "Journal/Today.md",
      destination: "Journal/Tomorrow.md",
      overwrite: false,
    });
  });

  it("uses an extension the new name brings", async () => {
    const { shadow, calls } = await mount({
      permissions: allowed,
      files: { "": [entry("notes.md", "notes.md")] },
    });

    menuAction(shadow, "Rename")!();
    await flush(shadow.host);
    typeRename(shadow, "notes.txt");
    await flush(shadow.host);
    click(renameButton(shadow));
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "move_file")?.data.destination).toBe(
      "notes.txt",
    );
  });

  it("refuses a name that is already taken, without touching anything", async () => {
    const { shadow, calls } = await mount({
      permissions: allowed,
      files: { "": [entry("a.md", "a.md"), entry("b.md", "b.md")] },
    });

    menuAction(shadow, "Rename", 0)!();
    await flush(shadow.host);
    typeRename(shadow, "b");
    await flush(shadow.host);
    click(renameButton(shadow));
    await flush(shadow.host);

    expect(shadow.textContent).toContain("already exists");
    expect(calls.some((call) => call.service === "move_file")).toBe(false);
  });

  it("says so when the name has not changed", async () => {
    const { shadow, calls } = await mount({
      permissions: allowed,
      files: { "": [entry("a.md", "a.md")] },
    });

    menuAction(shadow, "Rename")!();
    await flush(shadow.host);
    click(renameButton(shadow));
    await flush(shadow.host);

    expect(shadow.textContent).toContain("already this file's name");
    expect(calls.some((call) => call.service === "move_file")).toBe(false);
  });

  it("wants a name", async () => {
    const { shadow, calls } = await mount({
      permissions: allowed,
      files: { "": [entry("a.md", "a.md")] },
    });

    menuAction(shadow, "Rename")!();
    await flush(shadow.host);
    typeRename(shadow, "   ");
    await flush(shadow.host);
    click(renameButton(shadow));
    await flush(shadow.host);

    expect(shadow.textContent).toContain("Give the file a name");
    expect(calls.some((call) => call.service === "move_file")).toBe(false);
  });
});

describe("the preview toggle", () => {
  async function openEditor(setup: Setup) {
    const mounted = await mount(setup);
    click(rows(mounted.shadow)[0].querySelector(".row-text"));
    await flush(mounted.shadow.host);
    return mounted;
  }

  function toggle(shadow: ShadowRoot, label: string): Element | undefined {
    return Array.from(
      editorDialog(shadow)!.querySelectorAll(".markdown-bar button"),
    ).find((button) => button.textContent?.trim() === label);
  }

  it("is the only control above the text", async () => {
    const { shadow } = await openEditor({
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "hello" },
    });

    const buttons = editorDialog(shadow)!.querySelectorAll(".markdown-bar button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent?.trim()).toBe("Preview");
  });

  it("is offered even for a file that cannot be written", async () => {
    // Reading is worth doing wherever writing is allowed or not.
    const { shadow } = await openEditor({
      permissions: { allow_write: false },
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "# Heading" },
    });

    expect(toggle(shadow, "Preview")).toBeDefined();
  });

  it("swaps the textarea for the rendered note", async () => {
    const { shadow } = await openEditor({
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "# Heading" },
    });

    click(toggle(shadow, "Preview"));
    await flush(shadow.host);

    const rendered = editorDialog(shadow)!.querySelector("ha-markdown") as
      | (HTMLElement & { content?: string })
      | null;
    expect(rendered).toBeTruthy();
    expect(rendered?.content).toBe("# Heading");
    expect(editorDialog(shadow)!.querySelector("textarea")).toBeNull();
  });

  it("switches back without losing the text", async () => {
    const { shadow } = await openEditor({
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "# Heading" },
    });

    click(toggle(shadow, "Preview"));
    await flush(shadow.host);
    click(toggle(shadow, "Write"));
    await flush(shadow.host);

    expect(editorTextarea(shadow).value).toBe("# Heading");
  });
});

describe("permissions drive what the panel offers", () => {
  it("opens a file read only when writing is off", async () => {
    const { shadow } = await mount({
      permissions: { allow_write: false },
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "hello" },
    });

    expect(shadow.textContent).not.toContain("New file");

    // The contents are still worth reading, so the editor opens...
    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);
    expect(editorDialog(shadow)).toBeDefined();

    // ...but there is nothing to save it with, and the panel says why.
    expect(saveButton(shadow)).toBeNull();
    expect(shadow.textContent).toContain("Writing is switched off");
  });

  it("offers no delete when deleting is off", async () => {
    const { shadow } = await mount({
      permissions: { allow_delete: false },
      files: { "": [entry("a.md", "a.md")] },
      contents: { "a.md": "hi" },
    });

    // Not in the row menu...
    expect(menuItems(shadow)[0]?.label).not.toBe("Delete");
    expect(menuAction(shadow, "Delete")).toBeUndefined();

    // ...and not in the editor either.
    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);
    const secondary = Array.from(
      editorDialog(shadow)!.querySelectorAll('ha-button[slot="secondaryAction"]'),
    ).map((button) => button.textContent?.trim());
    expect(secondary).not.toContain("Delete");
  });

  it("explains itself when listing is off", async () => {
    const { shadow, calls } = await mount({ permissions: { allow_list: false } });

    expect(shadow.textContent).toContain("Listing is switched off");
    expect(calls.some((call) => call.service === "list_files")).toBe(false);
  });

  it("does not blame the settings when listing is actually on", async () => {
    // The reported bug: the panel read the service call's envelope instead of
    // the payload, so every permission looked off and it told the user listing
    // was switched off when they had switched it on.
    const { shadow, calls } = await mount({
      files: { "": [entry("Buy milk.md", "Buy milk.md")] },
    });

    expect(shadow.textContent).not.toContain("Listing is switched off");
    expect(rows(shadow)).toHaveLength(1);
    expect(calls.some((call) => call.service === "list_files")).toBe(true);
  });

  it("does not make files clickable when reading is off", async () => {
    const { shadow, calls } = await mount({
      permissions: { allow_read: false },
      files: { "": [entry("a.md", "a.md"), entry("Notes", "Notes", true)] },
    });

    const fileRow = rows(shadow).find((row) => row.textContent?.includes("a.md"))!;
    expect(fileRow.getAttribute("data-clickable")).toBe("false");

    click(fileRow.querySelector(".row-text"));
    await flush(shadow.host);
    expect(calls.some((call) => call.service === "read_file")).toBe(false);
  });
});

describe("file details display", () => {
  it("shows the extension, size and date by default", async () => {
    const { shadow } = await mount({
      files: { "": [entry("Buy milk.md", "Buy milk.md")] },
    });

    expect(rows(shadow)[0].textContent).toContain("Buy milk.md");
    expect(rows(shadow)[0].textContent).toContain("12 B");
    expect(rows(shadow)[0].textContent).toContain("2026-09-14");
  });

  it("hides them when the setting is off", async () => {
    const { shadow } = await mount({
      showDetails: false,
      files: { "": [entry("Buy milk.md", "Buy milk.md")] },
    });

    expect(rows(shadow)[0].textContent).toContain("Buy milk");
    expect(rows(shadow)[0].textContent).not.toContain(".md");
    expect(rows(shadow)[0].textContent).not.toContain("12 B");
    expect(rows(shadow)[0].textContent).not.toContain("2026-09-14");
  });

  it("keeps the rows uniform when details are off", async () => {
    const { shadow } = await mount({
      showDetails: false,
      files: {
        "": [entry("Notes", "Notes", true), entry("Buy milk.md", "Buy milk.md")],
      },
    });

    // Folders stay listed by name, and the "Folder" label goes with the rest
    // of the detail line so every row looks the same.
    expect(rows(shadow)).toHaveLength(2);
    expect(rows(shadow)[0].textContent).toContain("Notes");
    expect(shadow.textContent).not.toContain("Folder");
  });

  it("still uses the real file name when opening the editor", async () => {
    // Hiding the extension is a display choice; the editor must still show and
    // save the file that actually exists.
    const { shadow, calls } = await mount({
      showDetails: false,
      files: { "": [entry("Buy milk.md", "Buy milk.md")] },
      contents: { "Buy milk.md": "buy milk" },
    });

    click(rows(shadow)[0].querySelector(".row-text"));
    await flush(shadow.host);

    expect(calls.find((call) => call.service === "read_file")?.data).toEqual({
      path: "Buy milk.md",
    });
  });
});

describe("failures", () => {
  it("shows the error the integration reported", async () => {
    const { shadow } = await mount({
      files: { "": [entry("a.md", "a.md")] },
      fail: { list_files: "The S3 credentials are not allowed to list files." },
    });

    expect(shadow.textContent).toContain("not allowed to list files");
  });
});
