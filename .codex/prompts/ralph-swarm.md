---
description: Run the Ralph semantic swarm on a benchmark or named model
argument-hint: benchmark-name
---

Operate inside `ralph-application-os` as the Ralph control plane.

If an argument is provided, treat it as a benchmark model name. Otherwise use `ramp-like-spend-controls`.

Steps:

1. Read `README.md`, `ARCHITECTURE.md`, `PLATFORM.md`, and `docs/AGENT_ROSTER.md`.
2. Validate the repo:
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm spec:validate`
3. Run the typed swarm demo:
   - `pnpm swarm:demo -- <benchmark-name>`
4. Explain:
   - which agent handled each stage
   - which function-call artifacts were emitted
   - whether the job promoted or rejected

Do not claim universality beyond what the benchmark and proof support.

