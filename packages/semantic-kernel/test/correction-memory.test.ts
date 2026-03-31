import { describe, expect, it } from "vitest";

import { matchCorrectionMemories, type SemanticCorrectionMemory } from "../src/index.js";

const correctionMemories: SemanticCorrectionMemory[] = [
  {
    id: "vision-offer-freshness",
    title: "Retailer offer freshness matters",
    kind: "ranking",
    summary: "Price and stock data drift quickly in shopping products.",
    recommendation:
      "Model retailer offer freshness and source timestamps before treating offers as stable recommendations.",
    categories: ["vision-commerce"],
    domains: ["shopping"],
    promptKeywords: ["price match", "retailer", "shopping"],
    entityNames: ["RetailerOffer", "AlternativeRecommendation"],
    source: {
      sourceType: "human-edit",
      sourceRef: "operator:vision-commerce-v1"
    }
  },
  {
    id: "workspace-share-policies",
    title: "Sharing flows need admin policy boundaries",
    kind: "policy",
    summary: "Share surfaces become risky without role and audit boundaries.",
    recommendation:
      "Add explicit admin controls and audit trails around sharing before broadening collaboration.",
    categories: ["knowledge-system"],
    domains: ["knowledge-and-structure"],
    promptKeywords: ["workspace", "share"],
    entityNames: ["ShareLink", "Workspace"],
    source: {
      sourceType: "human-edit",
      sourceRef: "operator:workspace-v2"
    }
  }
];

describe("matchCorrectionMemories", () => {
  it("prefers memories that match category, prompt keywords, and entities together", () => {
    const matches = matchCorrectionMemories(correctionMemories, {
      prompt:
        "Build a shopping app that scans products, compares retailers, and price matches healthier alternatives.",
      categories: ["vision-commerce"],
      domain: "shopping-assistant",
      entityNames: ["RetailerOffer", "Product", "AlternativeRecommendation"]
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.memory.id).toBe("vision-offer-freshness");
    expect(matches[0]?.score).toBeGreaterThan(0);
    expect(matches[0]?.reasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("matched category"),
        expect.stringContaining("matched entity"),
        expect.stringContaining("matched prompt keyword")
      ])
    );
  });

  it("returns no matches when the context does not overlap the memory library", () => {
    const matches = matchCorrectionMemories(correctionMemories, {
      prompt: "Build a standalone audio player with playlists and local playback.",
      categories: ["general-product"],
      domain: "music-player",
      entityNames: ["Track", "Playlist"]
    });

    expect(matches).toEqual([]);
  });
});
