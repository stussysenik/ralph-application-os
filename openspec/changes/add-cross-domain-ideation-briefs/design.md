## Context

Ralph has reached the point where workflow-heavy software can move from prompt to interview, draft, proof, promotion, and local runtime package. The next gap is broader software ideation: compilers, renderers, browser-engine work, kernels, embedded protocols, and scientific systems need a better intake story than “pretend it is a CRUD app.”

## Goals / Non-Goals

**Goals**
- classify prompts into meaningful software categories deterministically
- declare the current execution depth honestly: interactive runtime, semantic runtime plan, or architecture-spec only
- generate category-specific interview questions that reflect the real proof regime
- persist ideation artifacts in the same durable operator style as the rest of Ralph
- emit a first architecture outline for architecture-heavy categories

**Non-Goals**
- execute every software category on the current Ralph runtime
- add model-provider dependence to category classification
- replace the existing interview or draft flow

## Decisions

### Decision 1: Make ideation explicit and persistent

The repo should treat ideation as a first-class artifact, not an implicit thought process inside the interview command.

### Decision 2: Keep category classification deterministic

Ralph should use inspectable rules and category metadata for this layer so operators can understand why a prompt is being treated as a compiler, a renderer, or a workflow app.

### Decision 3: Separate ideation breadth from execution breadth

Universal intake is now a product goal. Universal execution is not. The ideation brief must tell the operator what Ralph can safely do today.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Category rules drift into brittle keyword matching | Medium | keep the categories explicit, test them, and expand only under benchmark pressure |
| Operators confuse ideation support with runtime support | Medium | surface execution mode clearly in reports and docs |
| Too many category-specific questions overwhelm intake | Low | keep question packs small and prioritize blocking questions only |
