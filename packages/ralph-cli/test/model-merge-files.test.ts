import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applySemanticPatch, rampLikeSpendModel } from "@ralph/semantic-kernel";

import { runModelMergeFromArguments } from "../src/model-merge-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-model-merge-"));
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

describe("runModelMergeFromArguments", () => {
  it("auto-merges non-overlapping semantic branches and writes artifacts", async () => {
    const rootDir = await createTempRoot();
    const leftPath = path.join(rootDir, "left.json");
    const rightPath = path.join(rootDir, "right.json");

    const left = applySemanticPatch(rampLikeSpendModel, {
      operations: [{ op: "set", path: "domain", value: "approvals-and-erp" }]
    });
    const right = applySemanticPatch(rampLikeSpendModel, {
      operations: [
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

    await fs.writeFile(leftPath, `${JSON.stringify(left, null, 2)}\n`, "utf8");
    await fs.writeFile(rightPath, `${JSON.stringify(right, null, 2)}\n`, "utf8");

    const run = await runModelMergeFromArguments(
      rootDir,
      "ramp-like-spend-controls",
      leftPath,
      rightPath
    );
    const report = await fs.readFile(run.reportPath, "utf8");

    expect(run.merge.ok).toBe(true);
    expect(run.proof?.ok).toBe(true);
    expect(report).toContain("Status: MERGED");
    expect(report).toContain("Proof: PASS");
  });

  it("persists conflicts when branches collide on the same path", async () => {
    const rootDir = await createTempRoot();
    const leftPath = path.join(rootDir, "left.json");
    const rightPath = path.join(rootDir, "right.json");

    const left = applySemanticPatch(rampLikeSpendModel, {
      operations: [{ op: "set", path: "domain", value: "approvals-and-erp" }]
    });
    const right = applySemanticPatch(rampLikeSpendModel, {
      operations: [{ op: "set", path: "domain", value: "approvals-and-compliance" }]
    });

    await fs.writeFile(leftPath, `${JSON.stringify(left, null, 2)}\n`, "utf8");
    await fs.writeFile(rightPath, `${JSON.stringify(right, null, 2)}\n`, "utf8");

    const run = await runModelMergeFromArguments(
      rootDir,
      "ramp-like-spend-controls",
      leftPath,
      rightPath
    );

    expect(run.merge.ok).toBe(false);
    expect(run.merge.conflicts[0]?.path).toBe("domain");
  });
});
