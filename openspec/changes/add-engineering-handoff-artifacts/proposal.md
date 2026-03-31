## Why

Ralph drafts already produce semantic models, blueprints, and proof results, but an SWE still has to translate those into a concrete implementation plan. That slows down the handoff from ideation into execution.

## What Changes

- emit a deterministic `engineering-handoff.md` artifact from draft synthesis
- include implementation order, runtime surfaces, proof obligations, and product improvement opportunities
- expose the handoff artifact in CLI output and docs

## Impact

- Ralph outputs become more directly useful to software engineers
- ideation artifacts now improve ideas instead of only restating them
- the semantic model becomes a stronger bridge between PM/product thinking and engineering execution
