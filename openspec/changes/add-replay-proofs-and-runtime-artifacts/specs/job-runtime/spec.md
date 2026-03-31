## ADDED Requirements

### Requirement: Ralph persists executable runtime package artifacts
The system SHALL persist the first executable substrate artifact as a deterministic static runtime package.

#### Scenario: Build a runtime package from a tracked model
- **WHEN** the operator runs the runtime artifact command against a benchmark, tracked model, job file, or draft directory
- **THEN** the runtime SHALL write the world model, blueprint, proof, runtime manifest, schema, workflow, policy, and view plans
- **AND** it SHALL also write a browser-openable `index.html`
- **AND** those artifacts SHALL live under `artifacts/ralph/runtime-packages/`
