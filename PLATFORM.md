# Platform

## What The End Platform Is

Ralph Application OS is a semantic software platform that turns intent into a world model and then materializes software from that world model on our own substrate.

The platform has four visible layers:

1. **Prompt and ingestion layer**
2. **Semantic kernel**
3. **Internal builders**
4. **Proof and promotion loop**

## How Users Interact With It

### Prompt-first

The user describes a system in plain language, examples, screenshots, schemas, or existing code.

### Studio-first

The user inspects entities, workflows, permissions, diffs, and proof results directly.

### Spec-first

The user edits requirements, benchmark scenarios, and invariants before changing implementation.

### Operator-first

Agents or humans run the loop, score candidates, and promote safe revisions.

The first implementation of that is a local Ralph swarm harness with typed stages and function-call artifacts. It is a control-plane seed, not the final always-on runtime.

## Ease Target

The interaction goal is:

- **as easy as `v0` or Lovable to start**
- **much deeper to inspect and prove**

That means:

- a prompt gets you moving quickly
- the interview loop clarifies first ambiguities
- the world model is visible
- corrections are semantic, not just textual
- proof gates promotion

## Domain Ladder

### Tier 1

- approvals
- issue tracking
- knowledge systems
- CRM-ish systems
- internal tools
- agent control planes

### Tier 2

- richer backend services
- local-first collaborative systems
- simulation-like interactive tools

### Tier 3

- compilers
- graphics and rendering systems
- protocol-heavy software
- hard real-time and kernel-adjacent software

The platform becomes broader by growing new builder families and proof regimes, not by pretending one generator can solve everything immediately.

## Language Recommendations

### Use now

- TypeScript for kernel, builders, CLI, studio
- Python for research and evaluation

### Introduce when justified

- Elixir for supervision, orchestration, and fault-tolerant multi-run control plane behavior
- Common Lisp for semantics experimentation and macro-heavy symbolic work
- Julia for numerical verification, optimization-heavy scoring, or data-driven proof work that outgrows Python ergonomics
- Rust or Zig for runtime-critical builders and performance-sensitive substrate layers

## Language Declarations

Languages and frameworks are not part of the semantic kernel.

They matter when the user or the environment imposes hard constraints such as:

- delivery surface
- team expertise
- performance profile
- existing integration boundaries
- deployment environment

Until those constraints exist, Ralph should keep them as optional implementation preferences rather than required intake fields.

### Do not make core

- RedwoodJS
- Ruby on Rails

Those are references and inspiration for product feel, conventions, and generated surface design, not the actual substrate.
