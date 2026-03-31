import { describe, expect, it } from "vitest";

import { buildIdeationBrief } from "../src/index.js";

describe("buildIdeationBrief", () => {
  it("classifies compiler prompts into architecture-spec execution", () => {
    const brief = buildIdeationBrief({
      prompt: "Build a toy optimizing compiler from a small Lisp to WebAssembly."
    });

    expect(brief.primaryCategory).toBe("compiler-toolchain");
    expect(brief.executionMode).toBe("architecture-spec");
    expect(brief.interviewFocusIds).toContain("source-language-and-target");
    expect(brief.recommendedLanguages).toContain("Common Lisp");
  });

  it("keeps workflow-heavy prompts on the interactive runtime path", () => {
    const brief = buildIdeationBrief({
      prompt: "Build a vendor approval workflow app for finance operators."
    });

    expect(brief.primaryCategory).toBe("workflow-app");
    expect(brief.executionMode).toBe("interactive-runtime");
    expect(brief.builderTargets).toContain("workflow runtime");
  });

  it("treats kernel prompts as architecture-first systems work", () => {
    const brief = buildIdeationBrief({
      prompt: "Build a capability-based kernel with process scheduling and virtual memory."
    });

    expect(brief.primaryCategory).toBe("system-kernel");
    expect(brief.executionMode).toBe("architecture-spec");
    expect(brief.proofRegime).toContain("capability and isolation checks");
    expect(brief.secondaryCategories).not.toContain("compiler-toolchain");
    expect(brief.secondaryCategories).not.toContain("agent-system");
  });
});
