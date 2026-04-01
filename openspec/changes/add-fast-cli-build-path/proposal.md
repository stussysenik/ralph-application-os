## Why

Ralph operator commands are currently slower than the semantic work itself. The common path pays for a forced full TypeScript rebuild before nearly every CLI command, which makes quick ideation and iteration feel heavier than the actual product logic.

## What Changes

- remove forced rebuild behavior from the default `pnpm build` path
- add an explicit force-build script for clean rebuild workflows
- keep the public Ralph commands on the normal incremental build path
- document the current performance baseline and the intended operator-latency expectation

## Impact

- repeated Ralph CLI commands become materially faster when the workspace is already built
- developers still retain an explicit clean rebuild path when needed
- operator latency better reflects semantic work instead of workspace rebuild overhead
