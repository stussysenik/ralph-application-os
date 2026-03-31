## Why

The first runtime package made the semantic substrate executable, but it was still mostly an inspection artifact. The next step is to make that package locally usable: seeded records, action execution, and persistent browser-side state.

## What Changes

- upgrade the runtime package from static inspection output to an interactive local runtime
- generate deterministic seed data for supported entities
- generate a `runtime.js` that executes workflow actions and persists local state
- document the runtime package as an interactive local operator surface

## Impact

- operators can click through workflow transitions instead of only reading JSON plans
- the runtime package becomes a real substrate probe for model quality
- the repo closes more of the gap between blueprint and usable application behavior
