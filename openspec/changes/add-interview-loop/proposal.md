## Why

The repo can already validate tracked jobs and run proof-gated loops, but the intake path is still too abrupt. New ideas either need a benchmark name or an inline world model, which means the system is missing a real interview layer for clarifying intent before modeling.

That gap matters because the product thesis depends on turning rough ideas into better semantic inputs, not only on executing already-structured jobs.

## What Changes

- add an interview-loop capability for prompt-first intake
- generate typed interview questions from prompts, tracked jobs, and world-model open questions
- treat language and framework choices as optional implementation preferences, not as semantic source of truth
- expose the interview loop in the CLI and persist interview artifacts

## Impact

- users can bring rough ideas into the system without first hand-authoring a full world model
- the repo becomes more stable as an operator harness for ideation and clarification
- language choices are recorded when necessary, but they do not pollute the semantic kernel
