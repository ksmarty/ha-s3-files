/**
 * Typed wrappers around the integration's services.
 *
 * Every call asks for the service response explicitly (the last argument).
 * Home Assistant does not return one otherwise, and these services are useful
 * precisely because they report back what happened — the path a note actually
 * got, whether a file was truncated, and so on.
 */

import type {
  HassServiceResponse,
  HomeAssistant,
  S3Entry,
  S3Info,
  WriteResult,
} from "./types";

const DOMAIN = "s3_files";

async function call(
  hass: HomeAssistant,
  service: string,
  data: Record<string, unknown> = {},
): Promise<HassServiceResponse> {
  const response = await hass.callService(
    DOMAIN,
    service,
    data,
    undefined,
    false,
    true,
  );
  if (!response) {
    throw new Error(
      `s3_files.${service} did not return a response. If this integration was ` +
        "just updated, reload the page.",
    );
  }
  return response;
}

export async function getInfo(hass: HomeAssistant): Promise<S3Info> {
  const response = await call(hass, "get_info");
  return response as unknown as S3Info;
}

export async function listFiles(
  hass: HomeAssistant,
  path: string,
): Promise<S3Entry[]> {
  const response = await call(hass, "list_files", { path });
  return (response.files as S3Entry[]) ?? [];
}

export async function readFile(
  hass: HomeAssistant,
  path: string,
): Promise<string> {
  const response = await call(hass, "read_file", { path });
  return String(response.content ?? "");
}

export async function writeFile(
  hass: HomeAssistant,
  path: string,
  content: string,
  overwrite = true,
): Promise<WriteResult> {
  const response = await call(hass, "write_file", {
    path,
    content,
    overwrite,
  });
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
