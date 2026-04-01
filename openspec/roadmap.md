# Ralph Roadmap

This roadmap is the current phased view after `v1.12.0`.

It is not a promise that every phase will land unchanged. It is the current
best ordering for closing the gap between a strong semantic ideation tool and
the long-term application-OS thesis.

## Phase 1: Runtime Edit Harvest

Goal:
- turn accepted edits in the local interactive runtime back into semantic patches and correction memory

Why now:
- runtime editing exists, but accepted runtime edits do not yet feed Ralph's learning loop

Likely change slug:
- `add-runtime-edit-harvest`

Acceptance criteria:
- runtime package exports typed edit events for create, update, and link actions
- exported edits compile into `SemanticPatch` plus `correction-memory.json`
- applying the patch to the source model yields a passing diff and proof
- at least one benchmark round-trips `runtime edit -> patch -> corrected model -> proof`

## Phase 2: Editable Tracked Model Store

Goal:
- move from generated model snapshots to versioned tracked semantic assets with revisions and branches

Why now:
- promoted models are now important enough to deserve first-class tracked history

Likely change slug:
- `add-editable-model-store`

Acceptance criteria:
- promoted models get stable IDs and revision history
- patches and merges target tracked model revisions instead of loose JSON files
- correction memory can attach to a specific model revision
- one benchmark completes `promote -> branch -> patch -> merge -> prove -> repromote`

## Phase 3: Browser Studio Review Surface

Goal:
- add the first browser-native studio for models, proofs, diffs, merges, and runtime history

Why now:
- the CLI and runtime artifact surfaces are now rich enough to back a minimal studio

Likely change slug:
- `add-browser-studio-review`

Acceptance criteria:
- studio loads a tracked model and renders semantic graph, blueprint, proof, and provenance
- studio loads diff/patch/merge artifacts and shows conflicts clearly
- operator can approve or reject a semantic change from the UI
- one browser test covers loading a model and accepting a semantic change

## Phase 4: Corpus-Wide Proof Matrix

Goal:
- require replay, mutation, and runtime smoke proofs across every benchmark family and capability tier

Why now:
- executable breadth must stay behind proven corpus breadth, not ahead of it

Likely change slug:
- `expand-benchmark-proof-matrix`

Acceptance criteria:
- every benchmark family has replay tests and mutation-resistance checks
- runtime smoke tests exist for every Tier A family
- CI reports proof status by family and fails on regressions
- capability manifests include proof coverage and unsupported gaps

## Phase 5: Durable Control Plane

Goal:
- evolve the thin bash loop into a resumable supervised control plane

Why now:
- this only becomes worth it after runtime edit harvest, tracked model revisions, and broader proof pressure exist

Likely change slug:
- `add-durable-control-plane`

Acceptance criteria:
- queued jobs persist stage state and can resume after restart
- team runs survive interruption without losing artifacts
- ledger records retries, recoveries, and promotion decisions durably
- existing CLI entrypoints can target one-shot local execution or the supervised control plane
