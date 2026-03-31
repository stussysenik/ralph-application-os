## Context

The ideation brief is Ralph's universal front door. It already classifies a prompt, describes proof pressure, and generates the next interview template. The missing step is concrete idea-improvement guidance that helps the operator sharpen functionality before deeper modeling begins.

## Decision

Add a deterministic `improvementOpportunities` field to `RalphIdeationBrief`, populated from category-aware heuristics and rendered into the ideation report.

## Constraints

- The suggestions must stay deterministic.
- The suggestions must not depend on hidden prompt state.
- The suggestions should be broad enough to help unsupported categories, but specific enough to be useful.

## Risks

- Suggestions could become repetitive if they are too generic.
- Suggestions could look like hallucinated requirements if they are not clearly framed as opportunities rather than commitments.

## Mitigations

- Keep the copy phrased as optional improvements.
- Drive suggestions from the software category, not from speculative hidden logic.
- Cap the list so the output remains concise.
