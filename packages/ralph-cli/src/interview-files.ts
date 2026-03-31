import fs from "node:fs/promises";
import path from "node:path";

import {
  buildInterviewQuestions,
  formatInterviewQuestions,
  type RalphInterviewBrief,
  type RalphInterviewQuestion
} from "@ralph/agent-swarm";

import { loadJobFile } from "./job-files.js";

const DEFAULT_INTERVIEWS_DIR = "artifacts/ralph/interviews";

export interface RalphInterviewRun {
  brief: RalphInterviewBrief;
  questions: RalphInterviewQuestion[];
  interviewDir: string;
  briefPath: string;
  questionsPath: string;
  reportPath: string;
  answersTemplatePath: string;
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

async function buildInterviewBriefFromArgument(
  rootDir: string,
  argument: string
): Promise<{ slug: string; brief: RalphInterviewBrief }> {
  const trimmed = argument.trim();

  if (trimmed.length === 0) {
    throw new Error("Interview input must not be empty.");
  }

  const likelyPath = path.resolve(rootDir, trimmed);
  const isJobFile = trimmed.endsWith(".json") && (await pathExists(likelyPath));

  if (isJobFile) {
    const job = await loadJobFile(rootDir, likelyPath);

    return {
      slug: job.id,
      brief: {
        prompt: job.prompt,
        ...(job.benchmarkName ? { benchmarkName: job.benchmarkName } : {}),
        ...(job.worldModel ? { worldModel: job.worldModel } : {}),
        ...(job.inputs ? { inputs: job.inputs } : {}),
        ...(job.implementationPreferences
          ? { implementationPreferences: job.implementationPreferences }
          : {})
      }
    };
  }

  return {
    slug: slugify(trimmed) || "interview",
    brief: {
      prompt: trimmed
    }
  };
}

function formatInterviewAnswerTemplate(
  brief: RalphInterviewBrief,
  questions: RalphInterviewQuestion[]
): string {
  const lines = [
    "# Ralph Interview Answers",
    "",
    `Prompt: ${brief.prompt}`,
    "",
    "Instructions:",
    "- answer the blocking questions first",
    "- keep answers concrete and short",
    "- languages and frameworks are optional unless they are true constraints",
    ""
  ];

  for (const question of questions) {
    lines.push(`## ${question.id}`);
    lines.push(`Category: ${question.category}`);
    lines.push(`Priority: ${question.priority}${question.blocking ? " (blocking)" : ""}`);
    lines.push(`Question: ${question.prompt}`);
    lines.push(`Why: ${question.rationale}`);
    lines.push("Answer:");
    lines.push("- TODO");
    lines.push("");
  }

  return lines.join("\n");
}

export async function runInterviewFromArgument(
  rootDir: string,
  argument: string
): Promise<RalphInterviewRun> {
  const { slug, brief } = await buildInterviewBriefFromArgument(rootDir, argument);
  const questions = buildInterviewQuestions(brief);
  const interviewDir = path.join(
    rootDir,
    DEFAULT_INTERVIEWS_DIR,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${slug}`
  );
  const briefPath = path.join(interviewDir, "brief.json");
  const questionsPath = path.join(interviewDir, "questions.json");
  const reportPath = path.join(interviewDir, "report.md");
  const answersTemplatePath = path.join(interviewDir, "answers.template.md");

  await fs.mkdir(interviewDir, { recursive: true });
  await Promise.all([
    fs.writeFile(briefPath, `${JSON.stringify(brief, null, 2)}\n`, "utf8"),
    fs.writeFile(questionsPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8"),
    fs.writeFile(reportPath, `${formatInterviewQuestions(brief, questions)}\n`, "utf8"),
    fs.writeFile(
      answersTemplatePath,
      `${formatInterviewAnswerTemplate(brief, questions)}\n`,
      "utf8"
    )
  ]);

  return {
    brief,
    questions,
    interviewDir,
    briefPath,
    questionsPath,
    reportPath,
    answersTemplatePath
  };
}
