import { describe, expect, it } from "vitest";

import { rampLikeSpendModel } from "@ralph/semantic-kernel";

import { buildApplicationBlueprint } from "../src/index.js";

describe("buildApplicationBlueprint", () => {
  it("materializes workflow and policy structure for a benchmark app", () => {
    const blueprint = buildApplicationBlueprint(rampLikeSpendModel);

    expect(blueprint.modelName).toBe("ramp-like-spend-controls");
    expect(blueprint.workflows.some((workflow) => workflow.entity === "Invoice")).toBe(true);
    expect(blueprint.policies.some((policy) => policy.name === "finance-threshold")).toBe(true);
    expect(blueprint.views.some((view) => view.name === "approvalQueue")).toBe(true);
  });
});
