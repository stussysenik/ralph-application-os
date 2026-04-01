import { describe, expect, it } from "vitest";

import { applySemanticPatch, screenshotStudioModel } from "../src/index.js";
import {
  compileRuntimeEditHarvest,
  parseRuntimeEditExport
} from "../src/runtime-edit-harvest.js";

describe("parseRuntimeEditExport", () => {
  it("parses a typed runtime edit export", () => {
    const parsed = parseRuntimeEditExport({
      kind: "ralph-runtime-edit-export",
      modelName: "screenshot-studio",
      domain: "capture-annotation-and-sharing",
      storageKey: "ralph-runtime:screenshot-studio",
      exportedAt: "2026-04-01T00:40:00.000Z",
      eventCount: 2,
      events: [
        {
          type: "create",
          at: "2026-04-01T00:35:00.000Z",
          entity: "Capture",
          recordId: "capture-3",
          fieldNames: ["assetUrl", "capturedAt", "title"],
          to: "raw"
        },
        {
          type: "transition",
          at: "2026-04-01T00:36:00.000Z",
          entity: "Capture",
          recordId: "capture-1",
          action: "annotateCapture",
          from: "raw",
          to: "annotated"
        }
      ]
    });

    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0]?.type).toBe("create");
    expect(parsed.events[1]?.type).toBe("transition");
  });
});

describe("compileRuntimeEditHarvest", () => {
  it("turns runtime edit exports into provenance patches and correction memory", () => {
    const runtimeEditExport = parseRuntimeEditExport({
      kind: "ralph-runtime-edit-export",
      modelName: "screenshot-studio",
      domain: "capture-annotation-and-sharing",
      storageKey: "ralph-runtime:screenshot-studio",
      exportedAt: "2026-04-01T00:40:00.000Z",
      eventCount: 4,
      events: [
        {
          type: "create",
          at: "2026-04-01T00:35:00.000Z",
          entity: "Capture",
          recordId: "capture-3",
          fieldNames: ["assetUrl", "capturedAt", "title"],
          to: "raw"
        },
        {
          type: "update",
          at: "2026-04-01T00:36:00.000Z",
          entity: "Annotation",
          recordId: "annotation-1",
          fieldNames: ["payload"],
          to: "updated"
        },
        {
          type: "link",
          at: "2026-04-01T00:37:00.000Z",
          entity: "Annotation",
          recordId: "annotation-1",
          relationName: "marksUp",
          targetEntity: "Capture",
          targetRecordIds: ["capture-1"],
          to: "capture-1"
        },
        {
          type: "transition",
          at: "2026-04-01T00:38:00.000Z",
          entity: "Capture",
          recordId: "capture-1",
          action: "annotateCapture",
          from: "raw",
          to: "annotated"
        }
      ]
    });

    const harvested = compileRuntimeEditHarvest({
      model: screenshotStudioModel,
      runtimeEditExport
    });
    const patchedModel = applySemanticPatch(screenshotStudioModel, harvested.patch);

    expect(harvested.patch.operations).toHaveLength(3);
    expect(harvested.harvestedCorrections.map((memory) => memory.kind)).toEqual([
      "relation",
      "runtime",
      "workflow"
    ]);
    expect(patchedModel.provenance.length).toBeGreaterThan(screenshotStudioModel.provenance.length);
    expect(
      harvested.harvestedCorrections.find((memory) => memory.kind === "relation")?.entityNames
    ).toEqual(expect.arrayContaining(["Annotation", "Capture"]));
    expect(
      harvested.harvestedCorrections.find((memory) => memory.kind === "workflow")?.summary
    ).toContain("annotateCapture");
  });

  it("fails when the runtime export does not match the source model", () => {
    const runtimeEditExport = parseRuntimeEditExport({
      kind: "ralph-runtime-edit-export",
      modelName: "different-model",
      domain: "capture-annotation-and-sharing",
      storageKey: "ralph-runtime:different-model",
      exportedAt: "2026-04-01T00:40:00.000Z",
      eventCount: 0,
      events: []
    });

    expect(() =>
      compileRuntimeEditHarvest({
        model: screenshotStudioModel,
        runtimeEditExport
      })
    ).toThrow(/model mismatch/i);
  });
});
