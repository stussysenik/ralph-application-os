---
name: ralph-loop
description: Run one Ralph loop safely against a tracked job file. Use when working on jobs, artifacts, or promotion flow.
license: MIT
compatibility: Requires the local ralph-application-os workspace.
---

## Commands

```bash
pnpm typecheck
pnpm test
pnpm spec:validate
pnpm ralph:loop -- .ralph/jobs/examples/screenshot-studio.json
```

## Rules

- Promotion must be proof-gated.
- Write artifacts under `artifacts/ralph/runs/`.
- Keep tracked configuration under `.ralph/`.
