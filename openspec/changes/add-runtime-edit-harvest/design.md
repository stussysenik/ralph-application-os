## Design

Phase 1 stays conservative. Runtime usage should feed the semantic loop, but the
first implementation should not guess entirely new schema from arbitrary browser
clicks.

### Export Format

The generated runtime package exports a typed JSON log:

- `create`
- `update`
- `link`
- `transition`

Each event includes the entity, record, timestamps, and the minimal semantic
context needed for deterministic replay.

### Harvest Path

The new CLI path:

1. loads a world model
2. loads a runtime edit export
3. validates the export against the model
4. compiles the exercised semantics into a small `SemanticPatchDocument`
5. proves the patched model
6. writes correction-memory artifacts for later reuse

### Patch Strategy

The first patch strategy records runtime evidence as root-level semantic
provenance. That keeps the harvest strict and proof-safe while still turning
accepted runtime behavior into durable input for the semantic loop.

### Lessons Harvested

- `runtime` lessons from create/update activity
- `relation` lessons from link activity
- `workflow` lessons from transition activity
