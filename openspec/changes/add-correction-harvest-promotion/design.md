## Context

The current correction-memory path is useful, but it still begins with hand-authored JSON. The next loop step is to derive correction-memory proposals directly from accepted semantic changes, while keeping promotion explicit so exploratory edits do not silently rewrite the repo's memory.

## Decision

Harvest correction-memory proposals from semantic patch and merge artifacts. Persist those proposals inside the artifact directories. Add a separate promotion command that copies validated memories into `.ralph/corrections/harvested/`.

## Constraints

- harvesting must stay deterministic
- patch and merge flows must still work when no reusable lesson is inferred
- repo learning should remain explicit, not fully automatic

## Risks

- harvested lessons could be too generic if the grouping is weak
- automatic harvesting could create noisy proposals if every patch type is treated as equally meaningful

## Mitigations

- only harvest from semantic roots that imply durable lessons
- keep promotion explicit
- persist harvested proposals visibly in the artifact directories for operator review
