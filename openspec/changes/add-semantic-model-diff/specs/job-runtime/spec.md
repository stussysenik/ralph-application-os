## ADDED Requirements

### Requirement: Ralph persists semantic model diff artifacts
The system SHALL persist machine-readable diff artifacts when the operator compares two semantic models.

#### Scenario: Compare a tracked model to a benchmark job
- **WHEN** the operator runs the model diff command against a tracked model and a job file
- **THEN** the runtime SHALL write normalized left and right world models, a semantic diff artifact, and a report
- **AND** those artifacts SHALL live under `artifacts/ralph/model-diffs/`

