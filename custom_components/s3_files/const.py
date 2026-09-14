"""Constants for the S3 Files integration."""

from __future__ import annotations

DOMAIN = "s3_files"

# ---------------------------------------------------------------------------
# Config entry options
#
# Everything lives in `options` (the entry's `data` stays empty) so the options
# flow can edit the connection details as well as the permission set.
# ---------------------------------------------------------------------------
CONF_ENDPOINT_URL = "endpoint_url"
CONF_ACCESS_KEY_ID = "access_key_id"
CONF_SECRET_ACCESS_KEY = "secret_access_key"
CONF_REGION = "region"
CONF_BUCKET = "bucket"
CONF_PATH_STYLE = "path_style"
CONF_VERIFY_SSL = "verify_ssl"
CONF_ROOT_PREFIX = "root_prefix"
CONF_NOTES_FOLDER = "notes_folder"
# Sidebar panel presentation, not an action: whether rows show the file
# extension, the size and the date.
CONF_SHOW_FILE_DETAILS = "show_file_details"

DEFAULT_REGION = "us-east-1"
# S3-compatible servers (MinIO, Ceph, Backblaze B2, ...) generally need
# path-style addressing; plain AWS accepts it too, so it is the safer default.
DEFAULT_PATH_STYLE = True
DEFAULT_VERIFY_SSL = True
DEFAULT_ROOT_PREFIX = ""
# Empty by default: notes land directly in the folder the integration is
# scoped to. Set a name to keep them in a subfolder of it instead.
DEFAULT_NOTES_FOLDER = ""
# Show extensions, sizes and dates in the sidebar panel by default; turning it
# off leaves a plain list of names.
DEFAULT_SHOW_FILE_DETAILS = True

# ---------------------------------------------------------------------------
# Permissions
#
# Each permission gates one capability. The matching services and intents are
# only registered when it is switched on, so a disabled action is invisible to
# both automations and the LLM rather than merely refused.
# ---------------------------------------------------------------------------
CONF_ALLOW_LIST = "allow_list"
CONF_ALLOW_READ = "allow_read"
CONF_ALLOW_WRITE = "allow_write"
CONF_ALLOW_DELETE = "allow_delete"
CONF_ALLOW_MOVE = "allow_move"
CONF_ALLOW_MKDIR = "allow_mkdir"

PERMISSIONS = (
    CONF_ALLOW_LIST,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    CONF_ALLOW_DELETE,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_MKDIR,
)

DEFAULT_PERMISSIONS = {
    CONF_ALLOW_LIST: True,
    CONF_ALLOW_READ: True,
    CONF_ALLOW_WRITE: True,
    CONF_ALLOW_DELETE: False,
    CONF_ALLOW_MOVE: False,
    CONF_ALLOW_MKDIR: True,
}

# Human readable names, used in errors, the LLM prompt and diagnostics.
PERMISSION_LABELS = {
    CONF_ALLOW_LIST: "list files",
    CONF_ALLOW_READ: "read files",
    CONF_ALLOW_WRITE: "create and overwrite files",
    CONF_ALLOW_DELETE: "delete files",
    CONF_ALLOW_MOVE: "move and rename files",
    CONF_ALLOW_MKDIR: "create folders",
}

# ---------------------------------------------------------------------------
# Limits (guard rails for what a tool call may pull into an LLM context)
# ---------------------------------------------------------------------------
CONF_MAX_READ_BYTES = "max_read_bytes"
CONF_MAX_RESULTS = "max_results"

DEFAULT_MAX_READ_BYTES = 262144  # 256 KiB
DEFAULT_MAX_RESULTS = 100
MAX_MAX_READ_BYTES = 10485760  # 10 MiB
MAX_MAX_RESULTS = 1000

# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------
SERVICE_LIST_FILES = "list_files"
SERVICE_READ_FILE = "read_file"
SERVICE_WRITE_FILE = "write_file"
SERVICE_DELETE_FILE = "delete_file"
SERVICE_MOVE_FILE = "move_file"
SERVICE_CREATE_FOLDER = "create_folder"
# Not permission gated: copying the sentence templates is a setup step, not an
# action on the bucket.
SERVICE_INSTALL_SENTENCES = "install_sentences"
# Not permission gated either: this describes the setup so the sidebar panel
# knows what it may offer. It returns no file contents and no credentials.
SERVICE_GET_INFO = "get_info"

# ---------------------------------------------------------------------------
# Sidebar panel
# ---------------------------------------------------------------------------
PANEL_FILENAME = "s3-files-panel.js"
PANEL_URL_PATH = "s3-files"
PANEL_ELEMENT = "s3-files-panel"
PANEL_TITLE = "S3 Files"
PANEL_ICON = "mdi:folder-network-outline"

# ---------------------------------------------------------------------------
# Intents
# ---------------------------------------------------------------------------
INTENT_LIST_FILES = "S3ListFiles"
INTENT_READ_FILE = "S3ReadFile"
INTENT_WRITE_FILE = "S3WriteFile"
INTENT_DELETE_FILE = "S3DeleteFile"
INTENT_MOVE_FILE = "S3MoveFile"
INTENT_CREATE_FOLDER = "S3CreateFolder"
INTENT_CREATE_NOTE = "S3CreateNote"

# Intent -> permission required to register it at all.
INTENT_PERMISSIONS = {
    INTENT_LIST_FILES: CONF_ALLOW_LIST,
    INTENT_READ_FILE: CONF_ALLOW_READ,
    INTENT_WRITE_FILE: CONF_ALLOW_WRITE,
    INTENT_DELETE_FILE: CONF_ALLOW_DELETE,
    INTENT_MOVE_FILE: CONF_ALLOW_MOVE,
    INTENT_CREATE_FOLDER: CONF_ALLOW_MKDIR,
    INTENT_CREATE_NOTE: CONF_ALLOW_WRITE,
}

# Order the LLM should consider them in.
INTENT_ORDER = (
    INTENT_CREATE_NOTE,
    INTENT_WRITE_FILE,
    INTENT_LIST_FILES,
    INTENT_READ_FILE,
    INTENT_MOVE_FILE,
    INTENT_CREATE_FOLDER,
    INTENT_DELETE_FILE,
)

# ---------------------------------------------------------------------------
# Text encodings accepted by read_file / write_file
# ---------------------------------------------------------------------------
ENCODING_TEXT = "text"
ENCODING_BASE64 = "base64"
ENCODINGS = (ENCODING_TEXT, ENCODING_BASE64)

DEFAULT_CONTENT_TYPE = "text/markdown"
