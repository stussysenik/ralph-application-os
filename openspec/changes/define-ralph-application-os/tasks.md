## 1. Foundation

- [ ] 1.1 Create the canonical project context in `openspec/project.md`
- [ ] 1.2 Define the benchmark corpus for Notion-like, Linear-like, and Ramp-like anchor systems
- [ ] 1.3 Define the first startup-style agent roster and artifact ownership model
- [ ] 1.4 Add a repository skeleton for `kernel`, `compiler`, `research`, `runtime`, and `harness`

## 2. Semantic Kernel (spec: semantic-kernel)

- [ ] 2.1 Define IR types for concept, entity, attribute, relation, statechart, action, policy, view, effect, and provenance
- [ ] 2.2 Define diff, merge, and version semantics for kernel documents
- [ ] 2.3 Define open-question and confidence annotations for inferred concepts
- [ ] 2.4 Create sample kernels for the three anchor benchmark apps

## 3. Ralph Autoresearch Loop (spec: autoresearch-loop)

- [ ] 3.1 Define artifact ingestion contracts for prompt, repo, schema, screenshot, doc, and trace inputs
- [ ] 3.2 Define concept extraction output format with citations and provenance
- [ ] 3.3 Define correction harvesting rules and concept-library update mechanics
- [ ] 3.4 Define escalation rules for targeted follow-up questions when ambiguity remains high

## 4. Compiler (spec: app-compiler)

- [ ] 4.1 Define deterministic compile passes from kernel to schema, functions, policies, workflows, and views
- [ ] 4.2 Define migration-plan output for kernel changes
- [ ] 4.3 Define target configuration format for Convex and PostgreSQL adapters
- [ ] 4.4 Compile the first benchmark app end-to-end into a runnable backend artifact set

## 5. Runtime Adapters (spec: runtime-adapters)

- [ ] 5.1 Define privileged control-plane boundaries for connectors, secrets, migrations, and deployment actions
- [ ] 5.2 Implement a Convex adapter contract for data, functions, and reactive queries
- [ ] 5.3 Implement a PostgreSQL adapter contract for schema and workflow execution
- [ ] 5.4 Implement a DuckDB replay adapter for traces, scoring, and offline analysis
- [ ] 5.5 Define the interactive web-surface adapter for forms, tables, dashboards, and inspectors

## 6. Verification Harness (spec: verification-harness)

- [ ] 6.1 Define golden replay inputs and expected outputs for the benchmark corpus
- [ ] 6.2 Define invariant checks for policies, state transitions, and derived views
- [ ] 6.3 Define browser verification flows and API probes for compiled apps
- [ ] 6.4 Define scoring thresholds that gate promotion of generated systems
- [ ] 6.5 Add regression capture for failed generations and human fixes

## 7. Startup Agent Team (spec: startup-agent-team)

- [ ] 7.1 Define roles, tool boundaries, and success criteria for product, kernel, compiler, runtime, rendering, verification, and release agents
- [ ] 7.2 Define the shared memory model each agent reads from and writes to
- [ ] 7.3 Define handoff contracts between research, design, implementation, and proof agents
- [ ] 7.4 Define human approval gates for privileged actions and architectural decisions

## 8. First Demonstration

- [ ] 8.1 Generate the Notion-like benchmark from a natural-language brief and inspect the kernel
- [ ] 8.2 Generate the Linear-like benchmark and prove workflow integrity through harness checks
- [ ] 8.3 Generate the Ramp-like benchmark and prove policy threshold changes compile into safe diffs
- [ ] 8.4 Measure improvement after at least three human corrections per benchmark
