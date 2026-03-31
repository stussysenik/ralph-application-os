# Contributing

## Workflow

1. Start with OpenSpec for any material change.
2. Add or update a failing test.
3. Implement the smallest change that makes the test pass.
4. Run `pnpm docs:sync` before final verification.
5. Update `PROGRESS.md` if the repo's state meaningfully changed.
6. Use conventional commits so semantic-release can infer version bumps.

## Commit Format

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`

## Comment Policy

Use block comments for module boundaries, invariants, compile stages, and non-obvious algorithms. Avoid narrating obvious code line by line.

## Release Policy

- Releases are driven by semantic-release on `main`.
- Keep commits atomic and intention-revealing.
- Do not batch unrelated changes into one commit.
- Run `pnpm release:dry` before claiming the release path is healthy.
- See `RELEASING.md` for the exact workflow and breaking-change format.
