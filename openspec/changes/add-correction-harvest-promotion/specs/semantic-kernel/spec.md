## MODIFIED Requirements

### Requirement: Ralph persists correction-memory artifacts
The system SHALL preserve reusable correction-memory artifacts derived from accepted semantic changes.

#### Scenario: Harvest correction memory from a semantic patch
- **WHEN** the operator runs a semantic patch that changes reusable semantic structure
- **THEN** Ralph SHALL persist harvested correction-memory proposals under the patch artifact directory
- **AND** the operator SHALL be able to promote those proposals into the tracked correction library explicitly

#### Scenario: Harvest correction memory from a conflict-free merge
- **WHEN** the operator runs a conflict-free semantic merge with reusable semantic changes
- **THEN** Ralph SHALL persist harvested correction-memory proposals under the merge artifact directory
