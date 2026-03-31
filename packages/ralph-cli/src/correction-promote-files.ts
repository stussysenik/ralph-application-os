import fs from "node:fs/promises";
import path from "node:path";

import type { SemanticCorrectionMemory } from "@ralph/semantic-kernel";

import {
  loadCorrectionMemoriesFromPath,
  promoteCorrectionMemories
} from "./correction-memory-files.js";

const DEFAULT_CORRECTION_PROMOTIONS_DIR = "artifacts/ralph/correction-promotions";

export interface RalphCorrectionPromotionRun {
  sourcePath: string;
  memories: SemanticCorrectionMemory[];
  writtenPaths: string[];
  promotionDir: string;
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

function formatCorrectionPromotionReport(run: RalphCorrectionPromotionRun): string {
  const lines = [
    "Ralph Correction Memory Promotion",
    `Source: ${run.sourcePath}`,
    `Memories promoted: ${run.memories.length}`,
    ""
  ];

  for (const [index, memory] of run.memories.entries()) {
    lines.push(`- ${memory.title}: ${memory.recommendation}`);
    lines.push(`  tracked: ${run.writtenPaths[index] ?? "missing"}`);
  }

  return lines.join("\n");
}

export async function promoteCorrectionMemoriesFromArgument(
  rootDir: string,
  argument: string
): Promise<RalphCorrectionPromotionRun> {
  const { sourcePath, memories } = await loadCorrectionMemoriesFromPath(rootDir, argument);
  const writtenPaths = await promoteCorrectionMemories(rootDir, memories);
  const promotionDir = path.join(
    rootDir,
    DEFAULT_CORRECTION_PROMOTIONS_DIR,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(path.basename(sourcePath, ".json"))}`
  );
  const manifestPath = path.join(promotionDir, "manifest.json");
  const reportPath = path.join(promotionDir, "report.md");

  await fs.mkdir(promotionDir, { recursive: true });
  const run: RalphCorrectionPromotionRun = {
    sourcePath,
    memories,
    writtenPaths,
    promotionDir,
    manifestPath,
    reportPath
  };

  await Promise.all([
    fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          sourcePath,
          memoryCount: memories.length,
          artifactFiles: {
            report: "report.md"
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    ),
    fs.writeFile(reportPath, `${formatCorrectionPromotionReport(run)}\n`, "utf8")
  ]);

  return run;
}
