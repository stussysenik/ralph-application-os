# Project Context

## Purpose
Ralph Application OS is a semantic application platform that turns intent, research artifacts, and human corrections into reliable full-stack software. The system's core job is to model domains as a compact semantic kernel, materialize that kernel into software through internal builders, and continuously improve through an autoresearch loop.

## Tech Stack
- **Semantic kernel and builders:** TypeScript (strict mode) for the canonical IR and early deterministic builder passes
- **Research and eval pipeline:** Python for artifact ingestion, extraction, benchmarking, and model-assisted analysis
- **Runtime-critical paths:** Rust when proof and performance justify moving beyond TypeScript
- **Analytics and replay plane:** DuckDB for local analysis, trace inspection, and offline benchmark scoring
- **Interactive surfaces:** React-based studio interfaces with native CSS and optional WebGPU-backed inspectors later
- **Verification:** Playwright, invariant tests, corpus replay, and migration simulation

## Project Conventions

### Code Style
- Model semantics as explicit data, not prompt-only conventions
- Prefer small typed structs and enums over stringly-typed payloads
- Separate privileged control-plane code from untrusted generated app code
- Keep generated output human-editable and diffable

### Architecture Patterns
- Semantic kernel -> internal builders -> verification harness -> harvest loop
- Capability-based execution boundaries inspired by browser multi-process systems
- Deterministic compiler passes before any model-driven regeneration
- Provenance attached to all inferred concepts and generated artifacts
- Languages are introduced by subsystem need, not by aesthetic preference alone

### Testing Strategy
- Golden benchmark corpus spanning Notion-like, Linear-like, and Ramp-like applications
- Browser verification for generated flows
- API and policy invariant tests on every compile
- Regression replay from prompts, schemas, screenshots, and correction history

## Domain Context
- The platform targets the general full-stack application problem through a semantic intermediate representation
- V1 focuses on business systems, workflow software, review workspaces, knowledge systems, and agent-facing control planes
- Rendering, browser-engine, kernel, and GPU concepts inform the runtime model, especially invalidation, scheduling, isolation, and resource ownership

## Important Constraints
- Do not build a new storage engine before the semantic kernel and builders prove durable leverage
- Do not allow freeform generated code to hold privileged capabilities directly
- Do not claim support for arbitrary software categories before the benchmark corpus proves it
- Keep the semantic kernel compact enough to inspect, diff, migrate, and reason about

## External Dependencies
- DuckDB for analytics and replay
- LLM providers for research-time synthesis only, not critical-path reads/writes
- Browser automation and tracing tools for proof and regression detection
