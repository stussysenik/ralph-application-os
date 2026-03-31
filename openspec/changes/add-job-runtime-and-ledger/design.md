## Overview

This change adds a thin durable runtime around the current semantic kernel, internal builders, proof harness, and swarm stages.

The goal is not distributed orchestration. The goal is a trustworthy local loop:

1. validate the job
2. load the tracked workflow and role metadata
3. execute stages in the configured order
4. persist machine-readable artifacts and a ledger entry

## Decisions

### Keep runtime configuration in tracked JSON

The repo already contains:

- `.ralph/jobs/job.schema.json`
- `.ralph/workflows/default.json`
- `.ralph/swarm/roles.json`

The runtime should consume those files directly instead of re-declaring their content in code.

### Keep validation local and lightweight

The runtime should enforce the current top-level contract before execution:

- `id` is required
- `prompt` is required
- at least one of `benchmarkName` or `worldModel` is required

The tracked JSON schema remains the repo contract. We do not need heavy validation infrastructure yet.

### Persist artifacts as plain files

Each run should write:

- one JSON file per stage artifact
- `run.json` with the full run record
- `manifest.json` with compact operator metadata
- `report.md` with the formatted human-readable run
- a JSONL entry in `artifacts/ralph/hypertime-ledger.jsonl`

## Consequences

- supervisors can reason about runs without scraping console output
- future compare, replay, and promotion logic has durable local state
- the bash loop remains simple while the semantic loop becomes more inspectable
