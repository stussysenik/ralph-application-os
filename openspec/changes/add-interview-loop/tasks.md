## 1. Spec

- [ ] 1.1 Add an interview-loop spec covering prompt-first intake, open-question reuse, and optional implementation preferences

## 2. Contracts

- [ ] 2.1 Extend job contracts with optional implementation preferences
- [ ] 2.2 Add typed interview question contracts

## 3. Runtime

- [ ] 3.1 Generate deterministic interview questions from prompt-only briefs
- [ ] 3.2 Generate interview questions from tracked jobs and unresolved world-model questions
- [ ] 3.3 Persist interview artifacts under `artifacts/ralph/interviews/`

## 4. CLI and Docs

- [ ] 4.1 Add a CLI entrypoint for the interview loop
- [ ] 4.2 Document when language declarations are optional versus required
- [ ] 4.3 Keep `pnpm typecheck`, `pnpm test`, and `pnpm spec:validate` green
