## Context

The repo can now:

1. interview an idea
2. synthesize a semantic draft
3. prove the draft

But it still lacks a governed promotion step into tracked assets. Production flow needs a safe boundary where drafts become tracked models and, when strong enough, tracked jobs.

## Goals / Non-Goals

**Goals**
- classify drafts by current substrate readiness
- persist promoted models under `.ralph/models/`
- auto-generate tracked jobs only for tier-a drafts
- record clear rejection reports for non-promotable drafts

**Non-Goals**
- editable model store UI
- runtime deployment from generated jobs in this change
- eliminating human review for tier-a drafts

## Decisions

### Decision 1: Tracked model persistence always happens

Even rejected promotions should preserve the semantic model as a tracked asset.

### Decision 2: Job generation is gated

Only drafts that are:

- proof-clean
- workflow-capable
- view-capable
- low enough in unresolved semantic ambiguity

should auto-generate tracked jobs.

### Decision 3: Capability tier is part of the artifact contract

Draft artifacts should include capability assessment and promotion recommendation so operators can understand why a draft did or did not advance.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Tier heuristics feel arbitrary | Medium | keep them explicit, persisted, and test-backed |
| Generated jobs drift from models | High | embed the world model and validate against tracked schema immediately |
| Operators assume rejected drafts are useless | Low | always persist tracked models and clear rejection reports |
