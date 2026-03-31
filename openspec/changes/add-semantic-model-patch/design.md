## Context

The repo now supports prompt intake, draft synthesis, promotion, and semantic diffing. The next missing capability is controlled mutation of tracked models.

## Goals / Non-Goals

**Goals**
- apply typed semantic patch operations against the canonical world model
- validate patched models before returning them
- rerun proof after a patch is applied
- persist model-patch artifacts for review and replay

**Non-Goals**
- concurrent merge resolution
- browser-native patch editing
- automatic patch synthesis from every diff

## Decisions

### Decision 1: Patch operations stay small and explicit

The first patch contract is `add`, `set`, and `remove`. That is enough to cover semantic edits without inventing a more complex mutation language too early.

### Decision 2: Patching validates the resulting model

Patch application must fail if the resulting semantic model no longer validates. Silent mutation would undermine the whole point of a semantic source of truth.

### Decision 3: Patch runs rerun proof immediately

The operator needs to know whether a syntactically valid semantic edit still preserves the current proof regime, so the CLI should persist proof alongside the patch result.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Patch path coverage is incomplete | Medium | start with the paths emitted by current diffs and grow by test pressure |
| Operators misuse string paths for awkward keys | Medium | support explicit array path segments in the patch format |
| Validation is weaker than full schema enforcement | Medium | keep validation and proof both in the patch loop |
