## Context

The repo already has a stable semantic kernel, deterministic serialization, durable diff/patch/merge artifacts, and a proof harness that validates structure plus benchmark invariants. The next missing layer is pressure against disconnected workflow semantics and a concrete runtime artifact that can be opened and inspected directly.

## Goals / Non-Goals

**Goals**
- ensure workflow transitions replay from initial states to reachable terminal states
- ensure benchmark invariants fail under targeted semantic mutations
- emit a deterministic runtime package with machine-readable plans and a static HTML entrypoint
- persist runtime package artifacts under a dedicated artifact directory

**Non-Goals**
- a writable database or multi-user runtime
- browser-native live editing
- a dynamic UI framework or hosted deploy target

## Decisions

### Decision 1: Replay checks stay semantic, not browser-driven

The first replay layer should work directly on the world model so it remains fast, deterministic, and useful inside every proof path.

### Decision 2: Mutation checks target declared invariants

Ralph should prove that its invariant checks fail on deliberate semantic breakage. This keeps the mutation layer aligned with the explicit model contract instead of inventing unrelated fuzzing noise.

### Decision 3: The first runtime package is static by design

An `index.html` plus JSON plans is enough to establish an executable package boundary without prematurely building a dynamic application runtime.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Replay rules are too weak for future domains | Medium | start with workflow-heavy benchmarks and grow by corpus pressure |
| Static packages look more complete than they are | Medium | keep docs explicit that this is the first executable artifact, not the final runtime |
| Mutation checks become coupled to current invariant kinds | Low | add new mutation builders as new invariant kinds appear |
