import fs from "node:fs/promises";
import path from "node:path";

import { type RalphJob } from "@ralph/agent-swarm";
import { serializeWorldModel } from "@ralph/semantic-kernel";

import { runDraftFromArgument, type RalphDraftRun } from "./draft-files.js";
import { validateJobFile } from "./job-files.js";

const DEFAULT_MODELS_DIR = ".ralph/models/generated";
const DEFAULT_GENERATED_JOBS_DIR = ".ralph/jobs/generated";
const DEFAULT_PROMOTIONS_DIR = "artifacts/ralph/promotions";

export interface RalphDraftPromotion {
  status: "promote" | "reject";
  reason: string;
  draft: RalphDraftRun;
  modelPath: string;
  jobPath?: string;
  promotionDir: string;
  reportPath: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildGeneratedJob(draft: RalphDraftRun): RalphJob {
  const tags = [
    "generated",
    draft.capability.tier,
    draft.model.domain
  ];

  return {
    id: `job-${slugify(draft.model.name)}`,
    prompt: draft.answers.prompt,
    workflowName: "default",
    inputs: [
      {
        kind: "prompt",
        ref: `draft:${draft.model.name}`,
        note: `Promoted from ${draft.sourcePath}.`
      }
    ],
    ...(draft.implementationPreferences
      ? { implementationPreferences: draft.implementationPreferences }
      : {}),
    constraints: [
      {
        name: "semantic-source-of-truth",
        detail: "The promoted world model remains the source of truth for builders and proofs."
      },
      {
        name: "proof-required",
        detail: "Promotion is only valid while the proof harness continues to pass."
      }
    ],
    successCriteria: [
      {
        name: "proof-pass",
        detail: "The promoted world model must preserve a passing proof result."
      },
      {
        name: "capability-tier-a",
        detail: "The promoted draft must remain capability tier A."
      }
    ],
    notes: [
      `Promoted from draft ${draft.draftId}.`,
      draft.capability.summary,
      ...draft.model.openQuestions.map((question) => `Open question: ${question.prompt}`)
    ],
    tags,
    worldModel: draft.model
  };
}

function formatPromotionReport(
  promotion: RalphDraftPromotion,
  jobPath: string | undefined
): string {
  const lines = [
    "Ralph Draft Promotion",
    `Status: ${promotion.status.toUpperCase()}`,
    `Reason: ${promotion.reason}`,
    `Draft: ${promotion.draft.draftId}`,
    `Model: ${promotion.draft.model.name}`,
    `Capability tier: ${promotion.draft.capability.tier}`,
    `Tracked model: ${promotion.modelPath}`,
    `Tracked job: ${jobPath ?? "not written"}`,
    ""
  ];

  lines.push("Capability reasons:");
  for (const reason of promotion.draft.capability.reasons) {
    lines.push(`- ${reason}`);
  }

  return lines.join("\n");
}

export async function promoteDraftFromArgument(
  rootDir: string,
  argument: string
): Promise<RalphDraftPromotion> {
  const draft = await runDraftFromArgument(rootDir, argument);
  const modelPath = path.join(rootDir, DEFAULT_MODELS_DIR, `${draft.model.name}.json`);
  const promotionDir = path.join(
    rootDir,
    DEFAULT_PROMOTIONS_DIR,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(draft.model.name)}`
  );
  const reportPath = path.join(promotionDir, "report.md");
  const manifestPath = path.join(promotionDir, "promotion.json");

  await fs.mkdir(path.dirname(modelPath), { recursive: true });
  await fs.mkdir(promotionDir, { recursive: true });
  await fs.writeFile(modelPath, `${serializeWorldModel(draft.model)}\n`, "utf8");

  let status: "promote" | "reject" = "reject";
  let reason = draft.capability.summary;
  let jobPath: string | undefined;

  if (draft.proof.ok && draft.capability.autoPromotable) {
    const job = buildGeneratedJob(draft);
    jobPath = path.join(rootDir, DEFAULT_GENERATED_JOBS_DIR, `${draft.model.name}.json`);
    await fs.mkdir(path.dirname(jobPath), { recursive: true });
    await fs.writeFile(jobPath, `${JSON.stringify(job, null, 2)}\n`, "utf8");
    await validateJobFile(rootDir, jobPath);
    status = "promote";
    reason = "Draft is tier A, proof passed, and a tracked job was generated.";
  } else if (!draft.proof.ok) {
    reason = "Draft proof failed; tracked model was written but tracked job promotion was blocked.";
  } else {
    reason =
      "Draft is not auto-promotable yet; tracked model was written but tracked job promotion was blocked.";
  }

  const promotion: RalphDraftPromotion = {
    status,
    reason,
    draft,
    modelPath,
    ...(jobPath ? { jobPath } : {}),
    promotionDir,
    reportPath
  };

  await Promise.all([
    fs.writeFile(reportPath, `${formatPromotionReport(promotion, jobPath)}\n`, "utf8"),
    fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          status,
          reason,
          draftId: draft.draftId,
          modelPath,
          jobPath,
          capability: draft.capability
        },
        null,
        2
      )}\n`,
      "utf8"
    )
  ]);

  return promotion;
}
