import { describe, expect, it } from "vitest";

import { rampLikeSpendModel } from "@ralph/semantic-kernel";

import { runKernelProofs } from "../src/index.js";

describe("runKernelProofs", () => {
  it("passes the Ramp-like benchmark model", () => {
    const result = runKernelProofs(rampLikeSpendModel);
    const replayCheck = result.checks.find((check) => check.name === "workflow-replay:Invoice");
    const mutationCheck = result.checks.find(
      (check) => check.name === "mutation-resistance:finance-threshold-present"
    );

    expect(result.ok).toBe(true);
    expect(result.checks.every((check) => check.ok)).toBe(true);
    expect(replayCheck?.ok).toBe(true);
    expect(mutationCheck?.ok).toBe(true);
  });

  it("fails when the finance threshold policy is broken", () => {
    const brokenModel = {
      ...rampLikeSpendModel,
      policies: rampLikeSpendModel.policies.map((policy) =>
        policy.name === "finance-threshold"
          ? {
              ...policy,
              actors: [],
              rules: []
            }
          : policy
      )
    };

    const result = runKernelProofs(brokenModel);
    const thresholdCheck = result.checks.find(
      (check) => check.name === "finance-threshold-present"
    );

    expect(result.ok).toBe(false);
    expect(thresholdCheck?.ok).toBe(false);
  });

  it("fails when a workflow transition chain becomes disconnected from the initial state", () => {
    const brokenModel = {
      ...rampLikeSpendModel,
      actions: rampLikeSpendModel.actions.filter((action) => action.name !== "managerApprove")
    };

    const result = runKernelProofs(brokenModel);
    const replayCheck = result.checks.find((check) => check.name === "workflow-replay:Invoice");

    expect(result.ok).toBe(false);
    expect(replayCheck?.ok).toBe(false);
  });
});
