## Context

Ralph Application OS needs a first real artifact that proves the product direction. The smallest meaningful artifact is not a deployment target or a database adapter. It is a benchmark model that can be serialized deterministically, turned into an application blueprint by internal builders, and checked by a proof harness.

At the same time, the stack needs a clearer language policy. The right move is not to jam Common Lisp, Elixir, Zig, Rails, and RedwoodJS into v1. The right move is to assign each technology a precise role and only introduce it when the proof burden justifies it.

## Goals / Non-Goals

**Goals:**
- make internal builders explicit in the architecture
- add a first benchmark demo that can run locally
- document which languages are current, future, or reference-only
- keep the implementation small and testable

**Non-Goals:**
- introducing Elixir, Common Lisp, Zig, Rails, or RedwoodJS into the codebase immediately
- shipping a browser studio in this change
- building a real runtime substrate yet

## Decisions

### Decision 1: First demo is blueprint generation, not deployment

The first demo artifact will be an application blueprint generated from benchmark world models. That blueprint will summarize storage, workflow, policy, and view structures without pretending a full runtime already exists.

### Decision 2: Language strategy is phased

- TypeScript is the implementation language now.
- Python remains the research and evaluation language.
- Elixir is reserved for supervision and fault tolerance once the loop needs a durable process runtime.
- Common Lisp is reserved for symbolic semantics work if the kernel needs a more expressive live environment.
- Rust or Zig are reserved for runtime-critical substrate work.
- Rails and RedwoodJS remain reference grammars only.

### Decision 3: Proof stays ahead of breadth

The proof harness must validate the benchmark models and their blueprints before the repo claims support for broad application classes.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Too much time spent on stack philosophy instead of product | Medium | Tie the change to a runnable demo and tests |
| Overpromising universal software support | High | Keep the benchmark ladder explicit and narrow |
| Polyglot stack complexity grows too early | High | Defer non-TypeScript languages until proof or performance forces them |

## Open Questions

1. When should the control plane graduate from bash to Elixir?
2. What semantic pain would justify a Common Lisp kernel prototype?
3. At what benchmark threshold does a low-level Zig or Rust substrate become worthwhile?
