## Why

Ralph can already produce semantic models, diffs, patches, and merges, but the proof layer still leans too heavily on structural checks and the builder layer still stops short of a runnable package. That leaves a gap between "the model looks coherent" and "the substrate can be exercised."

## What Changes

- add workflow replay and mutation-resistance checks to the proof harness
- add a deterministic static runtime package builder with a browser-openable `index.html`
- expose a CLI command that emits runtime package artifacts from benchmark names, tracked models, jobs, or draft directories
- document runtime package generation as part of the normal operator path

## Impact

- proof becomes harder to satisfy accidentally because disconnected workflows and weak invariants now surface explicitly
- the builder layer now emits the first executable substrate artifact instead of only a prose blueprint
- operators can inspect a real package boundary before a deeper interactive runtime exists
