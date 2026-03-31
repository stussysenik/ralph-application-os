## Why

The interview loop now produces good clarification questions, but the system still stops short of the next leverage point: turning answered questions into a first semantic draft.

Without that bridge, ideation remains manual at exactly the moment the product should start saving time.

## What Changes

- add deterministic parsing for answered interview markdown
- synthesize a first semantic world model from interview answers
- persist draft artifacts including the synthesized model, blueprint, proof, and report
- keep unresolved structure explicit as open questions instead of inventing hidden semantics

## Impact

- rough ideas can move from interview to semantic draft without hand-authoring world model JSON
- the data model becomes a practical leverage point earlier in the operator flow
- the repo gains a new inspectable control-plane step between interview and full job execution
