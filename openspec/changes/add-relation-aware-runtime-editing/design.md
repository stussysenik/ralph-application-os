## Design

This slice keeps the current runtime package architecture intact:

- static package
- browser-openable entrypoint
- localStorage-backed state
- deterministic generated JavaScript

The change is in capability depth, not in runtime deployment model.

### Runtime Editing

Each generated entity section should expose:

- a create form derived from the semantic schema
- per-record update forms derived from the semantic schema
- relation editors derived from outgoing semantic relations

Workflow status remains controlled by semantic transitions, not direct field editing.

### Relation Semantics

Seed records should include deterministic relation links where possible so the runtime starts with a connected graph. Operators should be able to update those links locally.

### Event History

The event log should capture:

- create
- update
- link
- transition

This keeps runtime activity inspectable and prepares the ground for later accepted-edit harvesting.
