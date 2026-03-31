import { describe, expect, it } from "vitest";

import {
  diffWorldModels,
  rampLikeSpendModel,
  type SemanticWorldModel
} from "../src/index.js";

describe("diffWorldModels", () => {
  it("treats semantically identical models as the same even when ordering changes", () => {
    const reordered: SemanticWorldModel = {
      ...rampLikeSpendModel,
      concepts: [...rampLikeSpendModel.concepts].reverse(),
      entities: [...rampLikeSpendModel.entities].reverse().map((entity) => ({
        ...entity,
        attributes: [...entity.attributes].reverse()
      })),
      relations: [...rampLikeSpendModel.relations].reverse(),
      states: [...rampLikeSpendModel.states].reverse(),
      actions: [...rampLikeSpendModel.actions].reverse().map((action) => ({
        ...action,
        actors: [...action.actors].reverse()
      })),
      policies: [...rampLikeSpendModel.policies].reverse().map((policy) => ({
        ...policy,
        actors: [...policy.actors].reverse(),
        rules: [...policy.rules].reverse()
      })),
      views: [...rampLikeSpendModel.views].reverse().map((view) => ({
        ...view,
        columns: [...view.columns].reverse()
      })),
      effects: [...rampLikeSpendModel.effects].reverse(),
      invariants: [...rampLikeSpendModel.invariants].reverse(),
      provenance: [...rampLikeSpendModel.provenance].reverse()
    };

    const diff = diffWorldModels(rampLikeSpendModel, reordered);

    expect(diff.same).toBe(true);
    expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 0 });
    expect(diff.changes).toHaveLength(0);
  });

  it("reports added, removed, and changed semantic elements with stable paths", () => {
    const changed: SemanticWorldModel = {
      ...rampLikeSpendModel,
      domain: "approvals-and-erp",
      entities: rampLikeSpendModel.entities
        .map((entity) =>
          entity.name === "Invoice"
            ? {
                ...entity,
                attributes: entity.attributes.map((attribute) =>
                  attribute.name === "amount"
                    ? { ...attribute, type: "decimal" }
                    : attribute
                )
              }
            : entity
        )
        .concat({
          name: "Budget",
          description: "Budget envelope attached to invoice approvals.",
          attributes: [{ name: "limit", type: "number", required: true }]
        }),
      policies: rampLikeSpendModel.policies.map((policy) =>
        policy.name === "finance-threshold"
          ? { ...policy, actors: ["finance-director"] }
          : policy
      ),
      openQuestions: [
        {
          id: "budget-scope",
          prompt: "Should budgets attach to organizations or cost centers?",
          status: "open"
        }
      ],
      provenance: [
        ...rampLikeSpendModel.provenance,
        {
          sourceType: "human-edit",
          sourceRef: "operator:budgeting-pass",
          confidence: 0.85
        }
      ]
    };

    const diff = diffWorldModels(rampLikeSpendModel, changed);
    const paths = diff.changes.map((change) => change.path);

    expect(diff.same).toBe(false);
    expect(diff.summary.added).toBeGreaterThan(0);
    expect(diff.summary.changed).toBeGreaterThan(0);
    expect(paths).toContain("domain");
    expect(paths).toContain("entities.Budget");
    expect(paths).toContain("entities.Invoice.attributes.amount.type");
    expect(paths).toContain("policies.finance-threshold.actors.finance-approver");
    expect(paths).toContain("policies.finance-threshold.actors.finance-director");
    expect(paths).toContain("openQuestions.budget-scope");
    expect(paths).toContain("provenance.human-edit:operator:budgeting-pass:");
  });
});
