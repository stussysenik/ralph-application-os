Work in `/Users/s3nik/Desktop/ralph-application-os`.

Use the draft promotion flow after a semantic draft has been synthesized and you need to turn it into tracked Ralph assets.

Goal:

- persist the semantic model under `.ralph/models/generated/`
- create a tracked Ralph job only when the draft is tier A and proof-clean
- block unsafe promotion while still preserving the model and a clear rejection report

Rules:

- never auto-promote drafts that are not capability tier A
- tracked model persistence happens even when job promotion is blocked
- implementation preferences can be copied into the generated job, but they do not override semantic truth

Useful commands:

```bash
pnpm ralph:job:from-draft .ralph/interviews/examples/screenshot-studio.answers.md
```
