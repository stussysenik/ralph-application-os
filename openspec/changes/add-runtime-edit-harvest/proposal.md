## Why

Ralph's local runtime package already supports create, update, relation-link, and
workflow actions, but accepted runtime usage still dies inside browser-local
state. That means the prototype surface can demonstrate product behavior without
actually teaching the semantic loop anything new.

## What Changes

- add a typed runtime edit export format for the browser package
- add a runtime harvest command that compiles exported edit logs into a semantic patch
- harvest correction memory from exercised runtime relations, workflows, and editable surfaces
- document the first round-trip from interactive runtime usage back into the semantic loop

## Impact

- accepted runtime behavior becomes reusable semantic evidence instead of disposable demo state
- operators can export runtime edits and turn them into proofed semantic artifacts
- Ralph gets closer to the north-star loop of `build -> use -> correct -> learn`
