import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { rampLikeSpendModel } from "@ralph/semantic-kernel";

import { runModelDiffFromArguments } from "../src/model-diff-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-model-diff-"));
  createdDirectories.push(rootDir);
  return rootDir;
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  );
});

describe("runModelDiffFromArguments", () => {
  it("loads world models from job files and tracked model files and writes a diff report", async () => {
    const rootDir = await createTempRoot();
    const leftPath = path.join(rootDir, "left-job.json");
    const rightPath = path.join(rootDir, "right-model.json");

    await fs.writeFile(
      leftPath,
      `${JSON.stringify(
        {
          id: "job-left",
          prompt: "Compare models.",
          worldModel: rampLikeSpendModel
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    await fs.writeFile(
      rightPath,
      `${JSON.stringify(
        {
          ...rampLikeSpendModel,
          domain: "approvals-and-erp",
          openQuestions: [
            {
              id: "budget-scope",
              prompt: "Should budgets attach to organizations or cost centers?",
              status: "open"
            }
          ]
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const run = await runModelDiffFromArguments(rootDir, leftPath, rightPath);
    const report = await fs.readFile(run.reportPath, "utf8");

    expect(run.diff.same).toBe(false);
    expect(run.diff.changes.map((change) => change.path)).toContain("domain");
    expect(run.diff.changes.map((change) => change.path)).toContain(
      "openQuestions.budget-scope"
    );
    expect(report).toContain("Ralph Semantic Model Diff");
    expect(report).toContain("Summary:");
  });

  it("resolves benchmark names directly", async () => {
    const rootDir = await createTempRoot();
    const rightPath = path.join(rootDir, "right-model.json");

    await fs.writeFile(
      rightPath,
      `${JSON.stringify(
        {
          ...rampLikeSpendModel,
          version: "0.2.0"
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const run = await runModelDiffFromArguments(
      rootDir,
      "ramp-like-spend-controls",
      rightPath
    );

    expect(run.left.label).toBe("benchmark:ramp-like-spend-controls");
    expect(run.diff.changes.map((change) => change.path)).toContain("version");
  });
});
