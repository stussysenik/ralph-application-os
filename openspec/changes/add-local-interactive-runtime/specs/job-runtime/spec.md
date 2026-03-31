## MODIFIED Requirements

### Requirement: Ralph persists executable runtime package artifacts
The system SHALL persist the first executable substrate artifact as an interactive local runtime package.

#### Scenario: Build an interactive runtime package from a tracked model
- **WHEN** the operator runs the runtime artifact command against a benchmark, tracked model, job file, or draft directory
- **THEN** the runtime SHALL write deterministic seed data and a generated runtime script in addition to the semantic plans
- **AND** the generated package SHALL persist local state in browser storage when opened
- **AND** those artifacts SHALL live under `artifacts/ralph/runtime-packages/`
