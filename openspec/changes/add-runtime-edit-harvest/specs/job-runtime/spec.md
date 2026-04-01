## MODIFIED Requirements

### Requirement: Ralph operator commands remain usable during rapid iteration
The system SHALL keep common operator commands fast enough for repeated local use
so the control plane does not dominate semantic iteration time.

#### Scenario: Re-run a common local operator command
- **WHEN** an operator runs a common Ralph CLI command after the workspace has already been built once
- **THEN** the command SHALL use the normal incremental build path rather than a forced full rebuild
- **AND** Ralph SHALL retain a separate explicit path for clean forced rebuilds when needed

## ADDED Requirements

### Requirement: Interactive runtime usage can re-enter the semantic loop
The system SHALL let operators export accepted local runtime activity and replay
that activity back into proofed semantic artifacts.

#### Scenario: Harvest runtime edits into semantic artifacts
- **WHEN** an operator exports a runtime edit log from a generated local runtime package
- **THEN** Ralph SHALL compile the exported edits into a `SemanticPatchDocument`
- **AND** Ralph SHALL write correction-memory artifacts from the exercised semantics
- **AND** applying the patch to the source model SHALL preserve proof validity
