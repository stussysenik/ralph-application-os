## Context

Ralph already has three useful control-plane stages:

1. prompt-first interview
2. tracked job execution
3. proof-gated run artifacts

The missing step is semantic draft synthesis. Operators need a deterministic path from answered interview artifacts to a first canonical world model that builders and proofs can consume.

## Goals / Non-Goals

**Goals**
- parse filled interview markdown deterministically
- synthesize a valid first semantic world model from answered records, workflow, permissions, and integrations
- materialize blueprint and proof artifacts from that draft
- preserve unresolved data relationships as explicit open questions

**Non-Goals**
- LLM-driven draft synthesis
- automatic relation inference for every domain
- converting drafts directly into executable runtime artifacts in this change
- pretending the result is production-ready for arbitrary software classes

## Decisions

### Decision 1: Answered interviews remain human-editable markdown

The answer file should stay editable without special tooling. Deterministic parsing is preferable to opaque chat memory.

### Decision 2: Draft synthesis is conservative

The synthesizer should only create structure that the answers justify:

- entities
- attributes
- workflows
- minimal policies
- views
- integrations

If relations or deeper constraints remain unclear, the result should contain open questions instead of guessing.

### Decision 3: Draft runs persist their own artifacts

Draft synthesis should emit:

- `answers.json`
- `world-model.json`
- `blueprint.json`
- `proof.json`
- `report.md`

under `artifacts/ralph/drafts/`.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users assume the first draft is complete | High | keep open questions visible in the report |
| Over-eager synthesis invents incorrect semantics | High | prefer conservative defaults and proof-backed structure |
| Markdown answer format becomes too loose | Medium | document the template and keep tests on representative answers |

## Open Questions

1. When should a draft become a tracked Ralph job automatically?
2. Should draft synthesis eventually parse explicit relation lines from interview answers?
3. How should human corrections feed back into concept memory across drafts?
