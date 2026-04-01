import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runRuntimeEditHarvestFromArguments } from "../src/runtime-edit-harvest-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-runtime-harvest-"));
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

describe("runRuntimeEditHarvestFromArguments", () => {
  it("turns runtime edit exports into proofed semantic harvest artifacts", async () => {
    const rootDir = await createTempRoot();
    const runtimeEditExportPath = path.join(rootDir, "runtime-edit-export.json");

    await fs.writeFile(
      runtimeEditExportPath,
      `${JSON.stringify(
        {
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
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const run = await runRuntimeEditHarvestFromArguments(
      rootDir,
      "screenshot-studio",
      runtimeEditExportPath
    );
    const [reportRaw, patchRaw, correctionRaw, manifestRaw] = await Promise.all([
      fs.readFile(run.reportPath, "utf8"),
      fs.readFile(run.patchPath, "utf8"),
      fs.readFile(run.correctionMemoryPath, "utf8"),
      fs.readFile(run.manifestPath, "utf8")
    ]);

    expect(run.proof.ok).toBe(true);
    expect(reportRaw).toContain("Ralph Runtime Edit Harvest");
    expect(reportRaw).toContain("Harvested 3 semantic lesson(s)");
    expect(patchRaw).toContain('"op": "add"');
    expect(patchRaw).toContain('"path": [');
    expect(correctionRaw).toContain('"kind": "relation"');
    expect(correctionRaw).toContain('"kind": "workflow"');
    expect(manifestRaw).toContain('"runtimeEditExport": "runtime-edit-export.json"');
  });
});
