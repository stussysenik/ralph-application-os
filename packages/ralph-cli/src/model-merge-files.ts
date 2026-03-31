import fs from "node:fs/promises";
import path from "node:path";

import {
  mergeSemanticWorldModels,
  serializeWorldModel,
  type SemanticWorldModelMergeResult
} from "@ralph/semantic-kernel";
import { runKernelProofs, type ProofResult } from "@ralph/proof-harness";

import { resolveWorldModelInput, type RalphModelInput } from "./model-diff-files.js";

const DEFAULT_MODEL_MERGES_DIR = "artifacts/ralph/model-merges";

export interface RalphModelMergeRun {
  base: RalphModelInput;
  left: RalphModelInput;
  right: RalphModelInput;
  merge: SemanticWorldModelMergeResult;
  proof?: ProofResult;
  mergeDir: string;
  manifestPath: string;
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

function formatOperation(operation: { op: string; path: string[] | string }): string {
  const pathValue = Array.isArray(operation.path) ? operation.path.join(".") : operation.path;
  return `${operation.op.toUpperCase()} ${pathValue}`;
}

function formatModelMergeReport(run: RalphModelMergeRun): string {
  const lines = [
    "Ralph Semantic Model Merge",
    `Base: ${run.base.label}`,
    `Left: ${run.left.label}`,
    `Right: ${run.right.label}`,
    `Status: ${run.merge.ok ? "MERGED" : "CONFLICT"}`,
    `Left patch ops: ${run.merge.leftPatch.operations.length}`,
    `Right patch ops: ${run.merge.rightPatch.operations.length}`,
    `Merged patch ops: ${run.merge.mergedPatch.operations.length}`,
    `Conflicts: ${run.merge.conflicts.length}`,
    ""
  ];

  if (run.merge.validationError) {
    lines.push(`Validation error: ${run.merge.validationError}`);
    lines.push("");
  }

  if (run.merge.conflicts.length > 0) {
    lines.push("Conflicts:");
    for (const conflict of run.merge.conflicts) {
      lines.push(`- ${conflict.path}: ${conflict.reason}`);
      lines.push(`  left: ${formatOperation(conflict.leftOperation)}`);
      lines.push(`  right: ${formatOperation(conflict.rightOperation)}`);
    }
    lines.push("");
  }

  if (run.merge.ok && run.proof) {
    lines.push(`Proof: ${run.proof.ok ? "PASS" : "FAIL"}`);
    for (const check of run.proof.checks) {
      lines.push(`- [${check.ok ? "pass" : "fail"}] ${check.name}: ${check.detail}`);
    }
    lines.push("");
  }

  lines.push("Merged operations:");
  for (const operation of run.merge.mergedPatch.operations) {
    lines.push(`- ${formatOperation(operation)}`);
  }

  return lines.join("\n");
}

export async function runModelMergeFromArguments(
  rootDir: string,
  baseArgument: string,
  leftArgument: string,
  rightArgument: string
): Promise<RalphModelMergeRun> {
  const [base, left, right] = await Promise.all([
    resolveWorldModelInput(rootDir, baseArgument),
    resolveWorldModelInput(rootDir, leftArgument),
    resolveWorldModelInput(rootDir, rightArgument)
  ]);
  const merge = mergeSemanticWorldModels(base.model, left.model, right.model);
  const proof = merge.ok && merge.mergedModel ? runKernelProofs(merge.mergedModel) : undefined;
  const mergeId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(base.model.name)}-merge`;
  const mergeDir = path.join(rootDir, DEFAULT_MODEL_MERGES_DIR, mergeId);
  const manifestPath = path.join(mergeDir, "manifest.json");
  const reportPath = path.join(mergeDir, "report.md");

  await fs.mkdir(mergeDir, { recursive: true });

  const run: RalphModelMergeRun = {
    base,
    left,
    right,
    merge,
    ...(proof ? { proof } : {}),
    mergeDir,
    manifestPath,
    reportPath
  };

  await Promise.all([
    fs.writeFile(path.join(mergeDir, "base.json"), `${serializeWorldModel(base.model)}\n`, "utf8"),
    fs.writeFile(path.join(mergeDir, "left.json"), `${serializeWorldModel(left.model)}\n`, "utf8"),
    fs.writeFile(path.join(mergeDir, "right.json"), `${serializeWorldModel(right.model)}\n`, "utf8"),
    fs.writeFile(path.join(mergeDir, "left-patch.json"), `${JSON.stringify(merge.leftPatch, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(mergeDir, "right-patch.json"), `${JSON.stringify(merge.rightPatch, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(mergeDir, "merged-patch.json"), `${JSON.stringify(merge.mergedPatch, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(mergeDir, "conflicts.json"), `${JSON.stringify(merge.conflicts, null, 2)}\n`, "utf8"),
    ...(merge.ok && merge.mergedModel
      ? [
          fs.writeFile(path.join(mergeDir, "merged.json"), `${serializeWorldModel(merge.mergedModel)}\n`, "utf8"),
          fs.writeFile(path.join(mergeDir, "proof.json"), `${JSON.stringify(proof, null, 2)}\n`, "utf8")
        ]
      : []),
    fs.writeFile(reportPath, `${formatModelMergeReport(run)}\n`, "utf8"),
    fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          base: base.label,
          left: left.label,
          right: right.label,
          ok: merge.ok,
          conflictCount: merge.conflicts.length,
          proofOk: proof?.ok,
          artifactFiles: {
            base: "base.json",
            left: "left.json",
            right: "right.json",
            leftPatch: "left-patch.json",
            rightPatch: "right-patch.json",
            mergedPatch: "merged-patch.json",
            conflicts: "conflicts.json",
            ...(merge.ok && merge.mergedModel ? { merged: "merged.json", proof: "proof.json" } : {}),
            report: "report.md"
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    )
  ]);

  return run;
}
