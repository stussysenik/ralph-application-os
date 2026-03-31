## MODIFIED Requirements

### Requirement: Deterministic lowering from kernel to runtime artifacts
The system SHALL lower the same semantic kernel into the same internal blueprint artifact set deterministically.

#### Scenario: Stable recompilation
- **WHEN** the kernel is unchanged
- **THEN** rebuilding the application SHALL produce equivalent storage, workflow, policy, and view blueprint artifacts
