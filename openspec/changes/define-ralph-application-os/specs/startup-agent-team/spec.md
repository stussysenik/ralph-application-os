## ADDED Requirements

### Requirement: Technical agents have named roles and scoped tools
The system SHALL define named technical agents with explicit responsibilities, function-call boundaries, and output artifacts.

#### Scenario: Run a research sprint
- **WHEN** the user asks the system to research a new application domain
- **THEN** the research-oriented agents SHALL gather evidence and propose concepts
- **AND** implementation-oriented agents SHALL not mutate runtime artifacts until research outputs are reviewed

### Requirement: Agents share a common semantic memory
All agents SHALL read from and write to a shared semantic memory rooted in the canonical kernel, concept library, and benchmark corpus.

#### Scenario: Compiler engineer consumes research output
- **WHEN** the semantic architect confirms a new concept pattern
- **THEN** the compiler engineer SHALL be able to consume that pattern from shared memory without re-deriving it from raw prompts

### Requirement: High-risk actions require approval and proof
The agent team SHALL require explicit proof and human approval for privileged actions such as migrations, deployments, connector grants, and architectural resets.

#### Scenario: Proposed breaking migration
- **WHEN** an agent proposes a migration that changes existing policy behavior
- **THEN** the system SHALL require review of the migration plan and proof artifacts
- **AND** it SHALL not execute the action automatically
