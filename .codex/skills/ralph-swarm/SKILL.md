---
name: ralph-swarm
description: Run and inspect the Ralph semantic swarm. Use when working on loop orchestration, agent contracts, promotion logic, or function-call artifacts.
license: MIT
compatibility: Requires pnpm and the local ralph-application-os workspace.
---

The Ralph swarm is the current control-plane seed for the product.

## Read first

- `README.md`
- `ARCHITECTURE.md`
- `PLATFORM.md`
- `docs/AGENT_ROSTER.md`
- `docs/FUNCTION_CALL_CONTRACTS.md`

## Main commands

```bash
pnpm typecheck
pnpm test
pnpm spec:validate
pnpm swarm:demo
```

## Rules

- Keep stage artifacts typed and inspectable.
- Promotion must be gated by proof.
- Prefer adding contracts and tests before adding orchestration complexity.
- Do not add a heavier runtime unless the swarm harness proves the need.
