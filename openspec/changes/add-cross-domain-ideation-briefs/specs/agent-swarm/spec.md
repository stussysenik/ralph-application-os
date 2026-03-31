## MODIFIED Requirements

### Requirement: Ralph derives category-aware interview artifacts from prompt intake
The system SHALL classify prompt intake into a software category before deeper synthesis so Ralph can apply the right proof and execution expectations.

#### Scenario: Ideate a compiler prompt
- **WHEN** the operator runs the ideation command or interview command with a compiler-oriented prompt
- **THEN** Ralph SHALL persist an ideation artifact containing the primary software category and execution mode
- **AND** the ideation artifact set SHALL include a generated architecture outline
- **AND** the generated interview questions SHALL include compiler-specific questions about source, IR, target, and correctness regime

#### Scenario: Ideate a kernel-oriented prompt
- **WHEN** the operator runs the ideation command or interview command with a kernel-oriented prompt
- **THEN** Ralph SHALL classify the prompt as architecture-spec work rather than an interactive runtime path
- **AND** the generated interview questions SHALL include capability, scheduling, or resource-model pressure
