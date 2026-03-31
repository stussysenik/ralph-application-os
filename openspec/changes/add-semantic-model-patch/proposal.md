## Why

Diffing is now in place, but operators still cannot safely apply semantic edits as first-class artifacts. Without a patch layer, every correction still requires hand-editing model JSON outside the Ralph runtime.

## What Changes

- add kernel-level semantic patch application with typed `add`, `set`, and `remove` operations
- add a CLI command that applies a patch document, writes before/after artifacts, and reruns proof
- add tracked example patch documents under `.ralph/patches/examples/`
- document patching as part of the operator workflow

## Impact

- semantic edits become durable, reviewable runtime artifacts
- stable diff paths now have a corresponding mutation layer
- the repo gets closer to editable tracked semantic models rather than one-way generation
