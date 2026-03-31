import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_RALPH_ROLE_BINDINGS,
  DEFAULT_RALPH_WORKFLOW
} from "@ralph/agent-swarm";

import {
  createJobTemplate,
  runLoopFromJobFile,
  validateJobFile
} from "../src/job-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-cli-"));
  createdDirectories.push(rootDir);

  await fs.mkdir(path.join(rootDir, ".ralph/jobs"), { recursive: true });
  await fs.mkdir(path.join(rootDir, ".ralph/workflows"), { recursive: true });
  await fs.mkdir(path.join(rootDir, ".ralph/swarm"), { recursive: true });

  await fs.writeFile(
    path.join(rootDir, ".ralph/jobs/job.schema.json"),
    `${JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["id", "prompt"],
        oneOf: [{ required: ["benchmarkName"] }, { required: ["worldModel"] }],
        properties: {
          id: { type: "string" },
          prompt: { type: "string" },
          workflowName: { type: "string" },
          benchmarkName: { type: "string" },
          worldModel: { type: "object" },
          inputs: { type: "array" },
          implementationPreferences: { type: "object" },
          constraints: { type: "array" },
          successCriteria: { type: "array" },
          notes: { type: "array" },
          tags: { type: "array" }
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(rootDir, ".ralph/workflows/default.json"),
    `${JSON.stringify(DEFAULT_RALPH_WORKFLOW, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(rootDir, ".ralph/swarm/roles.json"),
    `${JSON.stringify({ roles: DEFAULT_RALPH_ROLE_BINDINGS }, null, 2)}\n`,
    "utf8"
  );

  return rootDir;
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  );
});

describe("job-files", () => {
  it("creates and validates a tracked Ralph job template", async () => {
    const rootDir = await createTempRoot();
    const { jobPath } = await createJobTemplate(rootDir, "Screenshot Studio");

    const job = await validateJobFile(rootDir, jobPath);

    expect(job.id).toBe("job-screenshot-studio");
    expect(job.workflowName).toBe("default");
    expect(job.inputs?.[0]?.kind).toBe("prompt");
  });

  it("writes manifest, report, and ledger artifacts for a loop run", async () => {
    const rootDir = await createTempRoot();
    const { jobPath } = await createJobTemplate(rootDir, "General Harness");

    const { run, runDir, manifestPath, reportPath, ledgerPath } = await runLoopFromJobFile(
      rootDir,
      jobPath
    );

    const [manifestRaw, reportRaw, ledgerRaw] = await Promise.all([
      fs.readFile(manifestPath, "utf8"),
      fs.readFile(reportPath, "utf8"),
      fs.readFile(ledgerPath, "utf8")
    ]);

    expect(run.metadata.summary.proofOk).toBe(true);
    expect(path.dirname(manifestPath)).toBe(runDir);
    expect(manifestRaw).toContain(run.job.id);
    expect(reportRaw).toContain("Proof score:");
    expect(ledgerRaw).toContain(run.metadata.runId);
  });
});
