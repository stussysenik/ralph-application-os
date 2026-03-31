## ADDED Requirements

### Requirement: Languages are assigned by responsibility
The system SHALL assign implementation languages by responsibility and proof burden rather than by novelty or preference alone.

#### Scenario: Choose the next runtime language
- **WHEN** a new subsystem is introduced
- **THEN** the project SHALL justify the language choice in terms of ownership, runtime needs, and proof obligations
- **AND** it SHALL avoid introducing a new language when the current stack is sufficient

### Requirement: V1 stays implementation-disciplined
The first implementation SHALL stay concentrated in a small number of languages.

#### Scenario: Build the first demo slice
- **WHEN** the project implements the first semantic-kernel-to-blueprint demo
- **THEN** TypeScript SHALL remain the primary implementation language
- **AND** Python MAY support research and eval work
- **AND** Elixir, Common Lisp, Zig, Rails, and RedwoodJS SHALL remain future or reference choices unless a new change proves otherwise
