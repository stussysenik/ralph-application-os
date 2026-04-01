## Design

The highest-leverage performance fix is not algorithmic. The baseline shows that:

- `pnpm build` with `tsc -b --force` costs about 1.3s
- direct `node packages/ralph-cli/dist/index.js ...` ideation and artifact commands take around 0.1s
- public operator commands mostly spend their time rebuilding the workspace rather than running semantic logic

### Build Path

- change `build` from forced to incremental
- add `build:force` for explicit full rebuilds
- keep CI correctness on `typecheck`, `test`, and `spec:validate`

### Why This First

This is the smallest safe fix that improves every operator command at once without changing the semantic kernel, runtime, or proof surface.
