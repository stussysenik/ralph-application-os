## Context

The current interview synthesizer is intentionally conservative, but it was too conservative about relation inference. As a result, drafts for otherwise coherent products still surfaced a generic open question where a usable semantic graph should already exist.

## Goals / Non-Goals

**Goals**
- infer common relation patterns directly from answered interview data
- preserve deterministic behavior
- improve drafts without requiring model-provider dependence
- add coverage for a vision-assisted shopping example

**Non-Goals**
- infer every possible domain relation perfectly
- replace human semantic patching for ambiguous cases
- redesign the relation type system

## Decisions

### Decision 1: Use benchmark-pressure heuristics first

Relation inference should improve because real examples expose patterns. The synthesizer will use explicit deterministic heuristics shaped by benchmark families and tracked ideas rather than trying to infer everything from hidden model behavior.

### Decision 2: Keep open questions only when relation inference truly fails

The system should still surface `relation-map` when it cannot produce a coherent graph, but not when a stable first-pass graph is already available.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Heuristics overfit benchmark names | Medium | keep tests broad and expand only under new product pressure |
| Inferred relations feel too generic | Medium | keep semantic patching available and surface relation diffs clearly |
| More relations may create noisy drafts | Low | prefer a small, coherent graph over exhaustive relation guesses |
