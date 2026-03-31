import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runInterviewFromArgument } from "../src/interview-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-interview-"));
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

describe("runInterviewFromArgument", () => {
  it("writes prompt-first interview artifacts", async () => {
    const rootDir = await createTempRoot();
    const {
      interviewDir,
      ideationPath,
      reportPath,
      questionsPath,
      answersTemplatePath,
      questions
    } =
      await runInterviewFromArgument(
        rootDir,
        "Build a screenshot studio for marketers to capture pages and share annotated images."
      );

    const [reportRaw, ideationRaw, questionsRaw, answersTemplateRaw] = await Promise.all([
      fs.readFile(reportPath, "utf8"),
      fs.readFile(ideationPath, "utf8"),
      fs.readFile(questionsPath, "utf8"),
      fs.readFile(answersTemplatePath, "utf8")
    ]);

    expect(questions.length).toBeGreaterThan(2);
    expect(path.dirname(reportPath)).toBe(interviewDir);
    expect(reportRaw).toContain("Ralph Interview Loop");
    expect(reportRaw).toContain("Primary category:");
    expect(ideationRaw).toContain('"primaryCategory"');
    expect(questionsRaw).toContain("target-surface");
    expect(answersTemplateRaw).toContain("# Ralph Interview Answers");
    expect(answersTemplateRaw).toContain("Execution Mode:");
    expect(answersTemplateRaw).toContain("Answer:");
  });
});
