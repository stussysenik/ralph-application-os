## Context

Ralph already supports deterministic serialization, semantic diffs, and typed patches. That gives the repo the minimum substrate for model merging, but there is still no first-class way to reconcile two compatible branches or preserve semantic conflicts explicitly.

## Goals / Non-Goals

**Goals**
- derive semantic patches from a shared base to each branch
- auto-merge non-overlapping semantic changes
- persist typed conflicts when paths overlap incompatibly
- rerun proof on the merged model when the merge is conflict-free

**Non-Goals**
- browser-native conflict resolution
- automatic semantic rebasing across more than three inputs
- heuristic conflict resolution that rewrites operator intent silently

## Decisions

### Decision 1: Merge stays conservative

If two branches touch the same semantic path differently, or one edits a parent path while the other edits a nested path, Ralph should stop and preserve a typed conflict instead of inventing a winner.

### Decision 2: Merge is defined in terms of patches

The merge contract is easier to reason about if Ralph first derives canonical patches from `base -> left` and `base -> right`, then merges those patches. That keeps the implementation aligned with the existing diff and patch layers.

### Decision 3: Proof remains a separate gate after merge

An auto-merged model can still violate existing invariants, so conflict-free merge is not enough. Ralph must prove the merged model before presenting it as a safe candidate.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Path-overlap detection is too aggressive | Medium | start conservative and expand only with benchmark pressure |
| Operators assume merge success implies semantic safety | High | rerun proof and persist the proof result beside merge artifacts |
| Merge artifact volume grows quickly | Low | keep artifacts ephemeral under `artifacts/ralph/model-merges/` |
