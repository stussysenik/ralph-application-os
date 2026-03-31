## MODIFIED Requirements

### Requirement: Ralph persists ideation artifacts
The system SHALL persist ideation artifacts that help the operator sharpen the product before draft synthesis.

#### Scenario: Produce an ideation brief for a broad software prompt
- **WHEN** the operator runs `ralph:ideate`
- **THEN** Ralph SHALL include deterministic improvement opportunities in the ideation brief
- **AND** the rendered report SHALL surface those opportunities as idea-shaping guidance rather than as committed requirements
