## ADDED Requirements

### Requirement: Ralph derives deterministic interview questions from a brief

The system SHALL generate a deterministic set of interview questions from a prompt-first brief before a full semantic job exists.

#### Scenario: prompt-only intake

- **GIVEN** a user provides only a raw prompt
- **WHEN** the interview loop runs
- **THEN** the system SHALL return a small typed set of questions covering semantic structure and delivery constraints

### Requirement: Ralph surfaces unresolved semantic questions

The system SHALL turn unresolved world-model `openQuestions` into interview questions.

#### Scenario: world model contains open questions

- **GIVEN** a tracked job or world model includes unresolved `openQuestions`
- **WHEN** the interview loop runs
- **THEN** those questions SHALL appear in the interview output with high priority

### Requirement: Implementation preferences are optional job constraints

The system SHALL allow optional implementation preferences without making them part of the semantic kernel.

#### Scenario: no language preferences supplied

- **GIVEN** a user has not specified languages or frameworks
- **WHEN** the interview loop runs
- **THEN** the system MAY ask whether hard implementation constraints exist
- **AND** the absence of those preferences SHALL NOT invalidate the semantic brief

#### Scenario: language preferences supplied

- **GIVEN** a user supplies preferred languages or target surfaces
- **WHEN** the job is validated
- **THEN** the runtime SHALL treat them as optional implementation constraints rather than semantic source of truth
