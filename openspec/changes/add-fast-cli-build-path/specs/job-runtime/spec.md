## MODIFIED Requirements

### Requirement: Ralph operator commands remain usable during rapid iteration
The system SHALL keep common operator commands fast enough for repeated local use so the control plane does not dominate semantic iteration time.

#### Scenario: Re-run a common local operator command
- **WHEN** an operator runs a common Ralph CLI command after the workspace has already been built once
- **THEN** the command SHALL use the normal incremental build path rather than a forced full rebuild
- **AND** Ralph SHALL retain a separate explicit path for clean forced rebuilds when needed
