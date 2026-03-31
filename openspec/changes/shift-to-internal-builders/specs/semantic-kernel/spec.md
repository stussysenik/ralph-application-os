## MODIFIED Requirements

### Requirement: Canonical semantic kernel
The system SHALL represent each application in a canonical semantic kernel that explicitly models concepts, entities, attributes, relations, statecharts, actions, policies, views, effects, provenance, and invariants.

#### Scenario: Normalize a policy-heavy application
- **WHEN** the user describes a spend approval system in natural language
- **THEN** the system SHALL materialize a semantic kernel containing entities such as vendor, invoice, approval, and payment
- **AND** the kernel SHALL encode state transitions, policies, views, and invariants explicitly
- **AND** the kernel SHALL remain independent of any specific runtime implementation
