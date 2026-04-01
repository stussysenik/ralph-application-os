## Why

Ralph could already learn from semantic patch and merge flows, but accepted draft promotions were still mostly a deployment step. That left a gap in the learning loop: a model could be good enough to become a tracked job without teaching Ralph anything durable unless someone also authored a patch.

## What Changes

- harvest reusable correction memory from accepted promoted models
- persist promotion-local correction-memory artifacts
- auto-track harvested memories when a draft promotion succeeds
- expose harvested correction memory in promotion reports

## Impact

- Ralph can learn from successful draft adoption, not only from explicit semantic diffs
- promotion becomes both a runtime gate and a semantic learning event
- tracked correction memory becomes richer without requiring hand-written correction JSON for every lesson
