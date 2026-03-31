# ADR 0001: Semantic Kernel First

## Status

Accepted

## Decision

Ralph Application OS will treat the semantic kernel as the primary source of truth and will materialize software through internal builders, not through prompt-only generation.

## Why

- Semantics must survive regeneration.
- Humans need inspectable and diffable meaning.
- Proof requires deterministic structure.
- The system needs a durable substrate for learning from corrections.

## Consequences

- More upfront modeling discipline
- Better long-term leverage
- Slower demo velocity than prompt-only generation
- Stronger foundation for proof, replay, and evolution

