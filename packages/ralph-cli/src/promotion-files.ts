import fs from "node:fs/promises";
import path from "node:path";

import { type RalphJob } from "@ralph/agent-swarm";
import {
  harvestCorrectionMemoriesFromAcceptedModel,
  serializeWorldModel,
  type SemanticCorrectionMemory
} from "@ralph/semantic-kernel";

import { enrichHarvestedCorrectionMemories } from "./correction-harvest-files.js";
import { promoteCorrectionMemories } from "./correction-memory-files.js";
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
  harvestedCorrections: SemanticCorrectionMemory[];
  correctionMemoryPath: string;
  trackedCorrectionPaths: string[];
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
      `Promoted from draft synthesis for ${draft.model.name}.`,
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
    `Correction memory artifact: ${promotion.correctionMemoryPath}`,
    ""
  ];

  lines.push("Capability reasons:");
  for (const reason of promotion.draft.capability.reasons) {
    lines.push(`- ${reason}`);
  }

  lines.push("");
  lines.push("Harvested Correction Memory:");
  if (promotion.harvestedCorrections.length === 0) {
    lines.push("- none");
  } else {
    for (const memory of promotion.harvestedCorrections) {
      lines.push(`- ${memory.title}: ${memory.recommendation}`);
    }
  }

  lines.push("");
  lines.push("Tracked Correction Memory:");
  if (promotion.trackedCorrectionPaths.length === 0) {
    lines.push("- none");
  } else {
    for (const trackedPath of promotion.trackedCorrectionPaths) {
      lines.push(`- ${trackedPath}`);
    }
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
  const correctionMemoryPath = path.join(promotionDir, "correction-memory.json");
  const reportPath = path.join(promotionDir, "report.md");
  const manifestPath = path.join(promotionDir, "promotion.json");

  await fs.mkdir(path.dirname(modelPath), { recursive: true });
  await fs.mkdir(promotionDir, { recursive: true });
  await fs.writeFile(modelPath, `${serializeWorldModel(draft.model)}\n`, "utf8");

  let status: "promote" | "reject" = "reject";
  let reason = draft.capability.summary;
  let jobPath: string | undefined;
  let harvestedCorrections: SemanticCorrectionMemory[] = [];
  let trackedCorrectionPaths: string[] = [];

  if (draft.proof.ok && draft.capability.autoPromotable) {
    const job = buildGeneratedJob(draft);
    jobPath = path.join(rootDir, DEFAULT_GENERATED_JOBS_DIR, `${draft.model.name}.json`);
    await fs.mkdir(path.dirname(jobPath), { recursive: true });
    await fs.writeFile(jobPath, `${JSON.stringify(job, null, 2)}\n`, "utf8");
    await validateJobFile(rootDir, jobPath);
    status = "promote";
    reason = "Draft is tier A, proof passed, and a tracked job was generated.";
    harvestedCorrections = enrichHarvestedCorrectionMemories(
      draft.model,
      draft.answers.prompt,
      harvestCorrectionMemoriesFromAcceptedModel({
        model: draft.model,
        sourceRef: `promotion:${draft.model.name}`,
        note: reason
      })
    );
    trackedCorrectionPaths = await promoteCorrectionMemories(rootDir, harvestedCorrections);
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
    harvestedCorrections,
    correctionMemoryPath,
    trackedCorrectionPaths,
    promotionDir,
    reportPath
  };

  await Promise.all([
    fs.writeFile(
      correctionMemoryPath,
      `${JSON.stringify(harvestedCorrections, null, 2)}\n`,
      "utf8"
    ),
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
          capability: draft.capability,
          correctionMemoryPath,
          trackedCorrectionPaths
        },
        null,
        2
      )}\n`,
      "utf8"
    )
  ]);

  return promotion;
}
