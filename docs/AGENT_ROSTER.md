# Agent Roster

## Roles

### researcher

- gathers or selects source evidence
- outputs research artifacts and provenance
- does not mutate substrate artifacts

### semantic-architect

- turns evidence into a semantic world model
- records ambiguities and open questions
- preserves provenance

### builder

- turns the world model into internal blueprints
- does not promote output

### verifier

- runs proof checks over the model and blueprint
- returns pass/fail plus detailed checks

### promoter

- makes the final accept/reject decision
- can only promote when proof passes

## Rule

No single agent should both invent semantics and self-promote them without proof.

