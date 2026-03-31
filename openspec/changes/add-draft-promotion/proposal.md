## Why

Draft synthesis currently stops at artifacts. Operators still need to hand-author tracked models and jobs, which breaks the intended flow from prompt to managed application state.

## What Changes

- classify synthesized drafts into capability tiers
- persist promoted semantic models under tracked repo paths
- generate tracked Ralph jobs automatically only for tier-a, proof-clean drafts
- emit promotion reports when job generation is blocked

## Impact

- Ralph gains a real bridge from interview/draft artifacts into tracked product assets
- unsafe drafts stop short of job creation without losing semantic work
- the repo becomes closer to a continuous creation flow rather than a loose collection of steps
