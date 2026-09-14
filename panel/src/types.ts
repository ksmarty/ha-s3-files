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
  show_file_details: boolean;
  permissions: S3Permissions;
}

export interface WriteResult {
  path: string;
  size: number;
}

/**
 * What a service call resolves to.
 *
 * This is the envelope, not the service's own return value: Home Assistant
 * wraps the answer as `{context, response}` and puts the payload under
 * `response`. Reading `.permissions` off the envelope yields undefined, which
 * is why the panel once reported that listing was switched off when it was on.
 */
export interface ServiceCallResponse<T = unknown> {
  context?: { id?: string };
  response?: T;
}

export interface HomeAssistant {
  callService<T = unknown>(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: unknown,
    notifyOnError?: boolean,
    returnResponse?: boolean,
  ): Promise<ServiceCallResponse<T>>;
}
