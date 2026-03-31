# Ralph Workspace

Tracked source of truth lives here.

## Tracked

- `corrections/`
- `interviews/`
- `jobs/`
- `models/`
- `patches/`
- `workflows/`
- `swarm/`

## Ephemeral

Runtime outputs do **not** live here.

They go to:

- `artifacts/ralph/ideation/<run-id>/`
- `artifacts/ralph/interviews/<run-id>/`
- `artifacts/ralph/drafts/<run-id>/`
- `artifacts/ralph/promotions/<run-id>/`
- `artifacts/ralph/model-diffs/<run-id>/`
- `artifacts/ralph/model-patches/<run-id>/`
- `artifacts/ralph/model-merges/<run-id>/`
- `artifacts/ralph/runtime-packages/<run-id>/`
- `artifacts/ralph/runs/<run-id>/`
- `artifacts/ralph/hypertime-ledger.jsonl`

## Current Shape

- jobs are JSON files for machine readability
- workflows define stage order and expected artifacts
- swarm roles define which stage each role can claim
- the job schema defines the tracked contract the runtime validates before execution
- ideation runs classify software category, execution depth, and next proof obligations before the interview loop starts
- interview runs derive clarification questions before a full job loop is necessary
- draft runs synthesize a first semantic model from answered interviews
- promotion runs write tracked models first and only generate tracked jobs when the draft is tier A and proof-clean
- patch examples capture durable semantic corrections that can be replayed against tracked models
- correction memories capture reusable semantic lessons that should influence future ideation and draft runs
- model merge runs compare diverged semantic branches against a shared base and preserve typed conflicts when auto-merge is unsafe
- runtime package runs emit an interactive browser-openable local runtime from a world model
- `pnpm ralph:team` walks these tracked jobs and emits a batch summary under `artifacts/ralph/teams/`
