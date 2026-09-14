# S3 Files for Home Assistant

Give Home Assistant — and the assistant you talk to — controlled access to an
S3 or S3-compatible bucket.

The integration is built around two ideas:

- **You decide what it may do.** Every capability (list, read, write, delete,
  move, create folder) is a separate switch. A switched-off action is not
  merely refused: its service is never registered and it is never offered to an
  LLM as a tool, so your assistant cannot even see it.
- **You decide where it may do it.** The integration is scoped to one folder.
  Everything it reads or writes lives under that folder, and a path that tries
  to climb out of it is refused. A listing returns paths relative to the
  folder, so a path the assistant reads out can be fed straight back in.

Works with Amazon S3, MinIO, Ceph, Backblaze B2, Wasabi, Cloudflare R2 and
anything else that speaks the S3 API.

## Requirements

- Home Assistant 2024.6 or newer
- HACS 2.x, or a manual install
- A bucket that already exists, and credentials that can reach it
- The only Python dependency is `boto3`, which Home Assistant installs for you.
  It is declared as `>=1.34,<2` rather than an exact version on purpose — see
  [Why boto3 is not pinned exactly](#why-boto3-is-not-pinned-exactly).

## Installation

1. In HACS, add this repository as a custom repository (category:
   **Integration**) and install **S3 Files**.
2. Restart Home Assistant.
3. Go to **Settings → Devices & Services → Add Integration → S3 Files**.

## Configuration

Everything is on one screen, and all of it can be changed later with the
integration's **Configure** button.

### Connection

| Field | Notes |
| --- | --- |
| **Bucket** | The bucket name. It must already exist. |
| **Endpoint URL** | For S3-compatible servers, e.g. `https://minio.local:9000`. Leave empty for Amazon S3. |
| **Region** | Amazon S3 needs the bucket's real region. Most S3-compatible servers accept `us-east-1`. |
| **Access key ID** / **Secret access key** | Leave both empty to use credentials from the environment, such as an instance role. |
| **Use path-style addressing** | On by default. Required by most S3-compatible servers; turn it off for Amazon S3 if you prefer virtual-hosted style. |
| **Verify the TLS certificate** | Turn off only for a server with a self-signed certificate. |

The secret is stored in Home Assistant's config entry and is redacted from
diagnostics — it is never written to the log.

### Scope

| Field | Notes |
| --- | --- |
| **Folder this integration is limited to** | The only folder it can reach, e.g. `homeassistant/notes`. Leave empty to allow the whole bucket. |
| **Notes subfolder** | Where "take a note" saves, relative to the folder above. Leave it empty (the default) to save notes directly in that folder. |

### Permissions

| Permission | What it adds | Default |
| --- | --- | --- |
| **List files and folders** | `list_files` and the `S3ListFiles` tool. Without it nothing can discover paths. | on |
| **Read file contents** | `read_file` and `S3ReadFile`. | on |
| **Create and overwrite files** | `write_file`, the "take a note" action, and `S3WriteFile` / `S3CreateNote`. | on |
| **Delete files** | `delete_file` and `S3DeleteFile`. Deleting an S3 object cannot be undone. | off |
| **Move and rename files** | `move_file` and `S3MoveFile`. A move copies the object, then deletes the original. | off |
| **Create folders** | `create_folder` and `S3CreateFolder`. | on |

Delete and move are off by default. Turn them on deliberately.

## Services

Only the services your permissions allow exist. All of them accept an optional
response, so they are useful from scripts and automations.

| Service | Fields |
| --- | --- |
| `s3_files.list_files` | `path`, `recursive`, `max_results` |
| `s3_files.read_file` | `path`, `encoding` (`text`/`base64`), `max_bytes` |
| `s3_files.write_file` | `path`, `content`, `encoding`, `content_type`, `overwrite` |
| `s3_files.delete_file` | `path` |
| `s3_files.move_file` | `source`, `destination`, `overwrite` |
| `s3_files.create_folder` | `path` |
| `s3_files.install_sentences` | `language` — see below |

Example, saving a note from an automation:

```yaml
action:
  - service: s3_files.write_file
    data:
      path: notes/leak-detected.md
      content: "The leak sensor in the basement went off."
      overwrite: false
    response_variable: saved
  - service: notify.mobile_app
    data:
      message: "Saved {{ saved.path }}"
```

Every path is relative to the folder you configured. `notes/leaks.md` means
`<your folder>/notes/leaks.md` in the bucket.

## Talking to it

### With an LLM (recommended)

The integration exposes its intents to conversational agents through Home
Assistant's LLM tool platform. An agent that understands tools can use them
immediately — no sentence templates, no extra setup.

Ask things like:

- *"Take a note that the boiler service is booked for Tuesday."*
- *"List my files."*
- *"Read notes/shopping.md."*
- *"Move notes/draft.md to archive/draft.md."*
- *"Delete notes/old.md."*

Only the tools your permissions allow are offered to the model — and the prompt
it receives names the folder it is confined to and lists what it is not allowed
to do, so it will not promise you something the integration will refuse.

### Where notes go, and what they are called

"Take a note" names the file from what you actually said, so you never have to
invent a filename — *"take a note buy milk and bread"* becomes
`Buy milk and bread.md`. The words are kept as spoken, because that is what
makes a note findable months later; there are no dashes joining them together
and no timestamp in front. A long note is named after its first sentence.

By default a note lands **directly in the folder you scoped the integration
to** — scope it to `Mini Notes` and your notes appear in `Mini Notes/`. Set a
**Notes subfolder** if you would rather keep them nested (for example
`Journal`, giving `Mini Notes/Journal/`).

If that name is already taken the new note gets ` (2)`, ` (3)` and so on, so
dictating the same thing twice never destroys the first note.

Your assistant can also supply a name of its own when the dictated words would
make a poor filename.

### By voice (optional)

Assist can also match sentences directly, without an LLM. Custom sentences
cannot be installed by HACS, so this is a one-time copy. Either:

- call the `s3_files.install_sentences` action from **Developer Tools →
  Actions**, or
- run `scripts/install_custom_sentences.sh /path/to/config`

Then reload the conversation agent (`conversation.reload`) or restart Home
Assistant.

Sentences cover the phrases that work well out loud — dictating a note,
listing, reading, deleting, moving, creating a folder:

- *"Take a note buy milk and bread"*
- *"Remember that the wifi password is hunter2"*
- *"List my files in notes"*
- *"Read the file notes/ideas.md"*
- *"Delete the file notes/ideas.md"*

Note sentences are tried before the bare wildcard ones, so *"take a note called
shopping that buy milk"* names the file `shopping` instead of swallowing the
whole phrase as the note text.

## How paths and scope work

- Paths are always relative to your configured folder. A leading `/` or a
  trailing `/` is ignored, `.` and `..` are resolved, and backslashes are
  treated as separators.
- `..` may not climb above the folder: `../secrets.md` is refused.
- A sibling folder that merely shares a name prefix is **not** reachable —
  a `notes` scope cannot see `notes-backup/`.
- Listings return paths relative to the folder, so they round-trip.
- Empty folders need a marker object to be visible in S3. That is what
  `create_folder` writes.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "The endpoint rejected the access key or secret" | Wrong credentials, or the key belongs to a different endpoint. |
| "The S3 credentials are not allowed to …" | The bucket policy does not allow that action for this key. |
| "That bucket does not exist on the S3 endpoint" | Typo in the bucket name, or the wrong region. |
| "Could not reach the S3 endpoint" | Wrong endpoint URL, DNS, or a firewall between Home Assistant and the server. |
| A folder is missing from a listing | S3 has no folders; an empty one needs a marker. Use `create_folder`. |
| The assistant says it cannot manage files | The relevant permission is off, so the tool is not registered. Check **Configure**. |

If you open an issue, include the diagnostics download from the integration
page. The secret is redacted automatically.

## Security notes

- Credentials live in the config entry, are redacted from diagnostics, and are
  shown in the UI as a password field.
- The folder scope is enforced on every call, including calls that arrive from
  a stale automation or an LLM tool object that outlived a settings change.
- Delete and move are off by default.
- `read_file` is capped by **Maximum bytes per read** (default 256 KiB) and
  `list_files` by **Maximum entries per listing** (default 100), so one call
  cannot flood an assistant's context.
- Grant the bucket credentials only the permissions you actually need. The
  integration's switches are a second line of defence, not a replacement for a
  scoped IAM policy.

## Why boto3 is not pinned exactly

The manifest declares `boto3>=1.34,<2.0` instead of a single version.

Home Assistant installs every integration's Python requirements into one shared
environment. If two custom integrations pin *different exact* versions of the
same library, whichever installs last wins and the other one is left with a
version it did not ask for — a confusing failure that has nothing to do with
either integration's code. A range lets pip pick one version that satisfies
both.

An exact pin would normally be the more reproducible choice, and it is what
most integrations do. It is safe to loosen here because:

- Home Assistant itself does **not** ship boto3, so there is no risk of
  fighting the platform's own dependency — only of colliding with another
  custom integration;
- the S3 calls this integration makes (`head_bucket`, `list_objects_v2` with a
  paginator, `get_object`, `put_object`, `copy_object`, `delete_object`) have
  been stable for many years;
- the `<2.0` bound still stops a future breaking major from being pulled in
  without anyone noticing.

`tests/test_manifest.py` fails if the requirement is changed back to an exact
pin, so the reasoning above is not just a comment someone can forget.

## Development

```bash
scripts/dev_setup.sh
.venv/bin/python -m pytest
.venv/bin/python -m pyflakes custom_components/s3_files tests
```

The S3 layer is tested against [moto](https://github.com/getmoto/moto), which
intercepts botocore at the HTTP layer, so the real boto3 code path is exercised
without a live bucket.

CI runs on Python 3.12 and 3.13. On 3.12 pip resolves an older Home Assistant
that has no LLM tool helpers, so the LLM tool tests skip there; they run in
full on 3.13.

Brand assets are generated from `assets/brand-source.jpeg` by
`scripts/make_brand_assets.py`, which writes both `brands/` (what HACS reads)
and `custom_components/s3_files/brand/` (what newer Home Assistant versions
read). Replace the source file and re-run the script to update them.

## Credits

The repository structure and conventions follow
[ha-reminders](https://github.com/ksmarty/ha-reminders).

## Licence

MIT — see [LICENSE](LICENSE).
