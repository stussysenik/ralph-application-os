## MODIFIED Requirements

### Requirement: Ralph persists ideation artifacts
The system SHALL persist ideation artifacts that help the operator sharpen the product before draft synthesis.

#### Scenario: Apply correction memory during ideation
- **WHEN** the operator runs `ralph:ideate` and repo-local correction memory matches the prompt
- **THEN** Ralph SHALL surface those correction-memory matches in the ideation report
- **AND** Ralph SHALL persist a machine-readable correction-memory artifact for that ideation run

### Requirement: Ralph persists draft synthesis artifacts
The system SHALL persist an engineering handoff artifact alongside draft synthesis outputs.

#### Scenario: Apply correction memory during draft synthesis
- **WHEN** the operator runs draft synthesis and repo-local correction memory matches the prompt or world model
- **THEN** Ralph SHALL persist those matches under the draft artifact directory
- **AND** the engineering handoff SHALL surface the matched correction memory and its recommendations
