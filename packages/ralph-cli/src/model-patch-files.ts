import fs from "node:fs/promises";
import path from "node:path";

import {
  applySemanticPatch,
  diffWorldModels,
  serializeWorldModel,
  type SemanticPatchDocument,
  type SemanticWorldModel
} from "@ralph/semantic-kernel";
import { runKernelProofs, type ProofResult } from "@ralph/proof-harness";

import { resolveWorldModelInput, type RalphModelInput } from "./model-diff-files.js";

const DEFAULT_MODEL_PATCHES_DIR = "artifacts/ralph/model-patches";

export interface RalphModelPatchRun {
  source: RalphModelInput;
  patch: SemanticPatchDocument;
  patchedModel: SemanticWorldModel;
  proof: ProofResult;
  patchDir: string;
  manifestPath: string;
  patchPath: string;
  originalModelPath: string;
  patchedModelPath: string;
  diffPath: string;
  proofPath: string;
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

function validatePatchDocument(value: unknown, sourcePath: string): SemanticPatchDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid patch document in ${sourcePath}: expected an object.`);
  }

  const patch = value as Partial<SemanticPatchDocument>;

  if (!Array.isArray(patch.operations)) {
    throw new Error(`Invalid patch document in ${sourcePath}: missing operations array.`);
  }

  return {
    ...(typeof patch.note === "string" ? { note: patch.note } : {}),
    operations: patch.operations
  };
}

async function resolvePatchPath(rootDir: string, argument: string): Promise<string> {
  const trimmed = argument.trim();

  if (trimmed.length === 0) {
    throw new Error("Model patch input must not be empty.");
  }

  const resolvedPath = path.resolve(rootDir, trimmed);
  const stat = await fs.stat(resolvedPath).catch(() => null);

  if (!stat?.isFile()) {
    throw new Error(`Model patch file not found: ${resolvedPath}`);
  }

  return resolvedPath;
}

async function loadPatchDocument(rootDir: string, argument: string): Promise<{
  patchPath: string;
  patch: SemanticPatchDocument;
}> {
  const patchPath = await resolvePatchPath(rootDir, argument);
  const patch = validatePatchDocument(JSON.parse(await fs.readFile(patchPath, "utf8")), patchPath);

  return { patchPath, patch };
}

function formatModelPatchReport(run: RalphModelPatchRun): string {
  const lines = [
    "Ralph Semantic Model Patch",
    `Source: ${run.source.label}`,
    `Operations: ${run.patch.operations.length}`,
    `Proof: ${run.proof.ok ? "PASS" : "FAIL"}`,
    `Diff summary: ${run.patch.operations.length} operation(s), ${run.proof.checks.filter((check) => check.ok).length}/${run.proof.checks.length} proof checks passing`,
    ""
  ];

  if (run.patch.note) {
    lines.push(`Note: ${run.patch.note}`);
    lines.push("");
  }

  lines.push("Operations:");
  for (const operation of run.patch.operations) {
    const target = Array.isArray(operation.path) ? operation.path.join(".") : operation.path;
    lines.push(`- ${operation.op.toUpperCase()} ${target}`);
  }

  lines.push("");
  lines.push("Proof checks:");
  for (const check of run.proof.checks) {
    lines.push(`- [${check.ok ? "pass" : "fail"}] ${check.name}: ${check.detail}`);
  }

  return lines.join("\n");
}

export async function runModelPatchFromArguments(
  rootDir: string,
  modelArgument: string,
  patchArgument: string
): Promise<RalphModelPatchRun> {
  const [source, patchInput] = await Promise.all([
    resolveWorldModelInput(rootDir, modelArgument),
    loadPatchDocument(rootDir, patchArgument)
  ]);
  const patchedModel = applySemanticPatch(source.model, patchInput.patch);
  const diff = diffWorldModels(source.model, patchedModel);
  const proof = runKernelProofs(patchedModel);
  const patchId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(source.model.name)}`;
  const patchDir = path.join(rootDir, DEFAULT_MODEL_PATCHES_DIR, patchId);
  const manifestPath = path.join(patchDir, "manifest.json");
  const patchPath = path.join(patchDir, "patch.json");
  const originalModelPath = path.join(patchDir, "original.json");
  const patchedModelPath = path.join(patchDir, "patched.json");
  const diffPath = path.join(patchDir, "diff.json");
  const proofPath = path.join(patchDir, "proof.json");
  const reportPath = path.join(patchDir, "report.md");

  await fs.mkdir(patchDir, { recursive: true });

  const run: RalphModelPatchRun = {
    source,
    patch: patchInput.patch,
    patchedModel,
    proof,
    patchDir,
    manifestPath,
    patchPath,
    originalModelPath,
    patchedModelPath,
    diffPath,
    proofPath,
    reportPath
  };

  await Promise.all([
    fs.writeFile(originalModelPath, `${serializeWorldModel(source.model)}\n`, "utf8"),
    fs.writeFile(patchedModelPath, `${serializeWorldModel(patchedModel)}\n`, "utf8"),
    fs.writeFile(patchPath, `${JSON.stringify(patchInput.patch, null, 2)}\n`, "utf8"),
    fs.writeFile(diffPath, `${JSON.stringify(diff, null, 2)}\n`, "utf8"),
    fs.writeFile(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8"),
    fs.writeFile(reportPath, `${formatModelPatchReport(run)}\n`, "utf8"),
    fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          source: source.label,
          patchSource: path.relative(rootDir, patchInput.patchPath) || patchInput.patchPath,
          operationCount: patchInput.patch.operations.length,
          proofOk: proof.ok,
          artifactFiles: {
            patch: "patch.json",
            originalModel: "original.json",
            patchedModel: "patched.json",
            diff: "diff.json",
            proof: "proof.json",
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
