import { describe, expect, it } from "vitest";

import {
  applySemanticPatch,
  createSemanticPatchFromWorldModels,
  mergeSemanticWorldModels,
  rampLikeSpendModel
} from "../src/index.js";

describe("mergeSemanticWorldModels", () => {
  it("auto-merges non-overlapping semantic changes", () => {
    const left = applySemanticPatch(rampLikeSpendModel, {
      operations: [
        { op: "set", path: "domain", value: "approvals-and-erp" },
        {
          op: "add",
          path: "entities.Budget",
          value: {
            name: "Budget",
            description: "Budget envelope attached to invoice approvals.",
            attributes: [{ name: "limit", type: "number", required: true }]
          }
        }
      ]
    });
    const right = applySemanticPatch(rampLikeSpendModel, {
      operations: [
        { op: "remove", path: "policies.finance-threshold.actors.finance-approver" },
        {
          op: "add",
          path: "policies.finance-threshold.actors.finance-director",
          value: "finance-director"
        }
      ]
    });

    const result = mergeSemanticWorldModels(rampLikeSpendModel, left, right);

    expect(result.ok).toBe(true);
    expect(result.conflicts).toHaveLength(0);
    expect(result.mergedModel?.domain).toBe("approvals-and-erp");
    expect(result.mergedModel?.entities.some((entity) => entity.name === "Budget")).toBe(true);
    expect(
      result.mergedModel?.policies.find((policy) => policy.name === "finance-threshold")?.actors
    ).toEqual(["finance-director"]);
  });

  it("reports conflicts when both branches change the same semantic path differently", () => {
    const left = applySemanticPatch(rampLikeSpendModel, {
      operations: [{ op: "set", path: "domain", value: "approvals-and-erp" }]
    });
    const right = applySemanticPatch(rampLikeSpendModel, {
      operations: [{ op: "set", path: "domain", value: "approvals-and-compliance" }]
    });

    const result = mergeSemanticWorldModels(rampLikeSpendModel, left, right);

    expect(result.ok).toBe(false);
    expect(result.mergedModel).toBeUndefined();
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.path).toBe("domain");
  });
});

describe("createSemanticPatchFromWorldModels", () => {
  it("creates a deterministic patch document between two models", () => {
    const target = applySemanticPatch(rampLikeSpendModel, {
      operations: [
        { op: "set", path: "domain", value: "approvals-and-erp" },
        {
          op: "add",
          path: "openQuestions.budget-scope",
          value: {
            id: "budget-scope",
            prompt: "Should budgets attach to organizations or cost centers?",
            status: "open"
          }
        }
      ]
    });

    const patch = createSemanticPatchFromWorldModels(rampLikeSpendModel, target);

    expect(patch.operations).toEqual([
      { op: "set", path: ["domain"], value: "approvals-and-erp" },
      {
        op: "add",
        path: ["openQuestions", "budget-scope"],
        value: {
          id: "budget-scope",
          prompt: "Should budgets attach to organizations or cost centers?",
          status: "open"
        }
      }
    ]);
  });
});
