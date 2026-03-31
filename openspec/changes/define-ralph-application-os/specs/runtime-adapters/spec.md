## ADDED Requirements

### Requirement: Semantic kernel and runtime targets remain decoupled
The system SHALL isolate semantic modeling from target-specific runtime implementation details.

#### Scenario: Swap OLTP targets
- **WHEN** the same kernel is compiled to Convex and PostgreSQL adapters
- **THEN** target-specific execution details SHALL remain outside the kernel
- **AND** the kernel SHALL not require target-specific fields to stay valid

### Requirement: Privileged capabilities are brokered by the control plane
The system SHALL route secrets, connector access, migrations, and deployment authority through a privileged control plane rather than generated application code directly.

#### Scenario: Generated app requests a connector
- **WHEN** a generated application needs access to a billing provider
- **THEN** it SHALL request a capability from the control plane
- **AND** the control plane SHALL apply policy before granting constrained access

### Requirement: Interactive targets model invalidation and event routing explicitly
The interactive runtime adapter SHALL track view dependencies, invalidation boundaries, and event routing rather than recomputing the entire application surface for each change.

#### Scenario: Update a single dashboard widget
- **WHEN** one derived metric changes for a dashboard
- **THEN** only dependent views SHALL be invalidated
- **AND** unrelated views SHALL remain stable
