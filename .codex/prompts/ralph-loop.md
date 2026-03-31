---
description: Run one Ralph loop from a tracked job file
argument-hint: path-to-job-json
---

Validate the repo, then run one Ralph loop.

```bash
pnpm typecheck
pnpm test
pnpm spec:validate
pnpm ralph:loop -- <job-path>
```

Explain:

- the stage flow
- the artifacts written
- whether the job promoted or rejected

