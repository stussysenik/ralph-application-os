## Context

The current loop preserves semantic patches and human edits, but it does not yet replay the lessons from those edits into future ideation or drafting. That leaves too much value trapped in one-off artifacts.

## Decision

Introduce a small typed correction-memory record and deterministic matcher. Keep the kernel responsible for match logic and keep the CLI responsible for loading repo-local correction files.

## Constraints

- matching must stay deterministic
- the correction library must be inspectable in git
- the first version should stay narrow and avoid a large storage system

## Risks

- weak matching could make suggestions noisy
- file-backed memory could drift without conventions

## Mitigations

- score matches conservatively and only surface positive matches
- keep correction entries narrow and durable
- persist correction-memory artifacts so operators can see exactly what was matched and why
