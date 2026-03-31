## ADDED Requirements

### Requirement: Deterministic lowering from kernel to runtime artifacts
The system SHALL lower the same semantic kernel and target configuration into the same runtime artifact set deterministically.

#### Scenario: Stable recompilation
- **WHEN** the kernel and target configuration are unchanged
- **THEN** recompiling the application SHALL produce equivalent schema, policy, workflow, and view artifacts

### Requirement: Compiler outputs full-stack runtime artifacts
The compiler SHALL produce storage schema, indexes, functions, policies, workflows, views, and agent tools for supported targets.

#### Scenario: Compile a workflow system
- **WHEN** the user defines a ticket workflow with states, permissions, and dashboards
- **THEN** the compiler SHALL emit backend data structures, action handlers, authorization rules, and UI-facing view definitions

### Requirement: Kernel changes produce explicit migration plans
The compiler SHALL generate explicit migration plans and impact diffs for semantic changes.

#### Scenario: Change approval thresholds
- **WHEN** the user changes the approval threshold from 5000 to 10000
- **THEN** the compiler SHALL show which policies, workflows, and downstream views change
- **AND** it SHALL present the change as a reviewable migration plan
