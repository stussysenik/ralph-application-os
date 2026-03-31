# Correction Memory

Tracked correction memory lives here.

Purpose:

- preserve durable semantic lessons from operator edits
- feed those lessons back into `ralph:ideate` and `ralph:draft`
- keep improvement guidance visible and inspectable instead of hiding it in prompts

Shape:

- one `.json` file can contain one correction memory object or an array of them
- use `pnpm ralph:correction:new "<name>"` to create a starter template
- keep entries narrow and durable: relation gaps, policy gaps, workflow mistakes, missing runtime concerns

Current convention:

- `examples/` holds runnable sample memories that pressure the current matcher
- `harvested/` holds promoted memories accepted from patch and merge artifact proposals
