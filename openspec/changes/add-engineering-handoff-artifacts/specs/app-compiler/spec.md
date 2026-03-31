## MODIFIED Requirements

### Requirement: Ralph persists draft synthesis artifacts
The system SHALL persist an engineering handoff artifact alongside draft synthesis outputs.

#### Scenario: Produce a draft for a recommendation-heavy product
- **WHEN** the operator runs draft synthesis on an answered interview
- **THEN** Ralph SHALL write `engineering-handoff.md` under the draft artifact directory
- **AND** the handoff SHALL include implementation order, runtime surface guidance, proof obligations, and product improvement opportunities grounded in the semantic model
