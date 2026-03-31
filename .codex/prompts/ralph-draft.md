Work in `/Users/s3nik/Desktop/ralph-application-os`.

Use the Ralph draft flow after the interview questions have been answered and you need a first semantic world model.

Goal:

- parse the answered interview deterministically
- synthesize a first semantic kernel draft
- materialize a blueprint and proof result
- preserve unresolved structure as open questions instead of guessing

Rules:

- do not treat languages or frameworks as semantic source of truth
- keep relations and policies explicit only when the answers support them
- prefer open questions over invented hidden semantics
- persist draft artifacts so the operator can inspect the result

Useful commands:

```bash
pnpm ralph:draft .ralph/interviews/examples/screenshot-studio.answers.md
```
