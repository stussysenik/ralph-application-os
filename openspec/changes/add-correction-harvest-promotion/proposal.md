## Why

Correction memory exists, but the library still depends on manually authored files. Ralph should be able to harvest reusable lessons from proof-clean semantic patches and merges, then let the operator explicitly promote those lessons into the tracked correction library.

## What Changes

- harvest correction-memory proposals from semantic patch runs
- harvest correction-memory proposals from conflict-free semantic merge runs
- add an explicit `ralph:correction:promote` command to move harvested proposals into `.ralph/corrections/harvested/`

## Impact

- accepted semantic fixes become reusable project memory faster
- operators can keep a visible approval step before the repo learns a new lesson
- patch and merge artifacts become a real source of future ideation pressure
