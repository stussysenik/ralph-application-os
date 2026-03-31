import { describe, expect, it } from "vitest";

import {
  applySemanticPatch,
  diffWorldModels,
  rampLikeSpendModel
} from "../src/index.js";

describe("applySemanticPatch", () => {
  it("applies set, add, and remove operations to a semantic world model", () => {
    const patched = applySemanticPatch(rampLikeSpendModel, {
      operations: [
        {
          op: "set",
          path: "domain",
          value: "approvals-and-erp"
        },
        {
          op: "set",
          path: "entities.Invoice.attributes.amount.type",
          value: "decimal"
        },
        {
          op: "add",
          path: "entities.Budget",
          value: {
            name: "Budget",
            description: "Budget envelope attached to invoice approvals.",
            attributes: [{ name: "limit", type: "number", required: true }]
          }
        },
        {
          op: "remove",
          path: "policies.finance-threshold.actors.finance-approver"
        },
        {
          op: "add",
          path: "policies.finance-threshold.actors.finance-director",
          value: "finance-director"
        },
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

    const diff = diffWorldModels(rampLikeSpendModel, patched);

    expect(patched.domain).toBe("approvals-and-erp");
    expect(
      patched.entities.find((entity) => entity.name === "Invoice")?.attributes.find(
        (attribute) => attribute.name === "amount"
      )?.type
    ).toBe("decimal");
    expect(patched.entities.some((entity) => entity.name === "Budget")).toBe(true);
    expect(
      patched.policies.find((policy) => policy.name === "finance-threshold")?.actors
    ).toEqual(["finance-director"]);
    expect(patched.openQuestions.map((question) => question.id)).toContain("budget-scope");
    expect(diff.changes.map((change) => change.path)).toContain("domain");
    expect(diff.changes.map((change) => change.path)).toContain("entities.Budget");
  });

  it("supports explicit path segments for keys that are awkward in dot notation", () => {
    const patched = applySemanticPatch(rampLikeSpendModel, {
      operations: [
        {
          op: "add",
          path: ["provenance", "prompt:brief.v1:"],
          value: {
            sourceType: "prompt",
            sourceRef: "brief.v1",
            confidence: 0.7
          }
        },
        {
          op: "set",
          path: ["provenance", "prompt:brief.v1:", "confidence"],
          value: 0.9
        }
      ]
    });

    expect(
      patched.provenance.find(
        (entry) => entry.sourceRef === "brief.v1" && entry.sourceType === "prompt"
      )?.confidence
    ).toBe(0.9);
  });

  it("rejects invalid paths", () => {
    expect(() =>
      applySemanticPatch(rampLikeSpendModel, {
        operations: [{ op: "remove", path: "entities.Unknown" }]
      })
    ).toThrow("Invalid semantic patch");
  });
});
