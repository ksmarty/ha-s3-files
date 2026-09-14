import { LitElement, css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";

import { deleteFile, getInfo, listFiles, readFile, writeFile } from "./api";
import {
  breadcrumbs,
  describeEntry,
  displayName,
  iconFor,
  isTextFile,
  joinPath,
  parentPath,
  sortEntries,
} from "./format";
import type { HomeAssistant, S3Entry, S3Info } from "./types";

/**
 * Sidebar panel: browse the folder the integration is scoped to, read and edit
 * the files in it, create new ones and delete them.
 *
 * Home Assistant loads the module and assigns `hass`, `narrow`, `route` and
 * `panel` onto the element, so all four must be settable properties.
 *
 * What the panel offers follows the permission switches: with writing off there
 * is no New or Save, with deleting off there is no delete. The integration
 * refuses those calls anyway, so the UI only reflects a decision already made.
 */
export class S3FilesPanel extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @property({ type: Boolean }) narrow = false;

  @property({ attribute: false }) route?: unknown;

  @property({ attribute: false }) panel?: unknown;

  @state() private _info: S3Info | null = null;

  @state() private _path = "";

  @state() private _entries: S3Entry[] = [];

  @state() private _loading = false;

  @state() private _error = "";

  // Editor dialog state
  @state() private _editorOpen = false;

  @state() private _editorIsNew = false;

  @state() private _editorData: Record<string, unknown> = {};

  @state() private _editorError = "";

  @state() private _saving = false;

  @state() private _deleteTarget: S3Entry | null = null;

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      box-sizing: border-box;
      height: 100%;
    }
    .content {
      max-width: 900px;
      margin: 0 auto;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }
    .heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 22px;
      font-weight: 400;
      min-width: 0;
    }
    .heading-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .heading span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .subtitle {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    nav {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
      margin: 12px 0 8px;
      font-size: 14px;
    }
    nav button {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      font: inherit;
      padding: 2px 4px;
      border-radius: 4px;
    }
    nav button:hover {
      background: var(--secondary-background-color);
    }
    nav .current {
      color: var(--primary-text-color);
      cursor: default;
    }
    nav .sep {
      color: var(--secondary-text-color);
    }
    .list {
      background: var(--card-background-color);
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      overflow: hidden;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
      min-height: 48px;
      box-sizing: border-box;
    }
    .row:last-child {
      border-bottom: none;
    }
    .row[data-clickable="true"] {
      cursor: pointer;
    }
    .row[data-clickable="true"]:hover {
      background: var(--secondary-background-color);
    }
    .row-text {
      flex: 1;
      min-width: 0;
    }
    .row-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row-meta {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .empty,
    .error {
      padding: 24px 12px;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .filename {
      font-size: 13px;
      color: var(--secondary-text-color);
      padding-top: 4px;
    }
    .hint {
      font-size: 13px;
      color: var(--secondary-text-color);
      padding-top: 8px;
    }
    @media (max-width: 600px) {
      :host {
        padding: 12px 8px;
      }
      .heading {
        font-size: 18px;
      }
      .new-label {
        display: none;
      }
    }
  `;

  protected willUpdate(changed: Map<string, unknown>): void {
    // Load once, as soon as Home Assistant hands us a `hass` object.
    if (changed.has("hass") && this.hass && !this._info && !this._loading) {
      void this._start();
    }
  }

  private get _permissions() {
    return (
      this._info?.permissions ?? {
        allow_list: false,
        allow_read: false,
        allow_write: false,
        allow_delete: false,
        allow_move: false,
        allow_mkdir: false,
      }
    );
  }

  private get _rootLabel(): string {
    if (!this._info) return "Files";
    return this._info.scope ? this._info.scope.split("/").pop() || "Files" : "Bucket";
  }

  /** Whether rows show the extension, size and date. Defaults to showing them. */
  private get _showDetails(): boolean {
    return this._info?.show_file_details ?? true;
  }

  private async _start(): Promise<void> {
    this._loading = true;
    this._error = "";
    try {
      this._info = await getInfo(this.hass);
      await this._load(this._path);
    } catch (err) {
      this._error = message(err);
    } finally {
      this._loading = false;
    }
  }

  private async _load(path: string): Promise<void> {
    if (!this._permissions.allow_list) {
      this._path = path;
      this._entries = [];
      return;
    }

    this._loading = true;
    this._error = "";
    try {
      this._path = path;
      this._entries = sortEntries(await listFiles(this.hass, path));
    } catch (err) {
      this._error = message(err);
      this._entries = [];
    } finally {
      this._loading = false;
    }
  }

  private _activate(entry: S3Entry): void {
    if (entry.is_folder) {
      void this._load(entry.path);
      return;
    }
    if (!this._permissions.allow_read) return;
    void this._openExisting(entry);
  }

  private async _openExisting(entry: S3Entry): Promise<void> {
    this._editorOpen = true;
    this._editorIsNew = false;
    this._editorError = "";
    this._editorData = { path: entry.path, content: "" };

    if (!isTextFile(entry.path)) {
      this._editorError =
        "This does not look like a text file. Editing it here is not supported.";
      return;
    }

    try {
      const content = await readFile(this.hass, entry.path);
      this._editorData = { path: entry.path, content };
    } catch (err) {
      this._editorError = message(err);
    }
  }

  private _openNew(): void {
    this._editorOpen = true;
    this._editorIsNew = true;
    this._editorError = "";
    this._editorData = { path: joinPath(this._path, ""), content: "" };
  }

  private async _save(): Promise<void> {
    const path = String(this._editorData.path ?? "").trim();
    const content = String(this._editorData.content ?? "");

    if (!path) {
      this._editorError = "Give the file a name.";
      return;
    }

    this._saving = true;
    this._editorError = "";
    try {
      // Replacing is the point of editing, so overwrite is on; the unique
      // naming used by "take a note" deliberately does not apply here.
      const result = await writeFile(this.hass, path, content, true);
      this._editorOpen = false;
      await this._load(parentPath(result.path));
    } catch (err) {
      this._editorError = message(err);
    } finally {
      this._saving = false;
    }
  }

  private async _delete(): Promise<void> {
    const target = this._deleteTarget;
    if (!target) return;
    this._deleteTarget = null;
    try {
      await deleteFile(this.hass, target.path);
      await this._load(this._path);
    } catch (err) {
      this._error = message(err);
    }
  }

  private _editorSchema() {
    const fields: Record<string, unknown>[] = [];
    if (this._editorIsNew) {
      fields.push({
        name: "path",
        required: true,
        selector: { text: {} },
      });
    }
    fields.push({
      name: "content",
      selector: { text: { multiline: true } },
    });
    return fields;
  }

  private _editorLabels() {
    return {
      path: "File name",
      content: "Contents",
    } as Record<string, string>;
  }

  protected render() {
    if (!this.hass) return html``;
    return html`
      <div class="content">
        <div class="toolbar">
          <div class="heading">
            <ha-menu-button></ha-menu-button>
            <ha-icon icon="mdi:folder-network-outline"></ha-icon>
            <div class="heading-text">
              <span>Notes</span>
              <span class="subtitle">${this._subtitle()}</span>
            </div>
          </div>
          <div class="toolbar-actions">
            <ha-button @click=${() => this._load(this._path)} title="Refresh">
              <ha-icon icon="mdi:refresh"></ha-icon>
            </ha-button>
            ${this._permissions.allow_write
              ? html`<ha-button @click=${this._openNew}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  <span class="new-label">New file</span>
                </ha-button>`
              : nothing}
          </div>
        </div>

        ${this._permissions.allow_list ? this._renderBreadcrumbs() : nothing}
        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
        ${this._renderList()}
      </div>

      ${this._renderEditor()} ${this._renderDeleteDialog()}
    `;
  }

  private _subtitle(): string {
    if (!this._info) return "";
    const where = this._info.scope ? this._info.scope : "the whole bucket";
    return `in ${where} of ${this._info.bucket}`;
  }

  private _renderBreadcrumbs() {
    const crumbs = breadcrumbs(this._path, this._rootLabel);
    return html`
      <nav>
        ${crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return html`${index > 0 ? html`<span class="sep">/</span>` : nothing}
            <button
              class=${last ? "current" : ""}
              ?disabled=${last}
              @click=${() => this._load(crumb.path)}
            >
              ${crumb.label}
            </button>`;
        })}
      </nav>
    `;
  }

  private _renderList() {
    if (!this._permissions.allow_list) {
      return html`<div class="list">
        <div class="empty">
          Listing is switched off for this integration. Turn on "List files and
          folders" in its options to browse them here.
        </div>
      </div>`;
    }

    if (this._loading && this._entries.length === 0) {
      return html`<div class="list">
        <div class="empty">Loading…</div>
      </div>`;
    }

    if (this._entries.length === 0 && !this._error) {
      return html`<div class="list">
        <div class="empty">Nothing here yet.</div>
      </div>`;
    }

    return html`<div class="list">
      ${this._entries.map((entry) => this._renderRow(entry))}
    </div>`;
  }

  private _renderRow(entry: S3Entry) {
    const clickable = entry.is_folder || this._permissions.allow_read;
    const meta = this._showDetails ? describeEntry(entry, true) : "";
    return html`
      <div class="row" data-clickable=${clickable}>
        <ha-icon
          .icon=${iconFor(entry)}
          @click=${() => this._activate(entry)}
        ></ha-icon>
        <div class="row-text" @click=${() => this._activate(entry)}>
          <div class="row-title">${displayName(entry, this._showDetails)}</div>
          ${meta ? html`<div class="row-meta">${meta}</div>` : nothing}
        </div>
        ${!entry.is_folder && this._permissions.allow_delete
          ? html`<ha-button
              title="Delete"
              @click=${() => (this._deleteTarget = entry)}
            >
              <ha-icon icon="mdi:delete-outline"></ha-icon>
            </ha-button>`
          : nothing}
      </div>
    `;
  }

  private _renderEditor() {
    return html`
      <ha-dialog
        .open=${this._editorOpen}
        .heading=${this._editorIsNew ? "New file" : "Edit file"}
        @closed=${() => (this._editorOpen = false)}
      >
        ${this._editorIsNew
          ? html`<div class="filename">
              Saved in ${this._info?.scope ? this._info.scope : "the bucket root"}
            </div>`
          : html`<div class="filename">${this._editorData.path}</div>`}
        <ha-form
          .hass=${this.hass}
          .data=${this._editorData}
          .schema=${this._editorSchema()}
          .computeLabel=${(schema: { name: string }) =>
            this._editorLabels()[schema.name] ?? schema.name}
          @value-changed=${(ev: CustomEvent) => {
            this._editorData = ev.detail.value;
          }}
        ></ha-form>
        ${this._editorError
          ? html`<div class="error">${this._editorError}</div>`
          : nothing}
        ${this._permissions.allow_write
          ? nothing
          : html`<div class="hint">
              Writing is switched off for this integration, so this file cannot
              be saved from here.
            </div>`}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" @click=${() => (this._editorOpen = false)}>
            ${this._permissions.allow_write ? "Cancel" : "Close"}
          </ha-button>
          ${this._permissions.allow_write
            ? html`<ha-button
                slot="primaryAction"
                .disabled=${this._saving}
                @click=${this._save}
              >
                ${this._editorIsNew ? "Create" : "Save"}
              </ha-button>`
            : nothing}
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }

  private _renderDeleteDialog() {
    const target = this._deleteTarget;
    return html`
      <ha-dialog
        .open=${target !== null}
        .heading=${"Delete file"}
        @closed=${() => (this._deleteTarget = null)}
      >
        <p>
          Delete <strong>${target?.path}</strong>? Deleting an S3 object cannot
          be undone.
        </p>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" @click=${() => (this._deleteTarget = null)}>
            Cancel
          </ha-button>
          <ha-button slot="primaryAction" @click=${this._delete}>
            Delete
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

/** Turn whatever was thrown into something worth showing. */
function message(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

if (!customElements.get("s3-files-panel")) {
  customElements.define("s3-files-panel", S3FilesPanel);
}
