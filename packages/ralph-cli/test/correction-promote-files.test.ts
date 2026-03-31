import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { promoteCorrectionMemoriesFromArgument } from "../src/correction-promote-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-correction-promote-"));
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

describe("promoteCorrectionMemoriesFromArgument", () => {
  it("promotes harvested correction memories into the tracked correction library", async () => {
    const rootDir = await createTempRoot();
    const sourcePath = path.join(rootDir, "correction-memory.json");

    await fs.writeFile(
      sourcePath,
      `${JSON.stringify(
        [
          {
            id: "harvested-view-lesson",
            title: "Model operator views early",
            kind: "view",
            summary: "A merge added a durable vendor drilldown surface.",
            recommendation: "Capture operator views early so the UI does not invent critical read paths ad hoc.",
            categories: ["workflow-app"],
            domains: ["approvals-and-payments"],
            source: {
              sourceType: "human-edit",
              sourceRef: "merge:ramp-like-spend-controls"
            }
          }
        ],
        null,
        2
      )}\n`,
      "utf8"
    );

    const run = await promoteCorrectionMemoriesFromArgument(rootDir, sourcePath);
    const trackedPath = path.join(
      rootDir,
      ".ralph/corrections/harvested/harvested-view-lesson.json"
    );
    const [reportRaw, trackedRaw] = await Promise.all([
      fs.readFile(run.reportPath, "utf8"),
      fs.readFile(trackedPath, "utf8")
    ]);

    expect(run.writtenPaths).toContain(trackedPath);
    expect(reportRaw).toContain("Ralph Correction Memory Promotion");
    expect(trackedRaw).toContain('"title": "Model operator views early"');
  });
});
