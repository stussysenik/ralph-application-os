import { describe, expect, it } from "vitest";

import { rampLikeSpendModel } from "@ralph/semantic-kernel";

import {
  buildApplicationBlueprint,
  buildExecutableSubstrateArtifact
} from "../src/index.js";

describe("buildApplicationBlueprint", () => {
  it("materializes workflow and policy structure for a benchmark app", () => {
    const blueprint = buildApplicationBlueprint(rampLikeSpendModel);

    expect(blueprint.modelName).toBe("ramp-like-spend-controls");
    expect(blueprint.workflows.some((workflow) => workflow.entity === "Invoice")).toBe(true);
    expect(blueprint.policies.some((policy) => policy.name === "finance-threshold")).toBe(true);
    expect(blueprint.views.some((view) => view.name === "approvalQueue")).toBe(true);
  });

  it("emits a deterministic executable runtime package", () => {
    const artifact = buildExecutableSubstrateArtifact(rampLikeSpendModel);
    const html = artifact.files.find((file) => file.path === "index.html");
    const manifest = artifact.files.find((file) => file.path === "runtime-manifest.json");

    expect(artifact.entrypoint).toBe("index.html");
    expect(artifact.schema.some((entity) => entity.name === "Invoice")).toBe(true);
    expect(artifact.workflows.some((workflow) => workflow.entity === "Invoice")).toBe(true);
    expect(manifest?.content).toContain('"kind": "ralph-runtime-package"');
    expect(html?.content).toContain("approvalQueue");
    expect(html?.content).toContain("ramp-like-spend-controls");
  });
});
