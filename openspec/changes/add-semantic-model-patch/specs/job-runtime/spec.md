## ADDED Requirements

### Requirement: Ralph persists semantic model patch artifacts
The system SHALL persist machine-readable artifacts when the operator applies a semantic patch document to a world model.

#### Scenario: Apply a patch to a tracked model
- **WHEN** the operator runs the model patch command against a tracked model and patch document
- **THEN** the runtime SHALL write the original model, patched model, patch document, diff, proof result, and report
- **AND** those artifacts SHALL live under `artifacts/ralph/model-patches/`

