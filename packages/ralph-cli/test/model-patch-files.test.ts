import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { rampLikeSpendModel } from "@ralph/semantic-kernel";

import { runModelPatchFromArguments } from "../src/model-patch-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-model-patch-"));
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

describe("runModelPatchFromArguments", () => {
  it("applies a patch document and persists patched-model artifacts", async () => {
    const rootDir = await createTempRoot();
    const modelPath = path.join(rootDir, "model.json");
    const patchPath = path.join(rootDir, "patch.json");

    await fs.writeFile(modelPath, `${JSON.stringify(rampLikeSpendModel, null, 2)}\n`, "utf8");
    await fs.writeFile(
      patchPath,
      `${JSON.stringify(
        {
          note: "Prepare the spend model for budget-aware approvals.",
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
            },
            {
              op: "add",
              path: "views.vendorOverview",
              value: {
                name: "vendorOverview",
                entity: "Vendor",
                kind: "detail",
                columns: ["name", "riskTier"],
                description: "Vendor detail view"
              }
            }
          ]
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const run = await runModelPatchFromArguments(rootDir, modelPath, patchPath);
    const [report, correctionMemoryRaw] = await Promise.all([
      fs.readFile(run.reportPath, "utf8"),
      fs.readFile(run.correctionMemoryPath, "utf8")
    ]);

    expect(run.patchedModel.domain).toBe("approvals-and-erp");
    expect(run.patchedModel.openQuestions.map((question) => question.id)).toContain(
      "budget-scope"
    );
    expect(run.proof.ok).toBe(true);
    expect(report).toContain("Ralph Semantic Model Patch");
    expect(report).toContain("Proof: PASS");
    expect(report).toContain("Harvested correction memory:");
    expect(correctionMemoryRaw).toContain('"kind": "view"');
  });
});
