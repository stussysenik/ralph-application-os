## MODIFIED Requirements

### Requirement: Human-editable and diffable kernel
The semantic kernel SHALL be stored as explicit structured data that is human-editable, versionable, diffable, and patchable.

#### Scenario: Apply a semantic correction
- **GIVEN** an operator has a tracked semantic model and a typed patch document
- **WHEN** Ralph applies that patch
- **THEN** the system SHALL mutate the canonical world model through semantic paths rather than line edits
- **AND** it SHALL reject the patch if the resulting model no longer validates

