## Why

Ralph could already turn answered interviews into proof-clean drafts, but the semantic drafts often stopped one layer too early: entities, workflow, and views existed while the relation graph remained an open question. That made the moat weaker than it should be because data relationships are the real semantic backbone.

## What Changes

- infer benchmark-shaped relations directly from answered interview inputs
- remove the generic `relation-map` open question when the synthesizer can produce a coherent relation graph
- add a tracked answered interview example for a vision-assisted grocery comparison product

## Impact

- first drafts now carry more of the actual data-model moat
- promoted drafts are more useful before any manual patching
- Ralph learns from a broader class of product ideas instead of overfitting to workflow-only examples
