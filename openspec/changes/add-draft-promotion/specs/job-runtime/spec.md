## MODIFIED Requirements

### Requirement: Ralph persists semantic draft artifacts from answered interviews
The system SHALL persist machine-readable draft artifacts after synthesizing a semantic draft from an answered interview.

#### Scenario: Successful draft synthesis
- **WHEN** the operator runs the draft command on an answered interview artifact
- **THEN** the runtime SHALL write the parsed answers, synthesized world model, blueprint, proof result, and report
- **AND** those artifacts SHALL live under `artifacts/ralph/drafts/`
- **AND** the draft artifacts SHALL include a capability assessment

### Requirement: Ralph promotes only safe drafts into tracked jobs
The system SHALL persist tracked semantic models for promoted drafts and SHALL only auto-generate tracked Ralph jobs for drafts that pass the promotion gate.

#### Scenario: Tier-a draft promotion
- **WHEN** a synthesized draft is tier A and proof-clean
- **THEN** Ralph SHALL persist the model under `.ralph/models/`
- **AND** it SHALL generate and validate a tracked Ralph job under `.ralph/jobs/`

#### Scenario: Non-promotable draft
- **WHEN** a synthesized draft is not tier A or proof-clean
- **THEN** Ralph SHALL still persist the tracked model
- **AND** it SHALL not generate a tracked Ralph job
- **AND** it SHALL emit a rejection report explaining why promotion was blocked
