## MODIFIED Requirements

### Requirement: Human-editable and diffable kernel
The semantic kernel SHALL be stored as explicit structured data that is human-editable, versionable, and diffable.

#### Scenario: Operator compares two world models
- **GIVEN** two semantic world models that differ by entities, policies, or workflow state
- **WHEN** Ralph computes a semantic diff
- **THEN** it SHALL compare canonicalized kernels instead of raw input ordering
- **AND** it SHALL emit stable semantic paths for added, removed, and changed elements

