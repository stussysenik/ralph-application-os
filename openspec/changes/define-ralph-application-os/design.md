## Context

The product goal is to solve the general full-stack application problem by turning intent into reliable software, then improving that software through an autoresearch loop. The common thread across the user's prior projects is not one language or database paradigm, but a consistent interest in deep system boundaries: multi-runtime visual editing, Zig and WebGPU rendering, Elixir realtime systems, offline-first knowledge software, terminal-native UX, and agentic research workflows. The design needs to preserve that ambition while cutting scope to the smallest product that can become an application OS.

Several browser and systems-engineering patterns generalize directly:

- Chromium's RenderingNG architecture separates work across processes and threads, with explicit data structures and staged pipelines.
- WebKit's process model isolates untrusted web content and brokers privileged capabilities through the UI process.
- Chromium's compositor architecture keeps an interactive snapshot alive while the main thread is blocked, using separate trees, commits, invalidation, and schedulers.
- WebGPU formalizes content, device, and queue timelines instead of pretending GPU work is a single synchronous stream.

These ideas map well to an application OS: keep semantics in a stable kernel, isolate privileged execution, represent views and derived state explicitly, and treat scheduling and invalidation as first-class rather than accidental.

## Goals / Non-Goals

**Goals:**
- Define a compact semantic kernel that can represent serious full-stack business software
- Build Ralph as a research -> abstraction -> lowering -> proof -> harvest loop
- Compile one semantic model into multiple backends without semantic drift
- Make generated systems inspectable, human-editable, and safe to evolve
- Use an agent team with narrow roles and function-call boundaries instead of one unstructured "super agent"
- Ground v1 in benchmark apps that cover structured knowledge, workflow, and policy-heavy systems

**Non-Goals:**
- Building a custom database engine in v1
- Building a custom browser engine, kernel, or GPU driver
- Claiming support for arbitrary games, CAD tools, or media editors in the first release
- Letting LLMs directly own privileged runtime capabilities
- Hiding the semantic model behind prompt history alone

## Decisions

### Decision 1: The semantic kernel is the product, not the storage engine

**Choice**: Treat the canonical IR as the core asset and compile into existing runtimes first.

**Rationale**: The hard and differentiating problem is modeling semantics, not implementing B-trees, WALs, query planners, or replication from scratch. Existing runtimes are sufficient to prove whether the kernel, compiler, and harvest loop are valuable.

### Decision 2: Use a staged execution stack

**Choice**: Start with Convex for reactive transactional execution, PostgreSQL as a second OLTP adapter, DuckDB for replay and analytics, and generated web apps as the first interactive target.

**Rationale**: This split mirrors real product needs. OLTP, analytics, and interactive rendering have different constraints. DuckDB is excellent for local replay and scoring, but it should not be the primary collaborative runtime. Convex/PostgreSQL are appropriate first targets while the system learns.

### Decision 3: Borrow browser isolation rules for generated software

**Choice**: Maintain a privileged control plane that owns policy, capability grants, migrations, connector credentials, and deployment authority. Generated app code runs in a constrained execution plane.

**Rationale**: Chromium and WebKit treat renderer-like processes as untrusted. Generated code should be treated the same way. The control plane sets policy and hands out constrained capabilities; generated components consume them.

### Decision 4: Make invalidation, provenance, and scheduling first-class

**Choice**: The kernel and runtime must track dependency edges, view invalidation, event routing, and provenance for all inferred or compiled artifacts.

**Rationale**: Browser engines stay responsive because they do not recompute or repaint everything on every change. The application OS should likewise understand what changed, why it changed, and which outputs must be recomputed.

### Decision 5: Keep the agent team specialized

**Choice**: Define named technical agents such as product strategist, semantic architect, compiler engineer, runtime engineer, rendering systems engineer, verification engineer, and ops/release engineer, each with scoped tools and explicit artifact outputs.

**Rationale**: The user's ask is to use startup-member technical agents with function calls. Specialized agents create better handoffs, better evals, and safer tool use than a single unrestricted loop.

### Decision 6: Prove breadth through benchmarks, not claims

**Choice**: Use a golden corpus built around three anchor systems: a Notion-like structured workspace, a Linear-like workflow tracker, and a Ramp-like approval system.

**Rationale**: Those systems cover entities, views, workflows, permissions, derived state, search, and collaboration. Surviving change requests against those benchmarks is a stronger signal than broad marketing claims.

### Decision 7: Defer custom engines and exotic targets

**Choice**: Defer custom storage kernels, local-first sync kernels, game runtimes, and GPU-native compile targets until the semantic kernel and harness prove stable value.

**Rationale**: Those targets may become valid later, but they will amplify scope too early. The platform should first win on semantic fidelity, safe evolution, and proof.

## Risks / Trade-offs

- **Semantic kernel bloat**: If the IR absorbs every target-specific concern, it becomes unreadable and impossible to migrate. Mitigation: keep the kernel minimal and push target detail into adapter layers.
- **False generality**: "Any application" is an attractive slogan but dangerous as a roadmap. Mitigation: benchmark breadth across a constrained app family before adding new target classes.
- **Generated code drift**: Human edits can diverge from the source model. Mitigation: preserve round-trippable metadata, explicit ownership boundaries, and re-import workflows.
- **Security boundary erosion**: Generated components may try to reach privileged tools. Mitigation: capability brokerage, signed plans, and human approval on high-risk actions.
- **Agent sprawl**: Too many agents create coordination overhead. Mitigation: start with 5-7 roles, typed outputs, and shared memory rooted in the semantic kernel.

## Migration Plan

Five phases, each producing artifacts that remain useful if later phases change:

| Phase | Scope | Acceptance Criteria |
|-------|-------|---------------------|
| 0 | Project bootstrap and benchmark corpus | OpenSpec project context, proposal/design/spec/tasks, benchmark app definitions, and first agent team contracts exist |
| 1 | Semantic kernel + concept library | One prompt can be normalized into a typed IR with provenance and open questions |
| 2 | Compiler + transactional adapter | Kernel compiles to Convex or PostgreSQL with schema, functions, policies, workflows, and migration plan |
| 3 | Verification harness | Generated app passes replay, browser, API, and invariant checks before promotion |
| 4 | Harvest loop + agent team | Human corrections update the concept library and improve subsequent generations measurably |
| 5 | Secondary adapters | DuckDB replay and richer interactive inspectors are in place; additional runtime targets remain optional |

## Open Questions

1. What is the smallest kernel that still captures Notion-like structure, Linear-like workflow, and Ramp-like policy without becoming target-specific?
2. How much of the kernel should be editable as plain data versus through a visual studio?
3. Which parts of generated web surfaces must be round-trippable back into the kernel, and which are acceptable escape hatches?
4. What benchmark set best reflects the user's past work in rendering, knowledge systems, and agent tooling without exploding v1 scope?
5. When do we add a richer interactive runtime model for render-heavy or GPU-backed systems without destabilizing the business-software wedge?
