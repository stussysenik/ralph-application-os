Work in `/Users/s3nik/Desktop/ralph-application-os`.

Read these first:

- `README.md`
- `ARCHITECTURE.md`
- `PLATFORM.md`
- `PROGRESS.md`
- `BENCHMARKS.md`
- `openspec/project.md`
- `docs/AGENT_ROSTER.md`
- `docs/FUNCTION_CALL_CONTRACTS.md`
- `openspec/changes/define-ralph-application-os/proposal.md`
- `openspec/changes/define-ralph-application-os/design.md`
- `openspec/changes/define-ralph-application-os/tasks.md`

Then do this:

1. Create a new OpenSpec change that updates the architecture from external runtime adapters toward **internal builders on our own substrate**.
2. Keep the work spec-driven and TDD-driven.
3. Start with the smallest empowered implementation:
   - expand `packages/semantic-kernel`
   - add the first benchmark app fixture
   - add failing tests for stable semantic serialization and one benchmark invariant
   - keep `pnpm demo` working as a real artifact, not a placeholder
4. Implement only enough code to make those tests pass.
5. Update `PROGRESS.md` with what changed and what remains open.

Non-negotiables:

- The semantic kernel is the source of truth.
- Human edits and provenance are first-class.
- The bash loop is the supervisor, not the product.
- Prefer plain typed data over prompt-shaped hidden state.
- Do not add heavy infrastructure unless a test or benchmark forces it.

Useful entrypoints:

- `/ralph-swarm`
- `/ralph-interview`
- `/ralph-draft`
- `/ralph-job-from-draft`
- `/ralph-onboard`
- `/ralph-new-job`
- `/ralph-loop`
- `/ralph-team`
