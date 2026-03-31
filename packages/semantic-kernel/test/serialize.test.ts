import { describe, expect, it } from "vitest";

import {
  rampLikeSpendModel,
  serializeWorldModel,
  type SemanticWorldModel
} from "../src/index.js";

describe("serializeWorldModel", () => {
  it("produces stable output independent of input ordering", () => {
    const input: SemanticWorldModel = {
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

    expect(serializeWorldModel(rampLikeSpendModel)).toBe(serializeWorldModel(input));
  });
});
