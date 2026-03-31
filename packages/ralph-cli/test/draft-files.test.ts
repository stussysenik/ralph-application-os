import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDraftFromArgument } from "../src/draft-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-draft-"));
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

## permissions-and-audit
Category: policy
Priority: high (blocking)
Question: What permissions, approvals, or audit requirements are non-negotiable?
Why: Policies and accountability often change the semantic shape of the system.
Answer:
- Editor can annotate and prepare captures for sharing.

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
- Health-conscious shoppers should reliably understand whether a scanned product is a good choice and immediately see healthier similarly-priced alternatives.

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

## target-surface
Category: interface
Priority: high (blocking)
Question: What should the first implementation target: web app, CLI, API, worker, mobile, desktop, or a mix?
Why: Target surface affects builders, runtime assumptions, and proof flows.
Answer:
- mobile, web, api

## language-constraints
Category: implementation
Priority: medium
Question: Do you have hard language, framework, or runtime constraints, or should the platform choose?
Why: Language choices are optional implementation constraints, not semantic source of truth.
Answer:
- Platform chooses. Python for vision and scoring pipelines is acceptable; TypeScript for product surfaces is acceptable.
`;

describe("runDraftFromArgument", () => {
  it("writes a semantic draft, blueprint, and proof from answered interview input", async () => {
    const rootDir = await createTempRoot();
    const interviewDir = path.join(rootDir, "artifacts/ralph/interviews/example");
    const answersTemplatePath = path.join(interviewDir, "answers.template.md");

    await fs.mkdir(interviewDir, { recursive: true });
    await fs.writeFile(answersTemplatePath, `${answeredInterview}\n`, "utf8");

    const {
      draftDir,
      model,
      proof,
      reportPath,
      modelPath,
      engineeringHandoffPath
    } = await runDraftFromArgument(
      rootDir,
      interviewDir
    );

    const [reportRaw, modelRaw, handoffRaw] = await Promise.all([
      fs.readFile(reportPath, "utf8"),
      fs.readFile(modelPath, "utf8"),
      fs.readFile(engineeringHandoffPath, "utf8")
    ]);

    expect(proof.ok).toBe(true);
    expect(path.dirname(reportPath)).toBe(draftDir);
    expect(model.entities.some((entity) => entity.name === "Capture")).toBe(true);
    expect(reportRaw).toContain("Ralph Draft Synthesis");
    expect(handoffRaw).toContain("# Ralph Engineering Handoff");
    expect(handoffRaw).toContain("## Build First");
    expect(handoffRaw).toContain("## Product Improvement Opportunities");
    expect(handoffRaw).toContain("Lock the semantic model and relation graph before writing UI code.");
    expect(modelRaw).toContain(`"name": "${model.name}"`);
  });

  it("adds product-improvement suggestions for recommendation-heavy ideas", async () => {
    const rootDir = await createTempRoot();
    const interviewDir = path.join(rootDir, "artifacts/ralph/interviews/vision-example");
    const answersTemplatePath = path.join(interviewDir, "answers.template.md");

    await fs.mkdir(interviewDir, { recursive: true });
    await fs.writeFile(answersTemplatePath, `${visionCommerceInterview}\n`, "utf8");

    const { engineeringHandoffPath } = await runDraftFromArgument(rootDir, interviewDir);
    const handoffRaw = await fs.readFile(engineeringHandoffPath, "utf8");

    expect(handoffRaw).toContain("Add explainable ranking so every recommendation shows");
    expect(handoffRaw).toContain("Add retailer-offer freshness windows");
    expect(handoffRaw).toContain("Add a human correction loop for low-confidence scans");
  });
});
