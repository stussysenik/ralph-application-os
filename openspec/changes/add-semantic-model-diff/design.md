## Context

Ralph already has deterministic serialization and tracked model persistence. That provides the minimum substrate for semantic diffing, but the operator experience still lacks a canonical comparison tool.

## Goals / Non-Goals

**Goals**
- canonicalize both inputs before diffing
- report stable add/remove/change paths across the semantic kernel
- support model inputs from benchmark names, tracked JSON models, draft artifact directories, and job files
- persist diff artifacts for later review

**Non-Goals**
- semantic patch application
- interactive merge resolution
- browser-native diff UI

## Decisions

### Decision 1: Diff paths should be stable and semantic

The path contract matters more than display polish. Paths like `entities.Invoice.attributes.amount.type` are better than raw line diffs because later patch and merge layers can target them directly.

### Decision 2: Diffing should accept operator-facing inputs, not only kernel files

The CLI should understand benchmark names and job files so the operator can compare “what we intended” to “what the system promoted” without extra preprocessing.

### Decision 3: Diff reports are durable artifacts

Model diffs should write `left.json`, `right.json`, `diff.json`, and `report.md` so promotion and review workflows can inspect the exact semantic comparison later.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Diff paths become unstable | High | diff canonicalized models only and keep tests around path expectations |
| Reports become noisy | Medium | start at semantic section granularity and only drill into fields where it helps |
| Operators over-trust diff output | Medium | keep validation and proof as separate required steps |
