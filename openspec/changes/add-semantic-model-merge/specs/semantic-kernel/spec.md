## MODIFIED Requirements

### Requirement: Human-editable and diffable kernel
The semantic kernel SHALL be stored as explicit structured data that is human-editable, versionable, diffable, and mergeable.

#### Scenario: Operator merges two compatible semantic branches
- **GIVEN** a shared base world model and two derived semantic branches
- **WHEN** Ralph computes a semantic merge
- **THEN** it SHALL derive canonical semantic patches from the base to each branch
- **AND** it SHALL auto-merge non-overlapping semantic changes
- **AND** it SHALL emit typed semantic conflicts when overlapping changes cannot be merged safely
