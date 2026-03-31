# Function Call Contracts

The local swarm harness uses typed function-call artifacts to keep the control plane inspectable.

## Functions

### `selectBenchmarkModel`

- input: benchmark name
- output: semantic world model

### `serializeWorldModel`

- input: semantic world model
- output: stable serialized model

### `buildApplicationBlueprint`

- input: semantic world model
- output: internal application blueprint

### `runKernelProofs`

- input: semantic world model
- output: proof result with checks

### `makePromotionDecision`

- input: proof result and policy
- output: promote or reject decision

### `validateJobFile`

- input: tracked job JSON plus tracked job schema
- output: validated Ralph job or a contract error

### `writeRunArtifacts`

- input: Ralph run plus output directory
- output: manifest path, report path, and ledger path

### `validateRalphJob`

- input: Ralph job file
- output: validated typed job or an error

### `buildInterviewQuestions`

- input: prompt-first brief, tracked job, or world model hints
- output: deterministic clarification questions with category, priority, and blocking status

### `runInterviewFromArgument`

- input: prompt text or tracked job file path
- output: persisted interview brief, question set, and `report.md`

### `parseInterviewAnswerMarkdown`

- input: filled interview markdown
- output: typed answer document keyed by interview question id

### `synthesizeWorldModelFromInterview`

- input: typed interview answer document
- output: first semantic world model draft with explicit open questions where structure remains unresolved

### `runDraftFromArgument`

- input: interview directory or `answers.template.md` path
- output: persisted semantic draft, blueprint, proof result, and `report.md`

### `promoteDraftFromArgument`

- input: interview directory or `answers.template.md` path
- output: tracked semantic model, optional generated Ralph job, and promotion report

### `runLoopFromJobFile`

- input: tracked job file plus workflow and swarm role config
- output: persisted run manifest, report, ledger entry, and stage artifacts

### `runTeamFromJobsDirectory`

- input: tracked jobs directory
- output: persisted team summary plus per-job run artifacts

## Why This Matters

These artifacts are the bridge between:

- bash-loop supervision
- oh-my-codex style operator workflows
- future MCP or API-based agent orchestration
