## ADDED Requirements

### Requirement: Ralph validates tracked job files before execution
The system SHALL validate tracked Ralph job files before execution and reject malformed jobs with a clear error.

#### Scenario: Missing semantic source
- **WHEN** a job file omits both `benchmarkName` and `worldModel`
- **THEN** the runtime SHALL reject the job before stage execution
- **AND** it SHALL explain that at least one semantic source is required

### Requirement: Ralph execution follows tracked workflow and role metadata
The system SHALL execute Ralph stages in the order declared by tracked workflow metadata and assign each stage to a role allowed by tracked swarm role bindings.

#### Scenario: Default workflow execution
- **WHEN** the operator runs the default Ralph workflow
- **THEN** the runtime SHALL execute `research`, `model`, `build`, `prove`, and `promote` in that order
- **AND** each stage SHALL record the role that claimed it

### Requirement: Ralph persists durable run artifacts
The system SHALL persist machine-readable run outputs for each execution.

#### Scenario: Successful local run
- **WHEN** a valid Ralph job completes
- **THEN** the runtime SHALL write per-stage artifacts and a compact run manifest
- **AND** it SHALL append a new entry to the hypertime ledger for later comparison and replay
