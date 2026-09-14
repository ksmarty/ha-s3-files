/**
 * Typed wrappers around the integration's services.
 *
 * Every call asks for the service response explicitly — without that last
 * argument Home Assistant returns nothing at all — and then unwraps it. The
 * frontend resolves a service call to `{context, response}`, with the
 * integration's return value under `response`; it is not the value itself.
 */

import type { HomeAssistant, S3Entry, S3Info, WriteResult } from "./types";

const DOMAIN = "s3_files";

async function call<T>(
  hass: HomeAssistant,
  service: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  const result = await hass.callService<T>(
    DOMAIN,
    service,
    data,
    undefined,
    // Let the caller deal with failures: the panel shows them in place, which
    // is where the user is looking, rather than as a toast.
    false,
    true,
  );

  const response = result?.response;
  if (response === undefined || response === null) {
    throw new Error(
      `s3_files.${service} did not return a response. If this integration was ` +
        "just updated, reload the page.",
    );
  }
  return response;
}

export async function getInfo(hass: HomeAssistant): Promise<S3Info> {
  return call<S3Info>(hass, "get_info");
}

export async function listFiles(
  hass: HomeAssistant,
  path: string,
): Promise<S3Entry[]> {
  const response = await call<{ files?: S3Entry[] }>(hass, "list_files", { path });
  return response.files ?? [];
}

export async function readFile(
  hass: HomeAssistant,
  path: string,
): Promise<string> {
  const response = await call<{ content?: string }>(hass, "read_file", { path });
  return String(response.content ?? "");
}

export async function writeFile(
  hass: HomeAssistant,
  path: string,
  content: string,
  overwrite = true,
): Promise<WriteResult> {
  const response = await call<{ path?: string; size?: number }>(
    hass,
    "write_file",
    { path, content, overwrite },
  );
  return {
    path: String(response.path ?? path),
    size: Number(response.size ?? 0),
  };
}

export async function deleteFile(
  hass: HomeAssistant,
  path: string,
): Promise<void> {
  await call(hass, "delete_file", { path });
}

/** Rename (or move) a file. Returns the path it ended up at. */
export async function moveFile(
  hass: HomeAssistant,
  source: string,
  destination: string,
  overwrite = false,
): Promise<string> {
  const response = await call<{ path?: string }>(hass, "move_file", {
    source,
    destination,
    overwrite,
  });
  return String(response.path ?? destination);
}
