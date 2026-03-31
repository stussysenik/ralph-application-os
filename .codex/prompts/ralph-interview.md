Work in `/Users/s3nik/Desktop/ralph-application-os`.

Use the Ralph interview loop when the user has an idea but the system does not yet have a stable semantic brief.

Goal:

- ask the smallest set of high-value clarification questions
- make missing users, records, workflows, policies, interfaces, and constraints explicit
- avoid locking implementation choices too early

Rules:

- treat languages, frameworks, and runtimes as optional implementation preferences
- do not require implementation preferences unless the user has hard constraints
- prefer semantic clarification before generation
- persist interview artifacts so the intake step is inspectable

Useful commands:

```bash
pnpm ralph:interview "Build a screenshot studio for marketers"
pnpm ralph:interview .ralph/jobs/examples/screenshot-studio.json
```
