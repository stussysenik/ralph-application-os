import fs from "node:fs/promises";
import path from "node:path";

import type {
  SemanticCorrectionKind,
  SemanticCorrectionMemory
} from "@ralph/semantic-kernel";

const DEFAULT_CORRECTIONS_DIR = ".ralph/corrections";

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

async function listJsonFiles(directory: string): Promise<string[]> {
  if (!(await pathExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listJsonFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    })
  );

  return nested.flat().sort();
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCorrectionKind(value: unknown): value is SemanticCorrectionKind {
  return (
    value === "relation" ||
    value === "policy" ||
    value === "workflow" ||
    value === "view" ||
    value === "ranking" ||
    value === "privacy" ||
    value === "ontology" ||
    value === "runtime"
  );
}

function parseCorrectionMemory(
  raw: unknown,
  sourcePath: string
): SemanticCorrectionMemory {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Invalid correction memory in ${sourcePath}: expected object.`);
  }

  const record = raw as Record<string, unknown>;

  if (typeof record.id !== "string" || record.id.trim().length === 0) {
    throw new Error(`Invalid correction memory in ${sourcePath}: missing id.`);
  }

  if (typeof record.title !== "string" || record.title.trim().length === 0) {
    throw new Error(`Invalid correction memory in ${sourcePath}: missing title.`);
  }

  if (!isCorrectionKind(record.kind)) {
    throw new Error(`Invalid correction memory in ${sourcePath}: unknown kind.`);
  }

  if (typeof record.summary !== "string" || record.summary.trim().length === 0) {
    throw new Error(`Invalid correction memory in ${sourcePath}: missing summary.`);
  }

  if (
    typeof record.recommendation !== "string" ||
    record.recommendation.trim().length === 0
  ) {
    throw new Error(`Invalid correction memory in ${sourcePath}: missing recommendation.`);
  }

  if (!record.source || typeof record.source !== "object") {
    throw new Error(`Invalid correction memory in ${sourcePath}: missing source.`);
  }

  const source = record.source as Record<string, unknown>;

  if (
    source.sourceType !== "benchmark" &&
    source.sourceType !== "prompt" &&
    source.sourceType !== "repo" &&
    source.sourceType !== "doc" &&
    source.sourceType !== "human-edit"
  ) {
    throw new Error(`Invalid correction memory in ${sourcePath}: unknown sourceType.`);
  }

  if (typeof source.sourceRef !== "string" || source.sourceRef.trim().length === 0) {
    throw new Error(`Invalid correction memory in ${sourcePath}: missing sourceRef.`);
  }

  return {
    id: record.id,
    title: record.title,
    kind: record.kind,
    summary: record.summary,
    recommendation: record.recommendation,
    ...(isStringArray(record.categories) ? { categories: record.categories } : {}),
    ...(isStringArray(record.domains) ? { domains: record.domains } : {}),
    ...(isStringArray(record.promptKeywords) ? { promptKeywords: record.promptKeywords } : {}),
    ...(isStringArray(record.entityNames) ? { entityNames: record.entityNames } : {}),
    source: {
      sourceType: source.sourceType,
      sourceRef: source.sourceRef,
      ...(typeof source.note === "string" ? { note: source.note } : {}),
      ...(typeof source.confidence === "number" ? { confidence: source.confidence } : {})
    }
  };
}

export async function loadCorrectionMemories(
  rootDir: string
): Promise<SemanticCorrectionMemory[]> {
  const correctionsDir = path.join(rootDir, DEFAULT_CORRECTIONS_DIR);
  const files = await listJsonFiles(correctionsDir);
  const parsed = await Promise.all(
    files.map(async (filePath) => {
      const raw = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
      return Array.isArray(raw)
        ? raw.map((entry) => parseCorrectionMemory(entry, filePath))
        : [parseCorrectionMemory(raw, filePath)];
    })
  );

  return parsed.flat();
}

export async function createCorrectionTemplate(
  rootDir: string,
  name: string
): Promise<{ correctionPath: string }> {
  const correctionsDir = path.join(rootDir, DEFAULT_CORRECTIONS_DIR, "examples");
  const correctionPath = path.join(correctionsDir, `${slugify(name) || "correction"}.json`);

  await fs.mkdir(correctionsDir, { recursive: true });

  const template: SemanticCorrectionMemory = {
    id: slugify(name) || "correction",
    title: name.trim() || "New Correction",
    kind: "relation",
    summary: "Describe the semantic gap this correction closes.",
    recommendation: "Describe the durable change Ralph should remember next time.",
    categories: ["general-product"],
    promptKeywords: ["replace-me"],
    entityNames: ["ReplaceEntity"],
    source: {
      sourceType: "human-edit",
      sourceRef: "operator:new-correction"
    }
  };

  await fs.writeFile(correctionPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");

  return { correctionPath };
}
