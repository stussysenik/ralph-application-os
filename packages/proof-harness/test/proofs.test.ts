import { describe, expect, it } from "vitest";

import { rampLikeSpendModel } from "@ralph/semantic-kernel";

import { runKernelProofs } from "../src/index.js";

describe("runKernelProofs", () => {
  it("passes the Ramp-like benchmark model", () => {
    const result = runKernelProofs(rampLikeSpendModel);

    expect(result.ok).toBe(true);
    expect(result.checks.every((check) => check.ok)).toBe(true);
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
});
