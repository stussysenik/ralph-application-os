## Why

The repo already proves a miniature semantic loop, but the Ralph job runner still behaves more like a demo than a durable operator harness.

Two gaps matter most:

- tracked job files are not validated against tracked contracts before execution
- completed runs do not yet leave behind enough structured state for replay, comparison, or audit

If Ralph is going to act like a real control plane, it needs to consume tracked workflow metadata, reject malformed jobs early, and persist machine-readable run outputs.

## What Changes

- add a job-runtime capability for durable local execution
- validate tracked Ralph job files before stage execution
- drive stage order and role assignment from tracked workflow metadata
- persist per-run manifests, full run records, and hypertime ledger entries

## Impact

- makes the local Ralph loop reusable instead of console-only
- keeps oh-my-codex style prompts and skills anchored to tracked repo contracts
- improves trust, replay, and observability for iterative application-building runs
