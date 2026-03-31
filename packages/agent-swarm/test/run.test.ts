import { describe, expect, it } from "vitest";

import { benchmarkModels } from "@ralph/semantic-kernel";

import {
  inspectRalphJob,
  runRalphJob,
  type RalphRoleBinding,
  type RalphWorkflowDefinition
} from "../src/index.js";

describe("runRalphJob", () => {
  it("promotes a valid benchmark model", () => {
    const run = runRalphJob({
      id: "job-ramp",
      prompt: "Build a Ramp-like approval system.",
      benchmarkName: "ramp-like-spend-controls",
      workflowName: "default",
      constraints: [
        {
          name: "proof-required",
          detail: "Only promote after proof passes."
        }
      ]
    });

    expect(run.stages[4].artifact.data.status).toBe("promote");
    expect(run.stages[3].artifact.data.ok).toBe(true);
    expect(run.metadata.summary.proofScore).toBe(1);
    expect(run.stages[0].artifact.data.constraints).toHaveLength(1);
  });

  it("rejects invalid inline world models before the swarm runs", () => {
    const brokenModel = {
      ...benchmarkModels[0],
      policies: benchmarkModels[0].policies.map((policy) =>
        policy.name === "finance-threshold"
          ? { ...policy, actors: [], rules: [] }
          : policy
      )
    };

    expect(() =>
      runRalphJob({
        id: "job-broken",
        prompt: "Broken finance policy",
        worldModel: brokenModel
      })
    ).toThrow("Policy finance-threshold must list at least one actor.");
  });

  it("rejects ambiguous job inputs", () => {
    expect(() =>
      runRalphJob({
        id: "job-ambiguous",
        prompt: "Use both inputs",
        benchmarkName: "ramp-like-spend-controls",
        worldModel: benchmarkModels[0]
      })
    ).toThrow("exactly one input source");
  });

  it("reports missing semantic sources without throwing", () => {
    const validation = inspectRalphJob({
      id: "job-missing-source",
      prompt: "Missing semantic input."
    });

    expect(validation.ok).toBe(false);
    expect(validation.issues.map((issue) => issue.message)).toContain(
      "A Ralph job requires at least one semantic source: benchmarkName or worldModel."
    );
  });

  it("uses tracked workflow and role bindings for stage execution", () => {
    const workflow: RalphWorkflowDefinition = {
      name: "default",
      stageOrder: ["research", "model", "build", "prove", "promote"],
      artifacts: [
        "research-brief",
        "world-model",
        "application-blueprint",
        "proof-result",
        "promotion-decision"
      ]
    };
    const roleBindings: RalphRoleBinding[] = [
      { role: "researcher", stages: ["research"] },
      { role: "semantic-architect", stages: ["model"] },
      { role: "builder", stages: ["build"] },
      { role: "verifier", stages: ["prove"] },
      { role: "promoter", stages: ["promote"] }
    ];

    const run = runRalphJob(
      {
        id: "job-ramp-workflow",
        prompt: "Build a Ramp-like approval system.",
        benchmarkName: "ramp-like-spend-controls"
      },
      {
        runId: "run-ramp-workflow",
        workflow,
        roleBindings
      }
    );

    expect(run.metadata.runId).toBe("run-ramp-workflow");
    expect(run.metadata.workflowName).toBe("default");
    expect(run.stages.map((stage) => stage.stage)).toEqual(workflow.stageOrder);
    expect(run.stages.map((stage) => stage.agent)).toEqual([
      "researcher",
      "semantic-architect",
      "builder",
      "verifier",
      "promoter"
    ]);
  });
});
