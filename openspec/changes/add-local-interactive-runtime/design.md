## Context

Ralph already emits schema, workflow, policy, and view plans plus a browser-openable `index.html`. That established the first executable boundary, but the package still lacked writable local state and action execution.

## Goals / Non-Goals

**Goals**
- seed deterministic records for supported benchmark entities
- execute workflow transitions in the generated browser runtime
- persist local state in browser storage so the package is actually usable
- keep the package file-based and dependency-free

**Non-Goals**
- multi-user sync
- hosted deployment
- full CRUD editing across every entity field
- server-backed storage

## Decisions

### Decision 1: Use deterministic seed data

The runtime package should always open into a known state so tests, demos, and operator reviews remain reproducible.

### Decision 2: Persist locally with browser storage

`localStorage` is enough for the first interactive runtime. It avoids introducing a server dependency while still proving that actions and state transitions work end to end.

### Decision 3: Keep action execution semantic

The generated runtime should execute transitions from the workflow plan, not hard-coded app-specific logic. That keeps the package aligned with the semantic kernel.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Demo packages may look more complete than they are | Medium | keep docs explicit that this is a local runtime, not the final hosted platform |
| Seed data may overfit current benchmark shapes | Medium | keep generation deterministic and expand by benchmark pressure |
| Browser-only persistence may hide server concerns | Low | treat it as a substrate probe, not the production data layer |
