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

  it("asks compiler-specific questions for compiler prompts", () => {
    const brief: RalphInterviewBrief = {
      prompt: "Build a toy optimizing compiler from a small Lisp to WebAssembly."
    };

    const questions = buildInterviewQuestions(brief);

    expect(questions.some((question) => question.id === "source-language-and-target")).toBe(true);
    expect(
      questions.some((question) => question.id === "correctness-and-optimization-regime")
    ).toBe(true);
  });

  it("asks extraction and ranking questions for vision-assisted shopping prompts", () => {
    const brief: RalphInterviewBrief = {
      prompt:
        "Build a computer vision app that scans food ingredients, recommends healthier alternatives, price matches equivalent products, and helps users compare options while shopping."
    };

    const questions = buildInterviewQuestions(brief);

    expect(
      questions.some((question) => question.id === "capture-extraction-and-provenance")
    ).toBe(true);
    expect(
      questions.some((question) => question.id === "alternative-ranking-and-price-comparison")
    ).toBe(true);
  });

  it("asks kernel-specific resource and capability questions for kernel prompts", () => {
    const brief: RalphInterviewBrief = {
      prompt: "Build a capability-based kernel with process scheduling and virtual memory."
    };

    const questions = buildInterviewQuestions(brief);

    expect(
      questions.some((question) => question.id === "capability-and-privilege-boundaries")
    ).toBe(true);
    expect(questions.some((question) => question.id === "resource-model-and-scheduling")).toBe(
      true
    );
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
