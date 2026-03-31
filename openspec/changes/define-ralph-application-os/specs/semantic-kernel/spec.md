## ADDED Requirements

### Requirement: Canonical semantic kernel
The system SHALL represent each application in a canonical semantic kernel that explicitly models concepts, entities, attributes, relations, statecharts, actions, policies, views, effects, and provenance.

#### Scenario: Normalize a policy-heavy application
- **WHEN** the user describes a spend approval system in natural language
- **THEN** the system SHALL materialize a semantic kernel containing entities such as vendor, invoice, approval, and payment
- **AND** the kernel SHALL encode state transitions, policies, and views explicitly
- **AND** the kernel SHALL remain independent of any specific database schema

### Requirement: Human-editable and diffable kernel
The semantic kernel SHALL be stored as explicit structured data that is human-editable, versionable, and diffable.

#### Scenario: Human corrects a generated relation
- **WHEN** the system infers that `invoice` belongs directly to `organization`
- **AND** the user corrects it to belong to `vendor`
- **THEN** the correction SHALL be represented as a kernel diff
- **AND** the original inference provenance SHALL remain inspectable

### Requirement: Semantic identity must survive target changes
The kernel SHALL preserve semantic identity independently from storage, UI layout, or runtime target choices.

#### Scenario: Recompile to a different backend
- **WHEN** the same kernel is compiled to Convex and PostgreSQL targets
- **THEN** the application semantics SHALL remain equivalent
- **AND** target-specific details SHALL appear only in adapter outputs
