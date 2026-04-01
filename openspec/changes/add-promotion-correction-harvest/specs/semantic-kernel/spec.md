## MODIFIED Requirements

### Requirement: Ralph learns from durable semantic corrections
The system SHALL preserve reusable semantic lessons as correction memory so later ideation, draft, and promotion flows can improve without re-learning the same gaps from scratch.

#### Scenario: Harvest from a semantic patch
- **WHEN** an operator applies a semantic patch that changes reusable semantic structure
- **THEN** Ralph SHALL persist harvested correction-memory proposals for the changed semantic areas
- **AND** those proposals SHALL be eligible for explicit promotion into tracked correction memory

#### Scenario: Harvest from an accepted promoted model
- **WHEN** a draft promotion succeeds and the promoted model becomes a tracked asset
- **THEN** Ralph SHALL harvest reusable correction memory from the accepted model's explicit semantic structure
- **AND** Ralph SHALL persist a promotion-local correction-memory artifact
- **AND** Ralph SHALL write tracked harvested correction-memory files so future ideation and draft runs can reuse the accepted lesson
