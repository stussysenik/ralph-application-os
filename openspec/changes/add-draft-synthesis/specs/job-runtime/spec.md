## ADDED Requirements

### Requirement: Ralph persists semantic draft artifacts from answered interviews
The system SHALL persist machine-readable draft artifacts after synthesizing a semantic draft from an answered interview.

#### Scenario: Successful draft synthesis
- **WHEN** the operator runs the draft command on an answered interview artifact
- **THEN** the runtime SHALL write the parsed answers, synthesized world model, blueprint, proof result, and report
- **AND** those artifacts SHALL live under `artifacts/ralph/drafts/`
