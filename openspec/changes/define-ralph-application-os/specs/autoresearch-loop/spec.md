## ADDED Requirements

### Requirement: Ralph ingests heterogeneous artifacts with provenance
The system SHALL ingest prompts, repositories, schemas, screenshots, documents, and traces into a unified research pipeline while preserving provenance for each extracted concept.

#### Scenario: Combine prompt and repository evidence
- **WHEN** the user provides a natural-language brief and an existing code repository
- **THEN** the system SHALL extract candidate concepts from both inputs
- **AND** each concept SHALL record where it came from

### Requirement: Ralph generates targeted follow-up questions
The system SHALL ask narrow follow-up questions when ambiguity prevents safe compilation.

#### Scenario: Missing ownership semantics
- **WHEN** the system cannot determine whether `account` means a customer account or a ledger account
- **THEN** it SHALL surface that ambiguity explicitly
- **AND** it SHALL ask a targeted clarification before promoting the model

### Requirement: Human corrections feed the concept library
The system SHALL harvest human corrections and use them to improve future generations for semantically similar applications.

#### Scenario: Reuse a corrected approval concept
- **WHEN** a user corrects approval thresholds and escalation semantics in one application
- **THEN** the corrected concept SHALL be stored in the concept library
- **AND** similar future applications SHALL prefer that corrected pattern
