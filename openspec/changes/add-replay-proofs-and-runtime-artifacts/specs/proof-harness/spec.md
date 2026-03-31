## MODIFIED Requirements

### Requirement: Proof harness verifies semantic runtime readiness
The proof harness SHALL verify not only structural correctness but also semantic replay and mutation resistance for supported workflow benchmarks.

#### Scenario: Workflow replay reaches a valid terminal path
- **GIVEN** a world model with workflow states and actions
- **WHEN** Ralph runs the proof harness
- **THEN** it SHALL verify that workflow transitions replay from an initial state
- **AND** it SHALL fail when required transitions are disconnected from the reachable state chain

#### Scenario: Invariants resist targeted mutations
- **GIVEN** a world model with declared benchmark invariants
- **WHEN** Ralph runs the proof harness
- **THEN** it SHALL synthesize targeted semantic mutations against those invariants
- **AND** it SHALL confirm that the invariant checks fail on the mutated model
