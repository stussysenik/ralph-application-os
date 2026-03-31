## MODIFIED Requirements

### Requirement: Ralph emits executable substrate artifacts
Ralph SHALL emit executable substrate artifacts that can be opened and exercised locally for supported benchmark domains.

#### Scenario: Runtime package includes local interaction
- **GIVEN** a supported world model
- **WHEN** Ralph builds a runtime package
- **THEN** it SHALL emit deterministic seed data and a runtime script
- **AND** the generated `index.html` SHALL host a local interactive runtime shell
- **AND** workflow transitions SHALL execute from the semantic workflow plan
