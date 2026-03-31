## 1. Spec

- [ ] 1.1 Add a job runtime spec covering validation, workflow-driven execution, and durable run artifacts

## 2. Tests

- [ ] 2.1 Add a failing swarm test for missing semantic sources and tracked workflow execution
- [ ] 2.2 Add a failing CLI/runtime test for manifest and hypertime ledger persistence

## 3. Implementation

- [ ] 3.1 Validate tracked job files before execution
- [ ] 3.2 Drive stage order and role assignment from tracked workflow metadata
- [ ] 3.3 Persist run manifests, full run records, and hypertime ledger entries
- [ ] 3.4 Update loop docs and scripts to reflect the durable runtime
