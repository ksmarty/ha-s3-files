/**
 * The panel's calls into the integration.
 *
 * These assert the contract the integration actually relies on: the service
 * name and fields, and that a response is requested — without the last
 * argument Home Assistant returns nothing and every call here would come back
 * empty.
 */

import { describe, expect, it } from "vitest";

import {
  deleteFile,
  getInfo,
  listFiles,
  moveFile,
  readFile,
  writeFile,
} from "../src/api";
import type { HomeAssistant } from "../src/types";

interface RecordedCall {
  domain: string;
  service: string;
  data: Record<string, unknown>;
  returnResponse?: boolean;
}

function fakeHass(
  respond: (service: string, data: Record<string, unknown>) => unknown,
): { hass: HomeAssistant; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const hass = {
    callService: async (
      domain: string,
      service: string,
      data: Record<string, unknown> = {},
      _target?: unknown,
      _notifyOnError?: boolean,
      returnResponse?: boolean,
    ) => {
      calls.push({ domain, service, data, returnResponse });
      // Home Assistant resolves a service call to this envelope, with the
      // integration's value under `response`.
      return { context: { id: "test" }, response: respond(service, data) };
    },
  } as unknown as HomeAssistant;
  return { hass, calls };
}

describe("service calls", () => {
  it("asks for the service response", async () => {
    const { hass, calls } = fakeHass(() => ({ files: [] }));
    await listFiles(hass, "");
    expect(calls[0].domain).toBe("s3_files");
    expect(calls[0].returnResponse).toBe(true);
  });

  it("unwraps the envelope Home Assistant returns", async () => {
    // A service call resolves to {context, response}, with the integration's
    // value under `response`. Reading the payload off the envelope itself
    // yields undefined — which is how the panel came to report that listing
    // was switched off when it was on.
    const { hass } = fakeHass(() => ({
      permissions: { allow_list: true },
    }));

    const info = await getInfo(hass);

    expect(info.permissions.allow_list).toBe(true);
  });

  it("explains itself when no response comes back", async () => {
    const { hass } = fakeHass(() => undefined);
    await expect(listFiles(hass, "")).rejects.toThrow(/did not return a response/);
  });

  it("explains itself when the call itself fails", async () => {
    const hass = {
      callService: async () => {
        throw new Error("Service s3_files.get_info not found.");
      },
    } as unknown as HomeAssistant;

    await expect(getInfo(hass)).rejects.toThrow(/not found/);
  });
});

describe("listFiles", () => {
  it("passes the path and unwraps the files", async () => {
    const entry = { path: "notes/a.md", name: "a.md", is_folder: false };
    const { hass, calls } = fakeHass(() => ({ files: [entry], count: 1 }));

    expect(await listFiles(hass, "notes")).toEqual([entry]);
    expect(calls[0].service).toBe("list_files");
    expect(calls[0].data).toEqual({ path: "notes" });
  });

  it("returns an empty list when the response has none", async () => {
    const { hass } = fakeHass(() => ({}));
    expect(await listFiles(hass, "")).toEqual([]);
  });
});

describe("readFile", () => {
  it("returns the content as a string", async () => {
    const { hass, calls } = fakeHass(() => ({ content: "hello" }));
    expect(await readFile(hass, "notes/a.md")).toBe("hello");
    expect(calls[0].data).toEqual({ path: "notes/a.md" });
  });
});

describe("writeFile", () => {
  it("sends the path, content and overwrite flag", async () => {
    const { hass, calls } = fakeHass(() => ({ path: "notes/a.md", size: 5 }));

    const result = await writeFile(hass, "notes/a.md", "hello", true);

    expect(result).toEqual({ path: "notes/a.md", size: 5 });
    expect(calls[0].service).toBe("write_file");
    expect(calls[0].data).toEqual({
      path: "notes/a.md",
      content: "hello",
      overwrite: true,
    });
  });

  it("reports the path the integration actually used", async () => {
    // The unique naming for notes can differ from what was asked for.
    const { hass } = fakeHass(() => ({ path: "Notes (2).md", size: 5 }));
    expect((await writeFile(hass, "Notes.md", "hi")).path).toBe("Notes (2).md");
  });
});

describe("deleteFile", () => {
  it("sends the path", async () => {
    const { hass, calls } = fakeHass(() => ({ deleted: true }));
    await deleteFile(hass, "notes/a.md");
    expect(calls[0].service).toBe("delete_file");
    expect(calls[0].data).toEqual({ path: "notes/a.md" });
  });
});

describe("moveFile", () => {
  it("sends the source, destination and overwrite flag", async () => {
    const { hass, calls } = fakeHass(() => ({ path: "Journal/Shopping.md" }));

    const result = await moveFile(hass, "Journal/Buy milk.md", "Journal/Shopping.md");

    expect(result).toBe("Journal/Shopping.md");
    expect(calls[0].service).toBe("move_file");
    expect(calls[0].data).toEqual({
      source: "Journal/Buy milk.md",
      destination: "Journal/Shopping.md",
      overwrite: false,
    });
  });

  it("never overwrites unless asked", async () => {
    const { hass, calls } = fakeHass(() => ({ path: "b.md" }));
    await moveFile(hass, "a.md", "b.md");
    expect(calls[0].data.overwrite).toBe(false);
  });

  it("reports where the file ended up", async () => {
    // The integration is the authority on the final path.
    const { hass } = fakeHass(() => ({}));
    expect(await moveFile(hass, "a.md", "b.md")).toBe("b.md");
  });
});

describe("getInfo", () => {
  it("returns the bucket, scope and permissions", async () => {
    const info = {
      bucket: "ha-files",
      scope: "Mini Notes",
      notes_folder: "",
      permissions: {
        allow_list: true,
        allow_read: true,
        allow_write: true,
        allow_delete: false,
        allow_move: false,
        allow_mkdir: false,
      },
    };
    const { hass, calls } = fakeHass(() => info);

    expect(await getInfo(hass)).toEqual(info);
    expect(calls[0].service).toBe("get_info");
  });
});
