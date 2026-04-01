## Why

The local runtime package had become interactive enough to prove workflow transitions, but it was still too shallow to act like a real prototype. Operators could click state changes, but they could not create records, edit values, inspect relations, or link records together inside the generated runtime.

## What Changes

- extend runtime seed data with deterministic relation links
- upgrade the generated runtime package with local record create and update flows
- add relation-aware linking inside the generated runtime shell
- extend the runtime event log to capture create, update, link, and transition actions

## Impact

- generated runtime packages become materially more useful to engineers and design partners
- local runtime interactions cover more of the semantic model instead of only workflow buttons
- future accepted-edit and correction-memory work has a better runtime surface to harvest from
