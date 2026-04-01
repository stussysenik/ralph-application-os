## Design

Promotion is an explicit acceptance point. When Ralph turns a synthesized draft into a tracked model and generated job, that is strong evidence that the model shape is useful. This slice converts that acceptance into deterministic correction memory.

### Accepted-Model Harvest

Harvest lessons from promoted models across these semantic surfaces:

- relations
- workflows
- policies
- views
- runtime effects

The harvest stays deterministic and typed. It does not infer hidden semantics from prompts; it summarizes only what is already explicit in the accepted model.

### Promotion Behavior

- rejected promotions write no tracked correction memory
- successful promotions write:
  - `artifacts/ralph/promotions/<run-id>/correction-memory.json`
  - tracked files under `.ralph/corrections/harvested/`
- promotion reports list both harvested memory and tracked output paths

### Why Not Harvest Everything

This change intentionally learns only from accepted promotions so the correction library is pressured by successful model adoption, not by every intermediate draft.
