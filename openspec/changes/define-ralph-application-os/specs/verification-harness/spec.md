## ADDED Requirements

### Requirement: Every compiled application must be provable against a replay corpus
The system SHALL validate compiled applications against benchmark prompts, change requests, and expected outcomes before promotion.

#### Scenario: Replay a benchmark app
- **WHEN** the system compiles the Ramp-like benchmark application
- **THEN** it SHALL replay the benchmark corpus against the generated system
- **AND** it SHALL report pass or fail per expected capability

### Requirement: Policy and workflow invariants must be checked automatically
The harness SHALL verify policy correctness, valid state transitions, and derived-view invariants for each compiled application.

#### Scenario: Invalid transition is introduced
- **WHEN** a generated workflow allows payment before approval
- **THEN** the harness SHALL fail verification
- **AND** the application SHALL not be promoted automatically

### Requirement: Browser and API proof are required for promotion
The harness SHALL execute browser flows and API probes for promoted targets.

#### Scenario: CRUD and approval flows
- **WHEN** the system generates a workflow application
- **THEN** the harness SHALL exercise create, read, update, approval, and rejection flows through browser and API checks
- **AND** promotion SHALL require those checks to pass
