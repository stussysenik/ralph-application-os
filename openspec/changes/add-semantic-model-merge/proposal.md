## Why

Diffing and patching now make semantic drift and correction explicit, but diverged branches still require manual reconciliation. Without a merge layer, Ralph cannot safely combine parallel semantic work or surface structured conflicts for review.

## What Changes

- add kernel-level semantic merge support over canonical world models
- expose a CLI command that merges two semantic branches against a shared base
- persist merge artifacts, merged patch documents, proof results, and typed conflicts under `artifacts/ralph/model-merges/`
- document semantic merge as part of the operator workflow

## Impact

- operators can reconcile parallel semantic edits without dropping back to raw JSON surgery
- typed conflict artifacts become the contract for future human-guided merge resolution
- the tracked model workflow becomes closer to a real semantic version-control layer
