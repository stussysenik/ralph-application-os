## Why

The initial project direction still leans too heavily on external runtime adapters. That is useful for orientation, but it does not match the clarified product goal: Ralph should ultimately build software on its own semantic substrate through internal builders.

The repo also needs a sharper statement of the language strategy. The user wants a system that can use each language where it wins rather than forcing one language to do every job.

## What Changes

- Shift the architecture from "runtime adapters first" toward **internal builders first**
- Define a platform language strategy that keeps v1 disciplined while leaving room for Elixir, Common Lisp, and Zig-class specialization later
- Add a first runnable demo slice that shows benchmark models, generated blueprints, and proof results

## Capabilities

### New Capabilities
- `internal-builders`: materialize semantic meaning into substrate artifacts owned by Ralph
- `platform-language-strategy`: assign languages by responsibility instead of treating the stack as monolithic

### Modified Capabilities
- `semantic-kernel`
- `app-compiler`
- `verification-harness`

## Impact

- The platform direction becomes consistent with the user's clarified intent
- The repo gets a first demonstrable product slice, not just planning scaffolding
- Future work can be benchmarked against a concrete "semantic model -> blueprint -> proof" loop
