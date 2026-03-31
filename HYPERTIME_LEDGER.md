# Hypertime Ledger

This file tracks the evolving branches of the idea space.

The point is not to predict the future perfectly. The point is to preserve:

- what we believe now
- what evidence supports it
- which branches were rejected
- which future events would justify a pivot

## Generated Snapshot

<!-- generated:ledger-snapshot:start -->
- tracked generated models now exist: yes
- tracked generated jobs now exist: yes
- current irreversible move under test: draft capability gating before job generation
- latest capability contract artifact: artifacts/ralph/drafts/<run-id>/capability.json
<!-- generated:ledger-snapshot:end -->

## Current Branch

### Active Thesis

Ralph Application OS is a semantic software platform that turns intent into a world model, materializes software through internal builders, and proves revisions before promotion.

### Current Proof

- benchmark fixtures exist for four application families
- the semantic kernel serializes deterministically
- internal builders produce inspectable blueprints
- proof harness validates structural and benchmark-specific invariants
- the CLI demo shows the loop in miniature
- the local swarm harness emits typed stage artifacts and promotion decisions
- validated Ralph job files now persist run manifests and batch team summaries
- loop runs now emit `report.md`, full run records, and JSONL ledger entries alongside machine artifacts
- draft runs now emit capability manifests before promotion
- safe drafts can now become tracked models and generated tracked jobs automatically

### Current Limits

- no executable substrate yet
- no browser studio yet
- no long-lived orchestration runtime yet
- no semantic diff/merge engine yet

## Rejected Branches

### Rejected For Now: database-first product

Reason:
- it would optimize storage before semantics
- it would make the moat look infrastructural instead of semantic

### Rejected For Now: universal-software claim in v1

Reason:
- the benchmark corpus is still narrow
- proof regimes differ too much across software classes

### Rejected For Now: polyglot implementation from day one

Reason:
- too much surface area
- too little proof pressure

## Conditional Future Branches

### Branch: Elixir control plane

Take this branch if:
- the bash loop becomes long-lived
- process supervision becomes a repeated pain
- fault tolerance matters more than toolchain simplicity

### Branch: Common Lisp semantics lab

Take this branch if:
- kernel evolution becomes too awkward in TypeScript
- macro and symbolic experimentation become the main bottleneck

### Branch: Zig or Rust substrate runtime

Take this branch if:
- performance-sensitive builders emerge
- invalidation or execution kernels become dominant complexity
- proof requires tighter control over low-level runtime behavior

### Branch: Julia evidence engine

Take this branch if:
- proof shifts toward numerical methods, optimization, or simulation-heavy scoring
- benchmark evidence becomes more mathematical than symbolic
- Python notebooks and scripts stop being adequate for verification velocity

## Next Irreversible Moves

1. Add kernel diff and merge semantics
2. Add benchmark replay and mutation tests
3. Turn blueprints into executable artifacts
4. Add a minimal studio for inspecting model, blueprint, proof, and ledger history together
