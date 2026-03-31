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

  it("classifies vision-assisted shopping prompts into a recommendation plan path", () => {
    const brief = buildIdeationBrief({
      prompt:
        "Build a computer vision app that scans food ingredients, recommends healthier alternatives, price matches equivalent products, and helps users compare options while shopping."
    });

    expect(brief.primaryCategory).toBe("vision-commerce");
    expect(brief.executionMode).toBe("semantic-runtime-plan");
    expect(brief.interviewFocusIds).toContain("capture-extraction-and-provenance");
    expect(brief.interviewFocusIds).toContain("alternative-ranking-and-price-comparison");
    expect(brief.recommendedLanguages).toContain("Python");
    expect(brief.improvementOpportunities).toContain(
      "Add explainable recommendation reasons so healthier or cheaper alternatives are justified by structured evidence instead of opaque ranking."
    );
  });

  it("surfaces correction-memory matches in the ideation brief when the prompt overlaps known gaps", () => {
    const brief = buildIdeationBrief({
      prompt:
        "Build a computer vision app that scans food ingredients, recommends healthier alternatives, price matches equivalent products, and helps users compare options while shopping.",
      correctionMemories: [
        {
          id: "offer-freshness",
          title: "Retailer offers need freshness",
          kind: "ranking",
          summary: "Offer data drifts quickly in shopping flows.",
          recommendation:
            "Track retailer-offer freshness and source timestamps so stale comparisons do not outrank live inventory.",
          categories: ["vision-commerce"],
          promptKeywords: ["price matches", "shopping"],
          source: {
            sourceType: "human-edit",
            sourceRef: "operator:offer-freshness-v1"
          }
        }
      ]
    });

    expect(brief.correctionMemoryMatches).toHaveLength(1);
    expect(brief.correctionMemoryMatches[0]?.memory.id).toBe("offer-freshness");
    expect(brief.improvementOpportunities).toContain(
      "Track retailer-offer freshness and source timestamps so stale comparisons do not outrank live inventory."
    );
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
