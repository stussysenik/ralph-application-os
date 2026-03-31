## Design

The ideation classifier remains deterministic. This change does not add model-time ambiguity or prompt-time freeform behavior. It adds one new software category with explicit keyword signals, semantic axes, proof regime, builder targets, and interview questions.

### Category Shape

- category: `review-workspace`
- execution mode: `interactive-runtime`
- semantic focus:
  - captured assets and revisions
  - annotation targets and feedback
  - review lifecycle and sharing
  - collections and workspace organization

### Why a New Category

Screenshot studio and review-oriented products are not well represented by `workflow-app` or `knowledge-system` alone:

- they have asset and annotation semantics that are stronger than general document systems
- they usually require sharing, review, expiry, and revision handling even when they are not operational backoffice apps
- the current runtime wedge can already represent them better than the generic fallback suggests

### Verification

- deterministic ideation test for a screenshot-studio prompt
- live ideation run showing `review-workspace` as the primary category with interactive-runtime execution mode
