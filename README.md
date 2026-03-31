# Ralph Application OS

![Demo](demo.gif)


Ralph Application OS is a spec-driven, TDD-driven semantic application platform.

The system's job is to turn intent, examples, and human corrections into a canonical semantic model, build working software from that model on our own substrate, prove the result, and continuously improve through a supervised loop.

## Table Of Contents

<!-- generated:toc:start -->
- [Product Thesis](#product-thesis)
- [Purpose](#purpose)
- [Why It Works](#why-it-works)
- [How It Works](#how-it-works)
- [How Ralph Improves Ideas](#how-ralph-improves-ideas)
- [Principles](#principles)
- [Current Stack](#current-stack)
- [Workspace Layout](#workspace-layout)
- [Quick Start](#quick-start)
- [Core Documents](#core-documents)
- [Working Mode](#working-mode)
- [Local Operator Surface](#local-operator-surface)
- [Generated Snapshot](#generated-snapshot)
- [How To Use Ralph Now](#how-to-use-ralph-now)
- [Product Goal](#product-goal)
- [Current Boundary](#current-boundary)
- [Current Output](#current-output)
- [Potential Moat](#potential-moat)
- [Current Demo Modes](#current-demo-modes)
- [Language Policy](#language-policy)
<!-- generated:toc:end -->

## Product Thesis

- The customer is Mario.
- Ralph is the flower.
- Mario stays Mario, but gains new powers.

In practice, that means the product should turn high-agency operators, founders, PMs, and engineers into super-users who can define, inspect, evolve, and prove software directly.

## Purpose

Ralph exists to compress ideation and execution into one semantic workflow.

Instead of hand-assembling schemas, endpoints, workflows, views, and proofs separately, the operator starts with intent and converges toward a typed semantic model that can be promoted safely.

## Why It Works

- the semantic model is the source of truth
- the proof harness blocks unsafe promotion
- every step leaves durable artifacts instead of hidden prompt state
- drafts can now become tracked models and tracked jobs automatically when they are strong enough
- drafts now emit an engineering handoff that tells an SWE what to build first and which product improvements the model is signaling
- correction memory now lets Ralph replay durable operator lessons into future ideation and draft runs

## How It Works

1. Start with a prompt.
2. Replay matching correction memory so known semantic gaps show up early.
3. Run an interview to clarify missing records, workflow, policy, and target surface.
4. Synthesize a semantic draft from the answered interview.
5. Emit an engineering handoff with build order, runtime surfaces, proof obligations, and improvement ideas.
6. Score the draft with proof and capability assessment.
7. Promote safe drafts into tracked models and tracked jobs.
8. Diff tracked semantic models before promotion or rebuild.
9. Apply semantic patches as durable correction artifacts.
10. Merge semantic branches when parallel edits diverge.
11. Materialize a runnable runtime package.
12. Run the loop and keep iterating.

## How Ralph Improves Ideas

- it turns vague product claims into durable entities, relations, states, and policies
- it surfaces missing semantic structure before implementation, especially relations and proof obligations
- it emits deterministic product-improvement opportunities during ideation and again at draft handoff instead of generic brainstorming
- it replays matched correction memory so Ralph gets sharper from prior operator lessons instead of staying purely category-driven
- it gives engineering a build-first sequence so ideation pressure becomes execution pressure quickly
- it keeps open questions explicit, which prevents false certainty from turning into bad architecture

## Principles

- Spec-driven before implementation.
- TDD-driven before broad claims.
- Semantic kernel first.
- Internal builders before external platform lock-in.
- Proof harness before scale claims.
- Human edits and provenance are first-class.

## Current Stack

- `pnpm` workspaces for the monorepo
- TypeScript for the semantic kernel, builders, CLI surfaces, and studio scaffolding
- Python reserved for research and eval pipelines
- Elixir reserved for long-lived orchestration and fault-tolerant supervision once the loop needs it
- Common Lisp reserved as a semantics lab if the kernel needs a stronger symbolic environment
- Rust or Zig reserved for runtime-critical paths after the semantic model proves out
- Vitest for package-level tests
- OpenSpec for change planning
- semantic-release for versioning and changelog automation

## Workspace Layout

```text
apps/
  studio/               Human-facing semantic studio
docs/
  adr/                  Architecture decisions
openspec/               Spec-driven change planning
packages/
  agent-swarm/          Ralph loop stages, agent roles, and function-call contracts
  semantic-kernel/      Canonical world model and stable serialization
  internal-builders/    Builders that materialize the substrate from semantics
  proof-harness/        Verification, replay, and benchmark scoring
  ralph-cli/            Demo and operator-facing CLI
scripts/
  ralph-loop.sh         Thin shell entrypoint into the typed Ralph runtime
```

## Quick Start

```bash
cd /Users/s3nik/Desktop/ralph-application-os
pnpm install
pnpm docs:sync
pnpm typecheck
pnpm test
pnpm spec:validate
pnpm demo
pnpm swarm:demo
pnpm ralph:ideate "Build a toy optimizing compiler from a small Lisp to WebAssembly."
pnpm ralph:interview "Build a screenshot studio for marketers"
pnpm ralph:correction:new "Vision commerce freshness"
pnpm ralph:draft .ralph/interviews/examples/screenshot-studio.answers.md
pnpm ralph:job:from-draft .ralph/interviews/examples/screenshot-studio.answers.md
pnpm ralph:model:diff .ralph/jobs/examples/screenshot-studio.json .ralph/models/generated/screenshot-studio-marketers-capture-pages-annotate.json
pnpm ralph:model:patch .ralph/models/generated/screenshot-studio-marketers-capture-pages-annotate.json .ralph/patches/examples/screenshot-studio-relations.json
pnpm ralph:model:merge ramp-like-spend-controls .ralph/models/examples/ramp-budget-left.json .ralph/models/examples/ramp-budget-right.json
pnpm ralph:artifact ramp-like-spend-controls
pnpm ralph:job:validate .ralph/jobs/examples/screenshot-studio.json
pnpm ralph:loop .ralph/jobs/examples/screenshot-studio.json
pnpm prompt
```

## Core Documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`docs/AGENT_ROSTER.md`](./docs/AGENT_ROSTER.md)
- [`docs/FUNCTION_CALL_CONTRACTS.md`](./docs/FUNCTION_CALL_CONTRACTS.md)
- [`HYPERTIME_LEDGER.md`](./HYPERTIME_LEDGER.md)
- [`PLATFORM.md`](./PLATFORM.md)
- [`PROGRESS.md`](./PROGRESS.md)
- [`GLOSSARY.md`](./GLOSSARY.md)
- [`BENCHMARKS.md`](./BENCHMARKS.md)
- [`RELEASING.md`](./RELEASING.md)
- [`START_PROMPT.md`](./START_PROMPT.md)
- [`openspec/project.md`](./openspec/project.md)

## Working Mode

1. Define or refine a spec in OpenSpec.
2. Add a failing test tied to a benchmark, invariant, or semantic contract.
3. Implement the smallest empowered change.
4. Prove the result locally.
5. Record progress and decisions.

## Local Operator Surface

- `.codex/` holds repo-native prompts and skills
- `.ralph/` holds tracked job specs, workflow config, and swarm role metadata
- `artifacts/ralph/` holds ephemeral run outputs

Useful commands:

```bash
pnpm docs:sync
pnpm ralph:ideate "Build a toy optimizing compiler from a small Lisp to WebAssembly."
pnpm ralph:interview "Build a screenshot studio for marketers"
pnpm ralph:correction:new "Vision commerce freshness"
pnpm ralph:draft .ralph/interviews/examples/screenshot-studio.answers.md
pnpm ralph:job:from-draft .ralph/interviews/examples/screenshot-studio.answers.md
pnpm ralph:model:diff .ralph/jobs/examples/screenshot-studio.json .ralph/models/generated/screenshot-studio-marketers-capture-pages-annotate.json
pnpm ralph:model:patch .ralph/models/generated/screenshot-studio-marketers-capture-pages-annotate.json .ralph/patches/examples/screenshot-studio-relations.json
pnpm ralph:model:merge ramp-like-spend-controls .ralph/models/examples/ramp-budget-left.json .ralph/models/examples/ramp-budget-right.json
pnpm ralph:artifact ramp-like-spend-controls
pnpm ralph:job:new screenshot-studio
pnpm ralph:job:validate .ralph/jobs/examples/screenshot-studio.json
pnpm ralph:loop .ralph/jobs/examples/screenshot-studio.json
pnpm ralph:team
```

## Generated Snapshot

<!-- generated:readme-snapshot:start -->
- example jobs: 4
- answered interview examples: 2
- tracked generated models: 1
- tracked generated jobs: 1
- operator commands: ralph:artifact, ralph:correction:new, ralph:draft, ralph:ideate, ralph:interview, ralph:job:from-draft, ralph:job:new, ralph:job:validate, ralph:loop, ralph:model:diff, ralph:model:merge, ralph:model:patch, ralph:team
<!-- generated:readme-snapshot:end -->

## How To Use Ralph Now

For a new idea:

1. `pnpm ralph:ideate "<your idea>"`
2. Review the software category, execution mode, correction-memory matches, and generated `answers.template.md`
3. `pnpm ralph:draft <ideation-dir-or-answer-file>`
4. Review `engineering-handoff.md` to see what to build first, what relations still matter, and which functionality Ralph thinks should be added
5. `pnpm ralph:job:from-draft <ideation-dir-or-answer-file>`
6. `pnpm ralph:model:diff <left-model-or-job> <right-model-or-job>`
7. `pnpm ralph:model:patch <model-input> <patch-file>`
8. `pnpm ralph:model:merge <base-model-or-job> <left-model-or-job> <right-model-or-job>`
9. `pnpm ralph:artifact <model-or-job-or-draft>`
10. `pnpm ralph:loop <generated-job-file>`

For repo hygiene:

1. `pnpm docs:sync`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm spec:validate`

Ideation artifacts persist under:

- `artifacts/ralph/ideation/<run-id>/brief.json`
- `artifacts/ralph/ideation/<run-id>/ideation.json`
- `artifacts/ralph/ideation/<run-id>/questions.json`
- `artifacts/ralph/ideation/<run-id>/correction-memory.json`
- `artifacts/ralph/ideation/<run-id>/architecture.md`
- `artifacts/ralph/ideation/<run-id>/answers.template.md`
- `artifacts/ralph/ideation/<run-id>/report.md`
- `artifacts/ralph/ideation/<run-id>/manifest.json`

Interview artifacts persist under:

- `artifacts/ralph/interviews/<run-id>/brief.json`
- `artifacts/ralph/interviews/<run-id>/ideation.json`
- `artifacts/ralph/interviews/<run-id>/questions.json`
- `artifacts/ralph/interviews/<run-id>/report.md`
- `artifacts/ralph/interviews/<run-id>/answers.template.md`

Draft synthesis artifacts persist under:

- `artifacts/ralph/drafts/<run-id>/answers.json`
- `artifacts/ralph/drafts/<run-id>/capability.json`
- `artifacts/ralph/drafts/<run-id>/manifest.json`
- `artifacts/ralph/drafts/<run-id>/world-model.json`
- `artifacts/ralph/drafts/<run-id>/blueprint.json`
- `artifacts/ralph/drafts/<run-id>/proof.json`
- `artifacts/ralph/drafts/<run-id>/correction-memory.json`
- `artifacts/ralph/drafts/<run-id>/engineering-handoff.md`
- `artifacts/ralph/drafts/<run-id>/report.md`

Promotion artifacts persist under:

- `artifacts/ralph/promotions/<run-id>/promotion.json`
- `artifacts/ralph/promotions/<run-id>/report.md`

Model diff artifacts persist under:

- `artifacts/ralph/model-diffs/<run-id>/left.json`
- `artifacts/ralph/model-diffs/<run-id>/right.json`
- `artifacts/ralph/model-diffs/<run-id>/diff.json`
- `artifacts/ralph/model-diffs/<run-id>/report.md`

Model patch artifacts persist under:

- `artifacts/ralph/model-patches/<run-id>/original.json`
- `artifacts/ralph/model-patches/<run-id>/patched.json`
- `artifacts/ralph/model-patches/<run-id>/patch.json`
- `artifacts/ralph/model-patches/<run-id>/diff.json`
- `artifacts/ralph/model-patches/<run-id>/proof.json`
- `artifacts/ralph/model-patches/<run-id>/report.md`

Model merge artifacts persist under:

- `artifacts/ralph/model-merges/<run-id>/base.json`
- `artifacts/ralph/model-merges/<run-id>/left.json`
- `artifacts/ralph/model-merges/<run-id>/right.json`
- `artifacts/ralph/model-merges/<run-id>/left-patch.json`
- `artifacts/ralph/model-merges/<run-id>/right-patch.json`
- `artifacts/ralph/model-merges/<run-id>/merged-patch.json`
- `artifacts/ralph/model-merges/<run-id>/conflicts.json`
- `artifacts/ralph/model-merges/<run-id>/merged.json`
- `artifacts/ralph/model-merges/<run-id>/proof.json`
- `artifacts/ralph/model-merges/<run-id>/report.md`

Runtime package artifacts persist under:

- `artifacts/ralph/runtime-packages/<run-id>/world-model.json`
- `artifacts/ralph/runtime-packages/<run-id>/blueprint.json`
- `artifacts/ralph/runtime-packages/<run-id>/proof.json`
- `artifacts/ralph/runtime-packages/<run-id>/runtime-manifest.json`
- `artifacts/ralph/runtime-packages/<run-id>/schema.json`
- `artifacts/ralph/runtime-packages/<run-id>/workflows.json`
- `artifacts/ralph/runtime-packages/<run-id>/policies.json`
- `artifacts/ralph/runtime-packages/<run-id>/views.json`
- `artifacts/ralph/runtime-packages/<run-id>/seed-data.json`
- `artifacts/ralph/runtime-packages/<run-id>/runtime.js`
- `artifacts/ralph/runtime-packages/<run-id>/index.html`
- `artifacts/ralph/runtime-packages/<run-id>/report.md`

Each loop run persists:

- `job.json`
- `run.json`
- `manifest.json`
- `report.md`
- stage artifact JSON files
- a ledger entry in `artifacts/ralph/hypertime-ledger.jsonl`

Tracked example jobs:

- `.ralph/jobs/examples/ramp-like-spend-controls.json`
- `.ralph/jobs/examples/linear-like-issue-tracker.json`
- `.ralph/jobs/examples/notion-like-workspace.json`
- `.ralph/jobs/examples/screenshot-studio.json`

Tracked example answered interviews:

- `.ralph/interviews/examples/screenshot-studio.answers.md`
- `.ralph/interviews/examples/vision-commerce-grocery-assistant.answers.md`

Tracked generated outputs:

- `.ralph/models/generated/`
- `.ralph/jobs/generated/`
- `.ralph/patches/examples/`
- `.ralph/corrections/examples/`

## Product Goal

The interaction target is "as easy as `v0` or Lovable" for supported domains, but with a deeper semantic core:

- prompt to start
- inspect the world model
- correct meaning directly
- rerun proof
- keep evolving safely

The first supported domains are operational and workflow-heavy systems, not arbitrary software on day one.

## Current Boundary

This repo is **not ready to execute anything** yet, but it is ready to take almost any software idea seriously at the ideation layer.

It is ready for:

- prompt-first ideation across workflow software, knowledge systems, compilers, rendering systems, kernels, embedded protocols, agent systems, and data pipelines
- explicit software-category classification with confidence and execution-mode reporting
- prompt-first interview and clarification
- deterministic interview-answer to world-model draft synthesis
- capability classification for synthesized drafts
- tracked model persistence and guarded draft-to-job promotion
- semantic model diffing, patching, and merging with durable artifacts
- replay-aware proofs and mutation-resistance checks
- semantic benchmark modeling
- blueprint generation
- first executable substrate runtime packages
- proof-gated loop execution
- tracked job runs and team runs

It is not yet ready for:

- arbitrary prompt-to-app generation
- executable runtime artifacts from every blueprint
- deployable runtime artifacts for compilers, kernels, browser engines, or modem stacks
- a browser-native studio experience

## Current Output

Today the primary outputs are:

- ideation briefs with software-category, execution mode, proof regime, recommended language/surface hints, correction-memory matches, and idea-improvement opportunities
- architecture outlines for categories that need design pressure before implementation
- interview question sets
- first-draft semantic world models synthesized from interview answers
- engineering handoffs with build-first sequencing, runtime surface guidance, proof obligations, and product-improvement suggestions
- capability-tier assessments and promotion recommendations
- semantic world models
- semantic patch documents and patched models
- semantic merge reports and merged model candidates
- internal application blueprints
- interactive local runtime packages with seed data, runtime scripts, and HTML entrypoints
- proof results
- run manifests and reports
- hypertime ledger entries

That is enough to validate the control plane and the semantic substrate direction, but not yet enough to claim a finished software foundry.

## Potential Moat

The moat is **not** “we can call models” and it is **not** “we have a loop.”

If this becomes defensible, the moat will be:

- a stable semantic kernel
- a universal ideation front door that classifies software category before promising execution
- proof before promotion
- replay and mutation pressure in the proof harness
- correction memory and provenance
- reusable benchmark corpus
- operator-grade loop artifacts and ledger history

Right now, that moat is **forming**, not finished.

Current benchmark families:

- approvals and spend controls
- issue and workflow tracking
- structured knowledge workspaces
- screenshot capture and sharing

## Current Demo Modes

- `pnpm ralph:ideate <prompt-or-job-file>`: universal intake -> software category classification -> correction-memory matches -> execution-mode recommendation -> idea-improvement opportunities -> generated interview template
- `pnpm ralph:correction:new <name>`: create a repo-local correction-memory template under `.ralph/corrections/examples/` so operator lessons can feed future runs
- `pnpm demo`: benchmark world models -> internal blueprints -> proof
- `pnpm swarm:demo`: Ralph loop swarm execution with typed stage artifacts and promotion decisions
- `pnpm ralph:interview <prompt-or-job-file>`: prompt or tracked job -> deterministic clarification questions -> persisted interview artifacts
- `pnpm ralph:draft <interview-dir-or-answers-template>`: answered interview -> synthesized world model -> blueprint -> proof -> engineering handoff -> persisted draft artifacts
- `pnpm ralph:job:from-draft <interview-dir-or-answers-template>`: tier-a draft -> tracked model + generated job when safe, otherwise tracked model + rejection report
- `pnpm ralph:model:diff <left-model-or-job> <right-model-or-job>`: compare semantic drift between tracked models, draft outputs, benchmark fixtures, or job files
- `pnpm ralph:model:patch <model-input> <patch-file>`: apply a typed semantic patch, persist before/after/diff/proof artifacts, and keep the correction as a durable runtime input
- `pnpm ralph:model:merge <base-model-or-job> <left-model-or-job> <right-model-or-job>`: merge two semantic branches against a shared base, prove the merged result when conflict-free, and persist conflicts when they exist
- `pnpm ralph:artifact <model-or-job-or-draft>`: emit an interactive local runtime package with deterministic seed data, executable workflow buttons, and a browser-openable `index.html`
- `pnpm ralph:loop <job-file>`: validated job -> swarm run -> persisted run artifacts
- `pnpm ralph:team [jobs-directory]`: batch swarm run over tracked jobs with a persisted team summary

## Language Policy

Languages and frameworks are optional implementation preferences, not required semantic inputs.

Only declare them when they materially constrain:

- target surface
- team capability
- integration boundaries
- runtime behavior

If you do not specify them, Ralph should still be able to clarify the problem and build the semantic brief first.
