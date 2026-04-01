import fs from "node:fs/promises";
import path from "node:path";

import {
  applySemanticPatch,
  compileRuntimeEditHarvest,
  diffWorldModels,
  parseRuntimeEditExport,
  serializeWorldModel,
  type SemanticCorrectionMemory,
  type SemanticPatchDocument,
  type SemanticRuntimeEditExport,
  type SemanticWorldModel
} from "@ralph/semantic-kernel";
import { runKernelProofs, type ProofResult } from "@ralph/proof-harness";

import { enrichHarvestedCorrectionMemories } from "./correction-harvest-files.js";
import { resolveWorldModelInput, type RalphModelInput } from "./model-diff-files.js";

const DEFAULT_RUNTIME_HARVESTS_DIR = "artifacts/ralph/runtime-harvests";

export interface RalphRuntimeEditHarvestRun {
  source: RalphModelInput;
  runtimeEditExport: SemanticRuntimeEditExport;
  patch: SemanticPatchDocument;
  patchedModel: SemanticWorldModel;
  harvestedCorrections: SemanticCorrectionMemory[];
  proof: ProofResult;
  harvestDir: string;
  manifestPath: string;
  runtimeEditExportPath: string;
  patchPath: string;
  originalModelPath: string;
  patchedModelPath: string;
  diffPath: string;
  proofPath: string;
  correctionMemoryPath: string;
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

async function resolveRuntimeEditExportPath(
  rootDir: string,
  argument: string
): Promise<string> {
  const trimmed = argument.trim();

  if (trimmed.length === 0) {
    throw new Error("Runtime edit export input must not be empty.");
  }

  const resolvedPath = path.resolve(rootDir, trimmed);
  const stat = await fs.stat(resolvedPath).catch(() => null);

  if (!stat?.isFile()) {
    throw new Error(`Runtime edit export file not found: ${resolvedPath}`);
  }

  return resolvedPath;
}

async function loadRuntimeEditExport(rootDir: string, argument: string): Promise<{
  runtimeEditExportPath: string;
  runtimeEditExport: SemanticRuntimeEditExport;
}> {
  const runtimeEditExportPath = await resolveRuntimeEditExportPath(rootDir, argument);
  const raw = JSON.parse(await fs.readFile(runtimeEditExportPath, "utf8"));

  return {
    runtimeEditExportPath,
    runtimeEditExport: parseRuntimeEditExport(raw, runtimeEditExportPath)
  };
}

function formatRuntimeHarvestReport(run: RalphRuntimeEditHarvestRun, summary: string): string {
  const lines = [
    "Ralph Runtime Edit Harvest",
    `Source: ${run.source.label}`,
    `Export: ${run.runtimeEditExportPath}`,
    summary,
    `Patch operations: ${run.patch.operations.length}`,
    `Proof: ${run.proof.ok ? "PASS" : "FAIL"}`,
    ""
  ];

  if (run.patch.note) {
    lines.push(`Note: ${run.patch.note}`);
    lines.push("");
  }

  if (run.patch.operations.length > 0) {
    lines.push("Patch operations:");
    for (const operation of run.patch.operations) {
      const target = Array.isArray(operation.path) ? operation.path.join(".") : operation.path;
      lines.push(`- ${operation.op.toUpperCase()} ${target}`);
    }
    lines.push("");
  }

  lines.push("Proof checks:");
  for (const check of run.proof.checks) {
    lines.push(`- [${check.ok ? "pass" : "fail"}] ${check.name}: ${check.detail}`);
  }

  if (run.harvestedCorrections.length > 0) {
    lines.push("");
    lines.push("Harvested correction memory:");
    for (const memory of run.harvestedCorrections) {
      lines.push(`- ${memory.title}: ${memory.recommendation}`);
    }
  }

  return lines.join("\n");
}

export async function runRuntimeEditHarvestFromArguments(
  rootDir: string,
  modelArgument: string,
  runtimeEditArgument: string
): Promise<RalphRuntimeEditHarvestRun> {
  const [source, runtimeEditInput] = await Promise.all([
    resolveWorldModelInput(rootDir, modelArgument),
    loadRuntimeEditExport(rootDir, runtimeEditArgument)
  ]);
  const harvest = compileRuntimeEditHarvest({
    model: source.model,
    runtimeEditExport: runtimeEditInput.runtimeEditExport
  });
  const patchedModel =
    harvest.patch.operations.length > 0
      ? applySemanticPatch(source.model, harvest.patch)
      : source.model;
  const diff = diffWorldModels(source.model, patchedModel);
  const proof = runKernelProofs(patchedModel);
  const harvestedCorrections = enrichHarvestedCorrectionMemories(
    patchedModel,
    harvest.patch.note,
    harvest.harvestedCorrections
  );
  const harvestId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(source.model.name)}`;
  const harvestDir = path.join(rootDir, DEFAULT_RUNTIME_HARVESTS_DIR, harvestId);
  const manifestPath = path.join(harvestDir, "manifest.json");
  const runtimeEditExportPath = path.join(harvestDir, "runtime-edit-export.json");
  const patchPath = path.join(harvestDir, "patch.json");
  const originalModelPath = path.join(harvestDir, "original.json");
  const patchedModelPath = path.join(harvestDir, "patched.json");
  const diffPath = path.join(harvestDir, "diff.json");
  const proofPath = path.join(harvestDir, "proof.json");
  const correctionMemoryPath = path.join(harvestDir, "correction-memory.json");
  const reportPath = path.join(harvestDir, "report.md");

  await fs.mkdir(harvestDir, { recursive: true });

  const run: RalphRuntimeEditHarvestRun = {
    source,
    runtimeEditExport: runtimeEditInput.runtimeEditExport,
    patch: harvest.patch,
    patchedModel,
    harvestedCorrections,
    proof,
    harvestDir,
    manifestPath,
    runtimeEditExportPath,
    patchPath,
    originalModelPath,
    patchedModelPath,
    diffPath,
    proofPath,
    correctionMemoryPath,
    reportPath
  };

  await Promise.all([
    fs.writeFile(originalModelPath, `${serializeWorldModel(source.model)}\n`, "utf8"),
    fs.writeFile(patchedModelPath, `${serializeWorldModel(patchedModel)}\n`, "utf8"),
    fs.writeFile(
      runtimeEditExportPath,
      `${JSON.stringify(runtimeEditInput.runtimeEditExport, null, 2)}\n`,
      "utf8"
    ),
    fs.writeFile(patchPath, `${JSON.stringify(harvest.patch, null, 2)}\n`, "utf8"),
    fs.writeFile(diffPath, `${JSON.stringify(diff, null, 2)}\n`, "utf8"),
    fs.writeFile(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8"),
    fs.writeFile(
      correctionMemoryPath,
      `${JSON.stringify(harvestedCorrections, null, 2)}\n`,
      "utf8"
    ),
    fs.writeFile(reportPath, `${formatRuntimeHarvestReport(run, harvest.summary)}\n`, "utf8"),
    fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          source: source.label,
          runtimeEditSource:
            path.relative(rootDir, runtimeEditInput.runtimeEditExportPath) ||
            runtimeEditInput.runtimeEditExportPath,
          proofOk: proof.ok,
          patchOperationCount: harvest.patch.operations.length,
          correctionMemoryCount: harvestedCorrections.length,
          artifactFiles: {
            runtimeEditExport: "runtime-edit-export.json",
            patch: "patch.json",
            originalModel: "original.json",
            patchedModel: "patched.json",
            diff: "diff.json",
            proof: "proof.json",
            correctionMemory: "correction-memory.json",
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
