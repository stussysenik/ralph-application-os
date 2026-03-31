import { describe, expect, it } from "vitest";

import { screenshotStudioModel } from "@ralph/semantic-kernel";

import {
  buildInterviewQuestions,
  inspectRalphJob,
  type RalphInterviewBrief
} from "../src/index.js";

describe("buildInterviewQuestions", () => {
  it("asks high-value intake questions for a prompt-only brief", () => {
    const brief: RalphInterviewBrief = {
      prompt:
        "Build a screenshot studio for marketers to capture pages, annotate them, and share them."
    };

    const questions = buildInterviewQuestions(brief);

    expect(questions.some((question) => question.id === "primary-user-and-outcome")).toBe(true);
    expect(questions.some((question) => question.id === "core-records")).toBe(true);
    expect(questions.some((question) => question.id === "target-surface")).toBe(true);
  });

  it("surfaces world-model open questions and missing implementation preferences", () => {
    const brief: RalphInterviewBrief = {
      prompt: "Build screenshot studio",
      worldModel: screenshotStudioModel
    };

    const questions = buildInterviewQuestions(brief);

    expect(questions.some((question) => question.id === "open-question-sq-1")).toBe(true);
    expect(questions.some((question) => question.id === "target-surface")).toBe(true);
    expect(questions.some((question) => question.id === "language-constraints")).toBe(true);
  });

  it("does not ask for language or surface constraints when already supplied", () => {
    const brief: RalphInterviewBrief = {
      prompt: "Build screenshot studio",
      implementationPreferences: {
        targetSurfaces: ["web"],
        preferredLanguages: ["TypeScript"]
      }
    };

    const questions = buildInterviewQuestions(brief);

    expect(questions.some((question) => question.id === "target-surface")).toBe(false);
    expect(questions.some((question) => question.id === "language-constraints")).toBe(false);
  });
});

describe("inspectRalphJob", () => {
  it("accepts optional implementation preferences on jobs", () => {
    const validation = inspectRalphJob({
      id: "job-with-preferences",
      prompt: "Build a browser-based ops tool.",
      benchmarkName: "linear-like-issue-tracker",
      implementationPreferences: {
        targetSurfaces: ["web"],
        preferredLanguages: ["TypeScript"],
        preferredFrameworks: ["React"],
        nonNegotiables: ["Must stay browser-based."]
      }
    });

    expect(validation.ok).toBe(true);
  });
});
