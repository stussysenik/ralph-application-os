# Releasing

This repo uses `semantic-release`.

## What It Does

- reads conventional commits on `main`
- determines the next version
- updates `CHANGELOG.md`
- writes the release version back to `package.json`
- creates the release commit through the configured git plugin

## Local Checks Before Release

Run these before pushing release-worthy work:

```bash
pnpm docs:sync
pnpm typecheck
pnpm test
pnpm spec:validate
pnpm release:dry
```

## Commit Rules

Use conventional commits so version bumps are inferred correctly:

- `feat:` -> minor
- `fix:` -> patch
- `docs:` -> patch or none depending on analyzer rules
- `refactor:` -> usually patch if user-facing behavior changes
- `chore:` -> usually none

If a change is breaking, use a breaking-change footer or `!`.

Example:

```text
feat!: change Ralph job artifact contract

BREAKING CHANGE: run artifacts now write report.md instead of summary.txt
```

## Current Reality

- release automation is configured
- the repo is still local and uncommitted
- no GitHub remote release has been executed yet

So semantic-release is ready as a workflow, but not yet proven against a real hosted `main` branch.

## Docs Discipline

`README.md`, `PROGRESS.md`, and `HYPERTIME_LEDGER.md` now contain generated sections.

Run `pnpm docs:sync` before release checks so:

- the table of contents stays current
- top-level usage snapshots stay accurate
- the hypertime ledger reflects the current tracked capability state
