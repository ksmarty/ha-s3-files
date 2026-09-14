export interface S3Entry {
  path: string;
  name: string;
  is_folder: boolean;
  size: number | null;
  last_modified: string | null;
}

export interface S3Permissions {
  allow_list: boolean;
  allow_read: boolean;
  allow_write: boolean;
  allow_delete: boolean;
  allow_move: boolean;
  allow_mkdir: boolean;
}

export interface S3Info {
  bucket: string;
  scope: string;
  notes_folder: string;
  permissions: S3Permissions;
}

export interface HassServiceResponse {
  [key: string]: unknown;
}

export interface HomeAssistant {
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: unknown,
    notifyOnError?: boolean,
    returnResponse?: boolean,
  ): Promise<HassServiceResponse>;
}

export interface WriteResult {
  path: string;
  size: number;
}
