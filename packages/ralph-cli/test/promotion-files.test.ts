import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_RALPH_ROLE_BINDINGS,
  DEFAULT_RALPH_WORKFLOW
} from "@ralph/agent-swarm";

import { validateJobFile } from "../src/job-files.js";
import { promoteDraftFromArgument } from "../src/promotion-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-promotion-"));
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

const promotableInterview = `# Ralph Interview Answers

Prompt: Build a screenshot studio for marketers to capture pages, annotate them, and share results.

## primary-user-and-outcome
Answer:
- Marketing operators publish polished annotated screenshots quickly.

## core-records
Answer:
- Workspace: name
- Capture: title, assetUrl, status, capturedAt
- Annotation: kind, payload
- Collection: name, status
- ShareLink: slug, status

## core-workflow
Answer:
- Capture: raw -> annotated -> share-ready -> archived
- ShareLink: draft -> live -> expired

## permissions-and-audit
Answer:
- Editor can annotate and prepare captures for sharing.

## target-surface
Answer:
- web

## external-integrations
Answer:
- Slack export

## language-constraints
Answer:
- TypeScript and React.
`;

const nonPromotableInterview = `# Ralph Interview Answers

Prompt: Explore an abstract knowledge system.

## primary-user-and-outcome
Answer:
- Researchers organize loose ideas.

## core-records
Answer:
- Concept: title
- Note: body

## core-workflow
Answer:
- TODO

## target-surface
Answer:
- web
`;

describe("promoteDraftFromArgument", () => {
  it("writes a tracked model and generated job for tier-a drafts", async () => {
    const rootDir = await createTempRoot();
    const answersPath = path.join(rootDir, "answers.template.md");

    await fs.writeFile(answersPath, `${promotableInterview}\n`, "utf8");

    const promotion = await promoteDraftFromArgument(rootDir, answersPath);
    const job = await validateJobFile(rootDir, promotion.jobPath ?? "");
    const correctionMemoryRaw = await fs.readFile(promotion.correctionMemoryPath, "utf8");

    expect(promotion.status).toBe("promote");
    expect(job.id).toBe(`job-${promotion.draft.model.name}`);
    expect(job.notes?.[0]).toBe(`Promoted from draft synthesis for ${promotion.draft.model.name}.`);
    expect(job.implementationPreferences?.targetSurfaces).toEqual(["web"]);
    expect(job.implementationPreferences?.preferredLanguages).toEqual(["TypeScript"]);
    expect(promotion.harvestedCorrections.length).toBeGreaterThan(0);
    expect(promotion.trackedCorrectionPaths.length).toBeGreaterThan(0);
    expect(correctionMemoryRaw).toContain('"kind": "relation"');
    expect(correctionMemoryRaw).toContain(`"sourceRef": "promotion:${promotion.draft.model.name}"`);
  });

  it("writes a tracked model but blocks job promotion when the draft is not auto-promotable", async () => {
    const rootDir = await createTempRoot();
    const answersPath = path.join(rootDir, "answers.template.md");

    await fs.writeFile(answersPath, `${nonPromotableInterview}\n`, "utf8");

    const promotion = await promoteDraftFromArgument(rootDir, answersPath);
    const jobFilePath = path.join(
      rootDir,
      ".ralph/jobs/generated",
      `${promotion.draft.model.name}.json`
    );
    const jobExists = await fs
      .access(jobFilePath)
      .then(() => true)
      .catch(() => false);

    expect(promotion.status).toBe("reject");
    expect(jobExists).toBe(false);
    expect(promotion.reason).toContain("not auto-promotable");
    expect(promotion.harvestedCorrections).toEqual([]);
    expect(promotion.trackedCorrectionPaths).toEqual([]);
  });
});
