## ADDED Requirements

### Requirement: Ralph persists semantic model merge artifacts
The system SHALL persist machine-readable artifacts when the operator merges semantic branches.

#### Scenario: Merge two tracked semantic branches
- **WHEN** the operator runs the model merge command against a base model and two branch models
- **THEN** the runtime SHALL write normalized base, left, and right world models, derived patch artifacts, a typed conflict artifact, and a report
- **AND** it SHALL additionally write a merged model and proof result when the merge is conflict-free
- **AND** those artifacts SHALL live under `artifacts/ralph/model-merges/`
