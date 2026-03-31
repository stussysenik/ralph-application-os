import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runIdeationFromArgument } from "../src/ideation-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-ideation-"));
  createdDirectories.push(rootDir);
  return rootDir;
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  );
});

describe("runIdeationFromArgument", () => {
  it("writes cross-domain ideation artifacts, correction-memory matches, and an answer template", async () => {
    const rootDir = await createTempRoot();
    const correctionDir = path.join(rootDir, ".ralph/corrections/examples");
    const correctionPath = path.join(correctionDir, "compiler-diagnostics.json");

    await fs.mkdir(correctionDir, { recursive: true });
    await fs.writeFile(
      correctionPath,
      `${JSON.stringify(
        {
          id: "compiler-diagnostics",
          title: "Compilers need strong diagnostics",
          kind: "runtime",
          summary: "Optimization work outruns adoption when diagnostics stay weak.",
          recommendation:
            "Add source maps and high-quality error reporting before investing deeply in later optimization passes.",
          categories: ["compiler-toolchain"],
          promptKeywords: ["compiler", "webassembly"],
          source: {
            sourceType: "human-edit",
            sourceRef: "operator:compiler-v1"
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const run = await runIdeationFromArgument(
      rootDir,
      "Build a toy optimizing compiler from a small Lisp to WebAssembly."
    );
    const [
      reportRaw,
      architectureRaw,
      ideationRaw,
      manifestRaw,
      answersTemplateRaw,
      questionsRaw,
      correctionMemoryRaw
    ] = await Promise.all([
      fs.readFile(run.reportPath, "utf8"),
      fs.readFile(run.architecturePath, "utf8"),
      fs.readFile(run.ideationPath, "utf8"),
      fs.readFile(run.manifestPath, "utf8"),
      fs.readFile(run.answersTemplatePath, "utf8"),
      fs.readFile(run.questionsPath, "utf8"),
      fs.readFile(run.correctionMemoryPath, "utf8")
    ]);

    expect(path.dirname(run.reportPath)).toBe(run.ideationDir);
    expect(reportRaw).toContain("# Ralph Ideation Brief");
    expect(architectureRaw).toContain("# Ralph Architecture Outline");
    expect(architectureRaw).toContain("## Core Subsystems");
    expect(reportRaw).toContain("Primary category: compiler toolchain");
    expect(reportRaw).toContain("## Idea Improvement Opportunities");
    expect(reportRaw).toContain("## Correction Memory");
    expect(reportRaw).toContain("Compilers need strong diagnostics");
    expect(ideationRaw).toContain('"primaryCategory": "compiler-toolchain"');
    expect(ideationRaw).toContain('"improvementOpportunities"');
    expect(ideationRaw).toContain('"correctionMemoryMatches"');
    expect(manifestRaw).toContain('"executionMode": "architecture-spec"');
    expect(correctionMemoryRaw).toContain("compiler-diagnostics");
    expect(answersTemplateRaw).toContain("## source-language-and-target");
    expect(questionsRaw).toContain("correctness-and-optimization-regime");
  });
});
