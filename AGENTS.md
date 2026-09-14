---
name: S3 Files
description: Working conventions for the S3 Files repo (HACS integration, LLM tools, permission model)
---

# AGENTS.md

Instructions for agents working in this repository. These conventions come from
earlier working sessions on a sibling project and from building this one — follow
them unless the task explicitly overrides them.

## What this repo is

- **`custom_components/s3_files/`** — the HACS integration: config/options flow,
  the boto3 client, the permission model, the services, the intents, the LLM
  tools, diagnostics.
- **`custom_components/s3_files/custom_sentences/en/s3_files.yaml`** — Assist
  sentence templates. The packaged copy is the **single source of truth**; users
  get it via `s3_files.install_sentences` or `scripts/install_custom_sentences.sh`.
  Do not add a second copy at the repo root — the sibling project has two that
  drifted.
- **`tests/`** — pytest. Pure logic runs without Home Assistant; the rest uses
  `pytest.importorskip` and runs in CI.
- **`scripts/`** — dev setup, the sentence installer, the brand asset generator.

## The two design rules

1. **Permissions gate registration, not just calls.** A switched-off action must
   not exist as a service and must not appear as an LLM tool. `services.py` and
   `intents.py` both skip registration, and both re-check at call time, because
   an entry reload is not instantaneous and an LLM tool object can outlive one.
2. **The folder scope is enforced at the lowest level.** `paths.resolve_key` is
   the only thing that builds bucket keys, and it refuses anything that leaves
   the root. Keys are compared segment by segment so `notes-backup/` is not
   visible through a `notes` scope. Do not add a code path that concatenates a
   prefix and a user path by hand.

## Operating principles

1. **Verify, don't guess.** Reproduce failures against a real runtime before
   fixing. `moto` stands in for S3 and exercises the genuine boto3 code path.
2. **Root-cause discipline.** State the underlying reason with evidence; do not
   ship a workaround that hides it.
3. **Fix + regression test in one commit.** The test must fail before the fix.
4. **Minimal diffs.** No opportunistic refactors or reformatting.
5. **Honest verification.** Say what was actually run and what was not. There is
   no live bucket here, so end-to-end behaviour against a real S3 server is
   *not* verified — moto is not the same as Backblaze.
6. **Git discipline.** No commit/push/tag/release without explicit approval.
7. **Surface plan deviations.** If a spec gets extended (a new field, a changed
   API), say so in the reply.

## Boundaries

### Always

- Run the full local verification before pushing (see Commands).
- After a change, update comments and docstrings that now describe old behaviour.
- Keep `services.yaml`, the voluptuous schemas and `SERVICE_FIELDS` in step —
  `tests/test_services_yaml.py` checks both directions.
- Keep `strings.json` and `translations/en.json` identical.

### Ask first

- Any git mutation, and any GitHub-side metadata change (`gh repo edit`).
- Releasing / version bumps — the user times these.

### Never

- Put a bare Python function inside a config-flow `vol.All(...)`. Home
  Assistant's schema serializer cannot convert it and the flow 500s. Use a
  selector or a standard voluptuous validator. `tests/test_config_flow.py` runs
  the real serializer over the real form so this cannot come back.
- Add unescaped `{...}` to translation values — the frontend compiles every
  value with formatjs and literal braces raise `MISSING_VALUE`. Escape as
  `'{...}'`.
- Override `DataUpdateCoordinator` properties with getter-only versions.
- Add a second hand-maintained copy of the config-flow schema. The config and
  options flows share `_SettingsForm`; keep it that way.
- Let a wildcard sentence swallow a more specific one. In hassil the first
  matching template wins, so `take a note called {name}…` must be listed before
  `take a note[ that] {note}`.
- Log or serialise the secret access key. `tests/test_diagnostics.py` asserts it
  never appears in diagnostics.
- Pin `boto3` to an exact version in `manifest.json`. It is declared as a range
  on purpose: Home Assistant installs all integrations' requirements into one
  shared environment, so two exact pins of the same library leave whichever
  installed last winning. `tests/test_manifest.py` enforces the range, and the
  README explains the reasoning.
- Edit a brand asset by hand. They are generated from
  `assets/brand-source.jpeg`; regenerate both copies with
  `scripts/make_brand_assets.py` (a test checks the two copies match).

## Commands

```bash
# Python tests (pure modules run anywhere; HA-gated tests need homeassistant)
.venv/bin/python -m pytest

# Lint + compile before every push
.venv/bin/python -m pyflakes custom_components/s3_files tests
python3 -m compileall -q custom_components/s3_files

# Regenerate the brand assets from assets/brand-source.jpeg
.venv/bin/python scripts/make_brand_assets.py
```

Verify in **both** Python environments, because pip resolves a different Home
Assistant per version:

- **3.12** → Home Assistant 2025.1.x, which has **no** `NamespacedTool`, so
  `tests/test_llm_tools.py` skips. Everything else must pass.
- **3.13+** → a current Home Assistant with the LLM tool helpers; the LLM tests
  run for real.

If you add a test that depends on a newer Home Assistant API, guard it with
`pytest.importorskip` and make sure the 3.13 job actually exercises it — a test
that silently skips everywhere is worse than no test.

## Testing conventions

- Pure logic (`paths.py`, `permissions.py`) must stay stdlib-only so it tests
  without Home Assistant.
- `tests/conftest.py` provides `FakeHass` (with a service registry and config
  path), `FakeEntry`, `options()` and `run()`. No `pytest-asyncio` dependency —
  async tests call `asyncio.run` inside a sync test.
- Botocore needs credentials even under moto; the `aws_env` fixture in the S3
  test modules sets dummy ones.
- `intent.async_get(hass)` returns **handlers**, not a keyed mapping — build a
  set of `handler.intent_type`.

## CI and release workflow

- `.github/workflows/validate.yaml`: a Python matrix (3.12, 3.13) running
  `compileall`, `pyflakes`, and `pytest` with `homeassistant boto3 moto hassil`
  installed, plus the HACS action on `main` only.
- Keep actions on current majors (Node 24). Check `gh run list` for Node
  deprecation annotations after editing a workflow.
- HACS validation needs brand assets under `custom_components/s3_files/brand/`
  **and** `brands/`, a valid `hacs.json`/`manifest.json`, and a repo description
  plus topics.

Never put backticks in a shell-quoted string (commit messages, `-m`, `--notes`):
bash performs command substitution on them. Write release notes to a file with
the Write tool and use `--notes-file`.

Release steps (after approval):

1. Bump `custom_components/s3_files/manifest.json` `version`.
2. Commit "Bump version to X.Y.Z", wait for green CI on `main`.
3. `git tag -a vX.Y.Z -m "Version X.Y.Z" && git push origin main && git push origin vX.Y.Z`.
4. `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <notes>`.
5. Confirm Validate passes on `main` **and** the tag.

## Repo gotchas (hard-earned)

- **`head_bucket` on a missing bucket** returns a bare 404, not `NoSuchBucket`,
  so `S3FilesError.code` would read `not_found`. `async_check` maps it back to
  `no_bucket`; without that the user gets "nothing to reach the bucket was
  found" for a simple typo.
- **Listing the bucket root** with no configured scope needs an empty key, which
  every file operation must refuse. `resolve_key(..., allow_root=True)` is only
  for listings.
- **A trailing slash on the scope root** must not change the answer:
  `paths._scope` normalises it, or `is_within("notes/a", "notes/")` returns
  False and a valid key looks like an escape.
- **The options flow factory must be a plain callback.** Home Assistant calls
  `async_get_options_flow(config_entry)` and uses whatever it returns directly
  as the flow object, without awaiting it. An `async def` factory returns a
  coroutine, so the next attribute access on it fails and the settings cog
  answers with a 500 — which is exactly what shipped in 0.1.0.
  `tests/test_config_flow.py` pins the contract, and
  `tests/test_config_flow.py::test_the_options_flow_can_build_its_form` drives
  the step for real.
- **Note filenames come from the note itself.** `paths.note_filename` keeps the
  words the user said (no dashes, no timestamp), cuts a long note to its first
  sentence and truncates on a word boundary. Because the timestamp is gone,
  uniqueness is handled at write time: `async_write(..., unique=True)` settles
  on " (2)", " (3)", ... so two identical notes never overwrite each other.
  Never solve a collision by putting a date back in the name.
- **`IntentHandleError` bubbles out** of `intent.async_handle` as an
  `IntentError`; it is not converted into a response. That is the intended
  mechanism — the conversation agent speaks it and an LLM agent relays the
  message to the model — so failures must raise with a readable message rather
  than a traceback string.
- **`boto3` is synchronous.** Every call goes through
  `hass.async_add_executor_job`; the client is built lazily inside that thread.
- **A disabled permission raises `S3PermissionError` in services** but
  `IntentHandleError` in intents, because one is read by a log and the other
  spoken out loud.
