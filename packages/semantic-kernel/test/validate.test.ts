import { describe, expect, it } from "vitest";

import { benchmarkModels, validateWorldModel } from "../src/index.js";

describe("validateWorldModel", () => {
  it("accepts the benchmark fixtures", () => {
    const result = validateWorldModel(benchmarkModels[0]);

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects duplicate names and empty policy actors", () => {
    const brokenModel = {
      ...benchmarkModels[0],
      entities: [
        benchmarkModels[0].entities[0],
        benchmarkModels[0].entities[0],
        ...benchmarkModels[0].entities.slice(1)
      ],
      policies: benchmarkModels[0].policies.map((policy) =>
        policy.name === "finance-threshold"
          ? { ...policy, actors: [], rules: [] }
          : policy
      )
    };

    const result = validateWorldModel(brokenModel);

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain("entities");
    expect(result.issues.map((issue) => issue.path)).toContain(
      "policies.finance-threshold.actors"
    );
    expect(result.issues.map((issue) => issue.path)).toContain(
      "policies.finance-threshold.rules"
    );
  });
});
