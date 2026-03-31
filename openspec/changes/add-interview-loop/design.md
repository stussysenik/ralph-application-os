## Context

Ralph needs a stable intake loop between a raw idea and a proof-gated job run. The missing layer is an interview step that asks the smallest number of high-value follow-up questions needed to clarify users, entities, workflows, permissions, interfaces, and implementation constraints.

The system also needs a cleaner policy for languages and frameworks. Those choices matter, but they are not the semantic kernel. They belong in optional implementation preferences that constrain builders later when the user actually cares.

## Goals / Non-Goals

**Goals**
- add deterministic interview question generation from a prompt, job, or world model
- fold world-model `openQuestions` into the operator interview surface
- persist interview artifacts so ideation runs are inspectable like build runs
- record optional implementation preferences without making them mandatory

**Non-Goals**
- prompt-to-model synthesis in this change
- LLM-driven interviewing
- full studio UI for interviews
- mandatory language declarations on every job

## Decisions

### Decision 1: Interview loop is deterministic

The first interview loop should be simple, inspectable, and testable. It will derive questions from:

- missing semantic structure in a prompt-only brief
- unresolved `openQuestions` in a world model
- missing interface/runtime preferences when those constraints matter

### Decision 2: Languages are implementation preferences

The repo should support optional fields like:

- preferred languages
- preferred frameworks
- target surfaces
- non-negotiable implementation constraints

These are not part of the semantic kernel. They are optional planning constraints on jobs.

### Decision 3: Interview runs persist artifacts

Interview runs should write:

- `brief.json`
- `questions.json`
- `report.md`

under `artifacts/ralph/interviews/`.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Interview questions become too generic | Medium | keep them few, typed, and test-backed |
| Language preferences leak into semantics | High | store them only on jobs/briefs, not world models |
| Too many intake modes confuse operators | Medium | expose one clear CLI command and document it |

## Open Questions

1. When should interview answers feed automatic world-model synthesis?
2. Should interview runs eventually become first-class tracked artifacts in `.ralph/`?
3. At what point do we need a browser-native interview studio rather than CLI output?
