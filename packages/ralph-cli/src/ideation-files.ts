import fs from "node:fs/promises";
import path from "node:path";

import {
  buildIdeationBrief,
  buildInterviewQuestions,
  formatArchitectureOutline,
  formatIdeationBrief,
  type RalphIdeationBrief,
  type RalphInterviewBrief,
  type RalphInterviewQuestion
} from "@ralph/agent-swarm";

import {
  buildInterviewBriefFromArgument,
  formatInterviewAnswerTemplate
} from "./interview-files.js";
import { loadCorrectionMemories } from "./correction-memory-files.js";

const DEFAULT_IDEATION_DIR = "artifacts/ralph/ideation";

export interface RalphIdeationRun {
  brief: RalphInterviewBrief;
  ideation: RalphIdeationBrief;
  questions: RalphInterviewQuestion[];
  ideationDir: string;
  briefPath: string;
  ideationPath: string;
  questionsPath: string;
  correctionMemoryPath: string;
  reportPath: string;
  architecturePath: string;
  answersTemplatePath: string;
  manifestPath: string;
}

/**
 * `ralph:ideate` is the universal prompt-first intake surface. It keeps the
 * output durable and actionable by producing both a cross-domain ideation brief
 * and the next interview artifact set in one run.
 */
export async function runIdeationFromArgument(
  rootDir: string,
  argument: string
): Promise<RalphIdeationRun> {
  const { slug, brief } = await buildInterviewBriefFromArgument(rootDir, argument);
  const correctionMemories = await loadCorrectionMemories(rootDir);
  const ideation = buildIdeationBrief({
    ...brief,
    correctionMemories
  });
  const questions = buildInterviewQuestions(brief);
  const ideationDir = path.join(
    rootDir,
    DEFAULT_IDEATION_DIR,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${slug}`
  );
  const briefPath = path.join(ideationDir, "brief.json");
  const ideationPath = path.join(ideationDir, "ideation.json");
  const questionsPath = path.join(ideationDir, "questions.json");
  const correctionMemoryPath = path.join(ideationDir, "correction-memory.json");
  const reportPath = path.join(ideationDir, "report.md");
  const architecturePath = path.join(ideationDir, "architecture.md");
  const answersTemplatePath = path.join(ideationDir, "answers.template.md");
  const manifestPath = path.join(ideationDir, "manifest.json");
  const manifest = {
    prompt: brief.prompt,
    primaryCategory: ideation.primaryCategory,
    executionMode: ideation.executionMode,
    confidence: ideation.confidence,
    artifacts: {
      brief: "brief.json",
      ideation: "ideation.json",
      questions: "questions.json",
      correctionMemory: "correction-memory.json",
      report: "report.md",
      architecture: "architecture.md",
      answersTemplate: "answers.template.md"
    }
  };

  await fs.mkdir(ideationDir, { recursive: true });
  await Promise.all([
    fs.writeFile(briefPath, `${JSON.stringify(brief, null, 2)}\n`, "utf8"),
    fs.writeFile(ideationPath, `${JSON.stringify(ideation, null, 2)}\n`, "utf8"),
    fs.writeFile(questionsPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8"),
    fs.writeFile(
      correctionMemoryPath,
      `${JSON.stringify(ideation.correctionMemoryMatches, null, 2)}\n`,
      "utf8"
    ),
    fs.writeFile(reportPath, `${formatIdeationBrief(ideation)}\n`, "utf8"),
    fs.writeFile(
      architecturePath,
      `${formatArchitectureOutline(ideation, questions)}\n`,
      "utf8"
    ),
    fs.writeFile(
      answersTemplatePath,
      `${formatInterviewAnswerTemplate(brief, questions)}\n`,
      "utf8"
    ),
    fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  ]);

  return {
    brief,
    ideation,
    questions,
    ideationDir,
    briefPath,
    ideationPath,
    questionsPath,
    correctionMemoryPath,
    reportPath,
    architecturePath,
    answersTemplatePath,
    manifestPath
  };
}
