# Architecture

## One Sentence

Ralph Application OS is a semantic software foundry that turns intent into a world model, materializes software from that model through internal builders, and proves every revision through a benchmarked verification loop.

## System Shape

```text
intent + artifacts + corrections
  -> semantic kernel
  -> internal builders
  -> generated substrate and product surfaces
  -> proof harness
  -> harvested corrections
  -> semantic kernel
```

## Major Parts

### Universal Intake

Ralph now has a universal ideation front door before it promises execution. The intake layer classifies the software category, declares whether the current result should be an interactive runtime path, a semantic runtime plan, or an architecture-spec output, and then generates category-specific interview pressure.

This is how Ralph can take kernels, compilers, renderers, pipelines, and workflow apps seriously without flattening them into the same shape.

### Semantic Kernel

The semantic kernel is the canonical source of truth. It owns entities, relations, states, actions, constraints, policies, views, effects, and provenance.

### Internal Builders

The internal builders materialize the semantic model into our own substrate.

Planned builder families:

- storage builder
- query and invalidation builder
- workflow builder
- policy builder
- UI and view builder
- agent tool builder
- proof builder

These are **our builders**, not just long-term wrappers around someone else's backend. Borrowed runtimes may help during development, but the end platform owns substrate materialization.

Today the first executable output is an interactive local runtime package:

- `runtime-manifest.json`
- schema, workflow, policy, and view plans
- deterministic `seed-data.json`
- `runtime.js` for local action execution and persistence
- a browser-openable `index.html`

### Proof Harness

The proof harness keeps the system honest. It runs structural validation, workflow replay, mutation resistance for declared invariants, and benchmark-specific behavioral verification.

### Supervisor Loop

The bash loop is not the product. It is the control plane that repeatedly runs the semantic loop, compares results, rolls back failures, and harvests learning.

### Agent Swarm

The first control-plane implementation is a typed swarm:

- researcher
- semantic-architect
- builder
- verifier
- promoter

Each stage emits structured artifacts and function-call records. This keeps the loop inspectable before a heavier orchestration runtime exists.

## Language Strategy

- **TypeScript** is the implementation language now for the kernel, builders, CLI, and studio.
- **Python** remains the research and evaluation language.
- **Elixir** is the best later fit for durable process supervision and fault-tolerant orchestration.
- **Common Lisp** is the best later fit for symbolic semantics and macro-heavy experimentation.
- **Rust or Zig** become relevant when the substrate owns runtime-critical internals.
- **Rails and RedwoodJS** are reference grammars for product feel and conventions, not the core runtime.

## Interaction Modes

- Prompt-first: describe any software idea, receive an ideation brief, then clarify the semantic model
- Studio-first: inspect and edit the world model directly
- Spec-first: define requirements and invariants
- Code-first: edit builders and kernel packages

## Implementation Policy

- Prefer boring, inspectable code.
- Prefer plain data over prompt-only state.
- Keep the kernel compact.
- Treat human correction as training signal and product behavior, not exception handling.
