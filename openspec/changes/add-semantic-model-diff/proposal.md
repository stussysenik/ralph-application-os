## Why

Promoted models are now durable tracked assets, but operators still lack a semantic way to compare them. Without diffing, every evolution looks like a raw JSON rewrite, which makes review, replay, and future merge semantics harder than they need to be.

## What Changes

- add stable semantic model diffing in the kernel
- expose a CLI command that compares benchmark fixtures, tracked models, draft world models, and job-embedded models
- persist diff artifacts and reports under `artifacts/ralph/model-diffs/`
- document semantic diff as part of the normal operator path

## Impact

- operators can inspect semantic drift before rebuild or promotion
- stable diff paths become the contract for future patch and merge work
- the repo gets closer to editable tracked models instead of opaque generated snapshots
