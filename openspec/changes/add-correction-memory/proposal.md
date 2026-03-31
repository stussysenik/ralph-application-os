## Why

Ralph can already suggest better functionality, but those suggestions are still mostly heuristic. The real moat starts when operator corrections become durable memory that gets reused on the next ideation and draft run.

## What Changes

- add typed correction-memory records to the semantic kernel
- load repo-local correction memories from `.ralph/corrections/`
- match correction memories into `ralph:ideate` and `ralph:draft`
- persist correction-memory match artifacts alongside ideation and draft outputs

## Impact

- Ralph starts learning from durable operator corrections instead of only from category defaults
- ideation and handoff outputs gain project-specific guidance
- the repo gets a visible path for building correction memory over time
