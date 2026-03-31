## MODIFIED Requirements

### Requirement: Every compiled application must be provable against a replay corpus
The system SHALL validate benchmark world models and generated blueprints against benchmark invariants before promotion.

#### Scenario: Replay a benchmark app
- **WHEN** the system builds the Ramp-like benchmark application
- **THEN** it SHALL validate world-model integrity and benchmark invariants
- **AND** it SHALL report pass or fail per expected capability
