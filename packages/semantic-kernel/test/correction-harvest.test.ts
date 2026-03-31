import { describe, expect, it } from "vitest";

import { applySemanticPatch, rampLikeSpendModel } from "../src/index.js";
import { harvestCorrectionMemoriesFromPatch } from "../src/correction-harvest.js";

describe("harvestCorrectionMemoriesFromPatch", () => {
  it("harvests reusable relation and view lessons from semantic patch operations", () => {
    const patch = {
      note: "Make vendor drilldowns easier for operators.",
      operations: [
        {
          op: "add" as const,
          path: "relations.Organization:owns:Vendor",
          value: {
            name: "owns",
            from: "Organization",
            to: "Vendor",
            cardinality: "one-to-many",
            description: "Organizations own vendors."
          }
        },
        {
          op: "add" as const,
          path: "views.vendorOverview",
          value: {
            name: "vendorOverview",
            entity: "Vendor",
            kind: "detail",
            columns: ["name", "riskTier"],
            description: "Vendor drilldown"
          }
        }
      ]
    };
    const patched = applySemanticPatch(rampLikeSpendModel, patch);
    const harvested = harvestCorrectionMemoriesFromPatch({
      sourceModel: rampLikeSpendModel,
      targetModel: patched,
      patch,
      sourceRef: "patch:ramp-like-spend-controls"
    });

    expect(harvested.map((memory) => memory.kind)).toEqual(["relation", "view"]);
    expect(harvested[0]?.recommendation).toContain("Promote explicit relations");
    expect(harvested[0]?.entityNames).toEqual(
      expect.arrayContaining(["Organization", "Vendor"])
    );
    expect(harvested[1]?.recommendation).toContain("Model operator views");
    expect(harvested[1]?.entityNames).toEqual(["Vendor"]);
  });

  it("ignores non-semantic patch roots that do not imply reusable lessons", () => {
    const patch = {
      note: "Rename the domain only.",
      operations: [{ op: "set" as const, path: "domain", value: "approvals-and-erp" }]
    };
    const patched = applySemanticPatch(rampLikeSpendModel, patch);
    const harvested = harvestCorrectionMemoriesFromPatch({
      sourceModel: rampLikeSpendModel,
      targetModel: patched,
      patch,
      sourceRef: "patch:ramp-like-spend-controls"
    });

    expect(harvested).toEqual([]);
  });
});
