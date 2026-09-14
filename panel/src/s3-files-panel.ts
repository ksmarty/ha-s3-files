import { mdiDelete, mdiPencil, mdiRenameBox } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";

import {
  deleteFile,
  getInfo,
  listFiles,
  moveFile,
  readFile,
  writeFile,
} from "./api";
import {
  applyMarkdown,
  baseName,
  breadcrumbs,
  describeEntry,
  displayName,
  ensureExtension,
  iconFor,
  isTextFile,
  joinPath,
  parentPath,
  renamePath,
  sortEntries,
  stripExtension,
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
 *
 * The editor is deliberately built from native input and textarea elements
 * rather than a form schema: this project has already been bitten by Home
 * Assistant form controls that changed shape or silently rendered nothing, and
 * a native field cannot do either.
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

  @state() private _editorName = "";

  @state() private _editorContent = "";

  @state() private _editorPreview = false;

  @state() private _editorError = "";

  @state() private _saving = false;

  @state() private _deleteTarget: S3Entry | null = null;

  // Rename dialog state
  @state() private _renameTarget: S3Entry | null = null;

  @state() private _renameName = "";

  @state() private _renameError = "";

  @state() private _renaming = false;

  @query("textarea.markdown") private _contentArea?: HTMLTextAreaElement;

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

    /* -- editor ---------------------------------------------------------- */
    .editor {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: min(680px, 85vw);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field label {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .field input,
    .editor textarea {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.25));
      border-radius: 8px;
      padding: 8px 10px;
      box-sizing: border-box;
      width: 100%;
    }
    .field input:focus,
    .editor textarea:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .editor textarea {
      min-height: 45vh;
      resize: vertical;
      font-family: var(--code-font-family, ui-monospace, monospace);
      line-height: 1.5;
      tab-size: 2;
    }
    .where {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .markdown-bar {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-wrap: wrap;
    }
    .markdown-bar button {
      background: none;
      border: 1px solid transparent;
      border-radius: 6px;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
      min-width: 32px;
      padding: 4px 8px;
    }
    .markdown-bar button:hover {
      background: var(--secondary-background-color);
    }
    .markdown-bar button[data-active="true"] {
      background: var(--secondary-background-color);
      border-color: var(--divider-color, rgba(0, 0, 0, 0.2));
    }
    .markdown-bar .spacer {
      flex: 1;
    }
    .preview {
      min-height: 45vh;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.25));
      border-radius: 8px;
      padding: 8px 12px;
      overflow: auto;
      background: var(--card-background-color);
    }
    .hint {
      font-size: 13px;
      color: var(--secondary-text-color);
      padding-top: 4px;
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
      .editor {
        min-width: auto;
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
    this._editorPreview = false;
    this._editorName = entry.path;
    this._editorContent = "";

    if (!isTextFile(entry.path)) {
      this._editorError =
        "This does not look like a text file. Editing it here is not supported.";
      return;
    }

    try {
      this._editorContent = await readFile(this.hass, entry.path);
    } catch (err) {
      this._editorError = message(err);
    }
  }

  private _openNew(): void {
    this._editorOpen = true;
    this._editorIsNew = true;
    this._editorError = "";
    this._editorPreview = false;
    // The name only: where it lands is shown separately, so the folder cannot
    // be duplicated into the filename or dropped by mistake.
    this._editorName = "";
    this._editorContent = "";
  }

  /** The path this file will be saved to. */
  private get _targetPath(): string {
    if (!this._editorIsNew) return this._editorName;
    return joinPath(this._path, ensureExtension(this._editorName));
  }

  private async _save(): Promise<void> {
    if (this._editorIsNew && !this._editorName.trim()) {
      this._editorError = "Give the file a name.";
      return;
    }

    const path = this._targetPath;
    this._saving = true;
    this._editorError = "";
    try {
      // Replacing is the point of editing, so overwrite is on; the unique
      // naming used by "take a note" deliberately does not apply here.
      const result = await writeFile(this.hass, path, this._editorContent, true);
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

  private async _applyFormat(action: string): Promise<void> {
    const area = this._contentArea;
    if (!area) return;

    const result = applyMarkdown(
      action,
      this._editorContent,
      area.selectionStart,
      area.selectionEnd,
    );
    this._editorContent = result.text;
    await this.updateComplete;

    area.focus();
    area.setSelectionRange(result.selectionStart, result.selectionEnd);
  }

  private _rowMenuItems(entry: S3Entry) {
    const items: Record<string, unknown>[] = [];
    if (this._permissions.allow_read) {
      items.push({
        label: "Open",
        path: mdiPencil,
        action: () => void this._openExisting(entry),
      });
    }
    if (this._permissions.allow_move && !entry.is_folder) {
      items.push({
        label: "Rename",
        path: mdiRenameBox,
        action: () => this._openRename(entry),
      });
    }
    if (this._permissions.allow_delete && !entry.is_folder) {
      items.push({
        label: "Delete",
        path: mdiDelete,
        action: () => (this._deleteTarget = entry),
        warning: true,
      });
    }
    return items;
  }

  private _openRename(entry: S3Entry): void {
    this._renameTarget = entry;
    this._renameError = "";
    this._renaming = false;
    // Pre-filled without the extension: it is kept unless the typed name has
    // one of its own, so it cannot be lost by accident.
    this._renameName = stripExtension(baseName(entry.path));
  }

  /** Where the renamed file will land. */
  private get _renameDestination(): string {
    if (!this._renameTarget) return "";
    return renamePath(this._renameTarget.path, this._renameName);
  }

  private async _rename(): Promise<void> {
    const target = this._renameTarget;
    if (!target) return;

    if (!this._renameName.trim()) {
      this._renameError = "Give the file a name.";
      return;
    }

    const destination = this._renameDestination;
    if (destination === target.path) {
      this._renameError = "That is already this file's name.";
      return;
    }

    // Checked here as well as by the integration, so the user gets a plain
    // message instead of the service's wording about overwriting.
    if (
      parentPath(destination) === this._path &&
      this._entries.some((item) => item.path === destination)
    ) {
      this._renameError = `${destination} already exists. Choose another name.`;
      return;
    }

    this._renaming = true;
    this._renameError = "";
    try {
      // Never replaces anything: a rename that would clobber another file is
      // refused rather than silently destroying it.
      await moveFile(this.hass, target.path, destination, false);
      this._renameTarget = null;
      await this._load(this._path);
    } catch (err) {
      this._renameError = message(err);
    } finally {
      this._renaming = false;
    }
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

      ${this._renderEditor()} ${this._renderRenameDialog()}
      ${this._renderDeleteDialog()}
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
    const menu = this._rowMenuItems(entry);
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
        ${menu.length
          ? html`<ha-icon-overflow-menu
              .narrow=${true}
              .items=${menu}
            ></ha-icon-overflow-menu>`
          : nothing}
      </div>
    `;
  }

  private _editorHeading(): string {
    if (this._editorIsNew) return "New file";
    if (!this._permissions.allow_read) return "File";
    return "Edit file";
  }

  private _renderMarkdownBar() {
    const button = (label: string, action: string, title: string) =>
      html`<button title=${title} @click=${() => void this._applyFormat(action)}>
        ${label}
      </button>`;

    return html`
      <div class="markdown-bar">
        ${button("B", "bold", "Bold")} ${button("I", "italic", "Italic")}
        ${button("##", "heading", "Heading")}
        ${button("•", "bullet", "Bullet list")}
        ${button("❝", "quote", "Quote")} ${button("</>", "code", "Code")}
        ${button("Link", "link", "Link")}
        <span class="spacer"></span>
        <button
          data-active=${this._editorPreview}
          @click=${() => (this._editorPreview = !this._editorPreview)}
        >
          ${this._editorPreview ? "Write" : "Preview"}
        </button>
      </div>
    `;
  }

  private _renderEditor() {
    const canWrite = this._permissions.allow_write;
    return html`
      <ha-dialog
        .open=${this._editorOpen}
        .heading=${this._editorHeading()}
        @closed=${() => (this._editorOpen = false)}
      >
        <div class="editor">
          ${this._editorIsNew
            ? html`<div class="field">
                <label for="s3-files-name">File name</label>
                <input
                  id="s3-files-name"
                  type="text"
                  .value=${this._editorName}
                  placeholder="My note"
                  ?disabled=${!canWrite}
                  @input=${(ev: Event) => {
                    this._editorName = (ev.target as HTMLInputElement).value;
                  }}
                  @keydown=${(ev: KeyboardEvent) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault();
                      this._contentArea?.focus();
                    }
                  }}
                />
                <div class="where">Saved to ${this._targetPath || "…"}</div>
              </div>`
            : html`<div class="field">
                <label>File</label>
                <div class="where">${this._editorName}</div>
              </div>`}
          ${canWrite ? this._renderMarkdownBar() : nothing}
          ${this._editorPreview
            ? html`<div class="preview">
                <ha-markdown .content=${this._editorContent}></ha-markdown>
              </div>`
            : html`<textarea
                class="markdown"
                .value=${this._editorContent}
                placeholder="Write your note…"
                ?disabled=${!canWrite}
                @input=${(ev: Event) => {
                  this._editorContent = (ev.target as HTMLTextAreaElement).value;
                }}
              ></textarea>`}
          ${this._editorError
            ? html`<div class="error">${this._editorError}</div>`
            : nothing}
          ${canWrite
            ? nothing
            : html`<div class="hint">
                Writing is switched off for this integration, so this file cannot
                be saved from here.
              </div>`}
        </div>

        <ha-dialog-footer slot="footer">
          ${this._permissions.allow_delete && !this._editorIsNew
            ? html`<ha-button
                slot="secondaryAction"
                @click=${() => {
                  const target = this._entries.find(
                    (item) => item.path === this._editorName,
                  );
                  if (target) this._deleteTarget = target;
                }}
              >
                Delete
              </ha-button>`
            : nothing}
          <ha-button slot="secondaryAction" @click=${() => (this._editorOpen = false)}>
            ${canWrite ? "Cancel" : "Close"}
          </ha-button>
          ${canWrite
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

  private _renderRenameDialog() {
    const target = this._renameTarget;
    return html`
      <ha-dialog
        .open=${target !== null}
        .heading=${"Rename file"}
        @closed=${() => (this._renameTarget = null)}
      >
        <div class="editor">
          <div class="field">
            <label for="s3-files-rename">New name</label>
            <input
              id="s3-files-rename"
              type="text"
              .value=${this._renameName}
              ?disabled=${this._renaming}
              @input=${(ev: Event) => {
                this._renameName = (ev.target as HTMLInputElement).value;
                this._renameError = "";
              }}
              @keydown=${(ev: KeyboardEvent) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  void this._rename();
                }
              }}
            />
            <div class="where">
              Renamed to ${this._renameDestination || "…"}
            </div>
          </div>
          ${this._renameError
            ? html`<div class="error">${this._renameError}</div>`
            : nothing}
        </div>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" @click=${() => (this._renameTarget = null)}>
            Cancel
          </ha-button>
          <ha-button
            slot="primaryAction"
            .disabled=${this._renaming}
            @click=${this._rename}
          >
            Rename
          </ha-button>
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