import { describe, expect, it } from "vitest";

import { runKernelProofs } from "@ralph/proof-harness";

import {
  parseInterviewAnswerMarkdown,
  synthesizeWorldModelFromInterview,
  validateWorldModel
} from "../src/index.js";

const answeredInterview = `# Ralph Interview Answers

Prompt: Build a screenshot studio for marketers to capture pages, annotate them, and share results.

## primary-user-and-outcome
Category: domain
Priority: high (blocking)
Question: Who is the primary user, and what is the one outcome they must achieve reliably?
Why: The product needs a concrete operator and success condition before modeling.
Answer:
- Marketing operators publish polished annotated screenshots quickly.

## core-records
Category: data
Priority: high (blocking)
Question: What are the 3-7 core records or entities this system must track?
Why: The data model is the enabling core value, so the first records must be explicit.
Answer:
- Workspace: name
- Capture: title, assetUrl, status, capturedAt
- Annotation: kind, payload
- Collection: name, status
- ShareLink: slug, status

## core-workflow
Category: workflow
Priority: high (blocking)
Question: What is the critical lifecycle or workflow from start to finish?
Why: The platform needs the main state transitions before it can build or prove behavior.
Answer:
- Capture: raw -> annotated -> share-ready -> archived
- ShareLink: draft -> live -> expired

## permissions-and-audit
Category: policy
Priority: high (blocking)
Question: What permissions, approvals, or audit requirements are non-negotiable?
Why: Policies and accountability often change the semantic shape of the system.
Answer:
- Editor can annotate and prepare captures for sharing.
- Admin can manage share links and archive captures.
- All share events need an audit trail.

## target-surface
Category: interface
Priority: high (blocking)
Question: What should the first implementation target: web app, CLI, API, worker, mobile, desktop, or a mix?
Why: Target surface affects builders, runtime assumptions, and proof flows.
Answer:
- web

## external-integrations
Category: integration
Priority: medium
Question: Which external systems, data sources, or export paths does the first version need?
Why: Effects and integrations shape builders and proof obligations.
Answer:
- Browser extension import
- Slack export

## language-constraints
Category: implementation
Priority: medium
Question: Do you have hard language, framework, or runtime constraints, or should the platform choose?
Why: Language choices are optional implementation constraints, not semantic source of truth.
Answer:
- Platform chooses.
`;

const visionCommerceInterview = `# Ralph Interview Answers

Prompt: Build a computer vision app that scans food ingredients, recommends healthier alternatives, price matches equivalent products, and helps users compare options while shopping.

## primary-user-and-outcome
Category: domain
Priority: high (blocking)
Question: Who is the primary user, and what is the one outcome they must achieve reliably?
Why: The product needs a concrete operator and success condition before modeling.
Answer:
- Health-conscious shoppers should understand whether a scanned product is a good choice and immediately see better alternatives.

## core-records
Category: data
Priority: high (blocking)
Question: What are the 3-7 core records, components, or semantic objects this system must track or model?
Why: The data model is the enabling core value, so the first durable objects must be explicit.
Answer:
- UserProfile: dietaryGoals, allergens, budgetMode
- ScanSession: capturedAt, status, location
- Product: name, brand, packageSize, category
- IngredientObservation: rawText, normalizedIngredient, confidenceScore
- NutritionProfile: sugarScore, proteinScore, additiveScore, overallHealthScore
- AlternativeRecommendation: reason, rank, savingsEstimate, healthDelta
- RetailerOffer: retailerName, price, currency, inStockStatus

## core-workflow
Category: workflow
Priority: high (blocking)
Question: What is the critical lifecycle, execution loop, or workflow from start to finish?
Why: The platform needs the main transitions or control flow before it can build or prove behavior.
Answer:
- ScanSession: captured -> extracted -> normalized -> scored -> compared -> saved

## capture-extraction-and-provenance
Category: runtime
Priority: high (blocking)
Question: What capture inputs are supported first, how are ingredients extracted, and how should confidence and provenance be stored?
Why: Vision-assisted commerce depends on trustworthy extraction, not just downstream UX.
Answer:
- Scan packaged labels from the phone camera first, store OCR confidence, and keep the source image reference on each extracted ingredient observation.

## alternative-ranking-and-price-comparison
Category: proof
Priority: high (blocking)
Question: What makes an alternative better: health score, allergen avoidance, ingredient quality, price delta, retailer availability, or some weighted mix?
Why: Recommendation and price-comparison logic are the semantic center of this product.
Answer:
- Better means a weighted mix of health score, allergen safety, and price delta, with retailer availability required.
`;

describe("parseInterviewAnswerMarkdown", () => {
  it("parses answered interview markdown into typed answers", () => {
    const document = parseInterviewAnswerMarkdown(answeredInterview);

    expect(document.prompt).toContain("screenshot studio");
    expect(document.answers["core-records"]?.items[0]).toContain("Workspace");
    expect(document.answers["language-constraints"]?.response).toContain("Platform chooses");
  });
});

describe("synthesizeWorldModelFromInterview", () => {
  it("turns answered questions into a valid first semantic draft", () => {
    const document = parseInterviewAnswerMarkdown(answeredInterview);
    const model = synthesizeWorldModelFromInterview(document);
    const validation = validateWorldModel(model);
    const proof = runKernelProofs(model);

    expect(model.entities.map((entity) => entity.name)).toEqual(
      expect.arrayContaining(["Workspace", "Capture", "Annotation", "Collection", "ShareLink"])
    );
    expect(model.states.some((state) => state.entity === "Capture" && state.name === "raw")).toBe(
      true
    );
    expect(model.actions.some((action) => action.name === "moveCaptureToAnnotated")).toBe(true);
    expect(model.policies.some((policy) => policy.name === "editor-capture-access")).toBe(true);
    expect(model.policies.some((policy) => policy.name === "admin-share-link-access")).toBe(true);
    expect(model.effects.some((effect) => effect.name === "syncSlackExport")).toBe(true);
    expect(
      model.relations.some(
        (relation) =>
          relation.from === "Workspace" &&
          relation.to === "Capture" &&
          relation.name === "contains"
      )
    ).toBe(true);
    expect(model.openQuestions.some((question) => question.id === "relation-map")).toBe(false);
    expect(validation.ok).toBe(true);
    expect(proof.ok).toBe(true);
  });

  it("infers a relation graph for vision-assisted shopping drafts", () => {
    const document = parseInterviewAnswerMarkdown(visionCommerceInterview);
    const model = synthesizeWorldModelFromInterview(document);
    const validation = validateWorldModel(model);
    const proof = runKernelProofs(model);

    expect(model.entities.map((entity) => entity.name)).toEqual(
      expect.arrayContaining([
        "UserProfile",
        "ScanSession",
        "Product",
        "IngredientObservation",
        "NutritionProfile",
        "AlternativeRecommendation",
        "RetailerOffer"
      ])
    );
    expect(
      model.relations.some(
        (relation) =>
          relation.from === "UserProfile" &&
          relation.to === "ScanSession" &&
          relation.name === "initiates"
      )
    ).toBe(true);
    expect(
      model.relations.some(
        (relation) =>
          relation.from === "ScanSession" &&
          relation.to === "IngredientObservation" &&
          relation.name === "extracts"
      )
    ).toBe(true);
    expect(
      model.relations.some(
        (relation) =>
          relation.from === "Product" &&
          relation.to === "NutritionProfile" &&
          relation.name === "hasNutrition"
      )
    ).toBe(true);
    expect(model.openQuestions.some((question) => question.id === "relation-map")).toBe(false);
    expect(validation.ok).toBe(true);
    expect(proof.ok).toBe(true);
  });
});
