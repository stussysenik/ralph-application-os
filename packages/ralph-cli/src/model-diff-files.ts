import fs from "node:fs/promises";
import path from "node:path";

import {
  benchmarkModels,
  diffWorldModels,
  serializeWorldModel,
  validateWorldModel,
  type SemanticWorldModel,
  type SemanticWorldModelDiff
} from "@ralph/semantic-kernel";

const DEFAULT_MODEL_DIFFS_DIR = "artifacts/ralph/model-diffs";

export interface RalphModelInput {
  label: string;
  sourcePath?: string;
  model: SemanticWorldModel;
}

export interface RalphModelDiffRun {
  left: RalphModelInput;
  right: RalphModelInput;
  diff: SemanticWorldModelDiff;
  diffDir: string;
  manifestPath: string;
  diffPath: string;
  reportPath: string;
  leftPath: string;
  rightPath: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function pathExists(candidatePath: string): Promise<boolean> {
  try {
    await fs.access(candidatePath);
    return true;
  } catch {
    return false;
  }
}

function validateLoadedModel(model: SemanticWorldModel, label: string): SemanticWorldModel {
  const validation = validateWorldModel(model);

  if (!validation.ok) {
    const detail = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid world model for ${label}: ${detail}`);
  }

  return model;
}

async function loadWorldModelFromJsonFile(filePath: string): Promise<SemanticWorldModel> {
  const raw = JSON.parse(await fs.readFile(filePath, "utf8")) as {
    worldModel?: SemanticWorldModel;
  };
  const model = raw.worldModel ?? (raw as SemanticWorldModel);

  return validateLoadedModel(model, filePath);
}

export async function resolveWorldModelInput(
  rootDir: string,
  argument: string
): Promise<RalphModelInput> {
  const trimmed = argument.trim();

  if (trimmed.length === 0) {
    throw new Error("Model diff input must not be empty.");
  }

  const benchmarkMatch = benchmarkModels.find((model) => model.name === trimmed);

  if (benchmarkMatch) {
    return {
      label: `benchmark:${benchmarkMatch.name}`,
      model: benchmarkMatch
    };
  }

  const resolvedPath = path.resolve(rootDir, trimmed);
  const stat = await fs.stat(resolvedPath).catch(() => null);

  if (stat?.isDirectory()) {
    const worldModelPath = path.join(resolvedPath, "world-model.json");

    if (!(await pathExists(worldModelPath))) {
      throw new Error(`Model diff directory does not contain world-model.json: ${resolvedPath}`);
    }

    return {
      label: path.relative(rootDir, worldModelPath) || worldModelPath,
      sourcePath: worldModelPath,
      model: await loadWorldModelFromJsonFile(worldModelPath)
    };
  }

  if (stat?.isFile()) {
    return {
      label: path.relative(rootDir, resolvedPath) || resolvedPath,
      sourcePath: resolvedPath,
      model: await loadWorldModelFromJsonFile(resolvedPath)
    };
  }

  throw new Error(`Model diff input not found: ${resolvedPath}`);
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatModelDiffReport(run: RalphModelDiffRun): string {
  const lines = [
    "Ralph Semantic Model Diff",
    `Left: ${run.left.label}`,
    `Right: ${run.right.label}`,
    `Same: ${run.diff.same ? "YES" : "NO"}`,
    `Summary: ${run.diff.summary.added} added, ${run.diff.summary.removed} removed, ${run.diff.summary.changed} changed`,
    ""
  ];

  if (run.diff.changes.length === 0) {
    lines.push("No semantic changes detected.");
    return lines.join("\n");
  }

  lines.push("Changes:");

  for (const change of run.diff.changes) {
    lines.push(`- [${change.kind}] ${change.path}: ${change.detail}`);

    if (change.before !== undefined) {
      lines.push(`  before: ${formatValue(change.before)}`);
    }

    if (change.after !== undefined) {
      lines.push(`  after: ${formatValue(change.after)}`);
    }
  }

  return lines.join("\n");
}

export async function runModelDiffFromArguments(
  rootDir: string,
  leftArgument: string,
  rightArgument: string
): Promise<RalphModelDiffRun> {
  const [left, right] = await Promise.all([
    resolveWorldModelInput(rootDir, leftArgument),
    resolveWorldModelInput(rootDir, rightArgument)
  ]);
  const diff = diffWorldModels(left.model, right.model);
  const diffId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(left.model.name)}-vs-${slugify(right.model.name)}`;
  const diffDir = path.join(rootDir, DEFAULT_MODEL_DIFFS_DIR, diffId);
  const manifestPath = path.join(diffDir, "manifest.json");
  const diffPath = path.join(diffDir, "diff.json");
  const reportPath = path.join(diffDir, "report.md");
  const leftPath = path.join(diffDir, "left.json");
  const rightPath = path.join(diffDir, "right.json");

  await fs.mkdir(diffDir, { recursive: true });

  const run: RalphModelDiffRun = {
    left,
    right,
    diff,
    diffDir,
    manifestPath,
    diffPath,
    reportPath,
    leftPath,
    rightPath
  };

  await Promise.all([
    fs.writeFile(leftPath, `${serializeWorldModel(left.model)}\n`, "utf8"),
    fs.writeFile(rightPath, `${serializeWorldModel(right.model)}\n`, "utf8"),
    fs.writeFile(diffPath, `${JSON.stringify(diff, null, 2)}\n`, "utf8"),
    fs.writeFile(reportPath, `${formatModelDiffReport(run)}\n`, "utf8"),
    fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          left: left.label,
          right: right.label,
          summary: diff.summary,
          same: diff.same,
          artifactFiles: {
            left: "left.json",
            right: "right.json",
            diff: "diff.json",
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
