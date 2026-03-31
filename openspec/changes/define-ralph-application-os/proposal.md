## Why

Current AI builders are good at generating first drafts, but weak at building durable systems that understand semantics, prove behavior, and improve from correction. The opportunity is to build an application OS whose core unit is not a table or a prompt, but a compact semantic model that can be researched, compiled, verified, and evolved across many kinds of full-stack software.

## What Changes

- Define Ralph Application OS as a semantic application platform centered on a canonical intermediate representation instead of a custom database kernel
- Add an autoresearch loop that ingests prompts, repos, screenshots, schemas, docs, and human corrections into a shared concept library with provenance
- Add a deterministic compiler that lowers the semantic kernel into runtime outputs such as schema, functions, policies, workflows, views, agent tools, and migration plans
- Add runtime adapters for transactional, analytical, and interactive execution targets, starting with Convex, PostgreSQL, DuckDB, and generated web surfaces
- Add a verification harness that replays benchmark apps, runs browser and API checks, enforces invariants, and scores generated systems before promotion
- Add a startup-style technical agent team with function-call boundaries, shared memory, and artifact contracts for research, design, implementation, and proof
- **BREAKING** Reject the "build a new database first" direction for v1 and treat storage engines as replaceable backends behind the semantic kernel

## Capabilities

### New Capabilities
- `semantic-kernel`: Canonical IR for concepts, entities, relations, statecharts, policies, views, effects, and provenance
- `autoresearch-loop`: Artifact ingestion, concept extraction, question generation, and correction harvesting
- `app-compiler`: Deterministic lowering from semantic kernel to application runtimes and diffs
- `runtime-adapters`: Target-specific execution backends for OLTP, analytics, and interactive web surfaces
- `verification-harness`: Replay corpus, invariant enforcement, browser/API proof, and regression scoring
- `startup-agent-team`: Technical agent organization with scoped tools, shared context, and artifact contracts

### Modified Capabilities
- None. This is a greenfield OpenSpec project.

## Impact

- Adds a new OpenSpec project context and greenfield capability set for a semantic application OS
- Establishes the first architecture boundaries for compiler, runtime adapters, agent orchestration, and verification
- Commits the project to a staged stack: TypeScript + Python for modeling and research, Convex/PostgreSQL for runtime, DuckDB for analysis, and generated web apps for the first execution surface
- Narrows scope away from custom storage engines, custom web engines, and arbitrary software generation in v1
