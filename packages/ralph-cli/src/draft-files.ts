import fs from "node:fs/promises";
import path from "node:path";

import type { RalphImplementationPreferences, RalphTargetSurface } from "@ralph/agent-swarm";
import {
  parseInterviewAnswerMarkdown,
  serializeWorldModel,
  synthesizeWorldModelFromInterview,
  type InterviewAnswerDocument,
  type SemanticWorldModel
} from "@ralph/semantic-kernel";
import {
  buildApplicationBlueprint,
  formatBlueprint,
  type ApplicationBlueprint
} from "@ralph/internal-builders";
import { runKernelProofs, type ProofResult } from "@ralph/proof-harness";

const DEFAULT_DRAFTS_DIR = "artifacts/ralph/drafts";
const KNOWN_TARGET_SURFACES: RalphTargetSurface[] = [
  "web",
  "cli",
  "api",
  "worker",
  "mobile",
  "desktop",
  "embedded"
];
const KNOWN_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Elixir",
  "Common Lisp",
  "Rust",
  "Zig",
  "Go",
  "Ruby",
  "Swift",
  "Kotlin",
  "Java",
  "C",
  "C++",
  "C#"
] as const;
const KNOWN_FRAMEWORKS = [
  "React",
  "Next.js",
  "Rails",
  "RedwoodJS",
  "Phoenix",
  "Express",
  "FastAPI"
] as const;

export type RalphCapabilityTier = "tier-a" | "tier-b" | "tier-c";

export interface RalphCapabilityAssessment {
  tier: RalphCapabilityTier;
  deployable: boolean;
  autoPromotable: boolean;
  summary: string;
  reasons: string[];
}

export interface RalphDraftManifest {
  draftId: string;
  sourcePath: string;
  generatedAt: string;
  modelName: string;
  domain: string;
  proofOk: boolean;
  capability: RalphCapabilityAssessment;
  artifactFiles: {
    answers: string;
    capability: string;
    manifest: string;
    model: string;
    blueprint: string;
    proof: string;
    engineeringHandoff: string;
    report: string;
  };
}

export interface RalphDraftRun {
  draftId: string;
  sourcePath: string;
  answers: InterviewAnswerDocument;
  model: SemanticWorldModel;
  blueprint: ApplicationBlueprint;
  proof: ProofResult;
  capability: RalphCapabilityAssessment;
  implementationPreferences?: RalphImplementationPreferences;
  draftDir: string;
  answersPath: string;
  capabilityPath: string;
  manifestPath: string;
  modelPath: string;
  blueprintPath: string;
  proofPath: string;
  engineeringHandoffPath: string;
  reportPath: string;
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

async function resolveAnswersPath(rootDir: string, argument: string): Promise<string> {
  const trimmed = argument.trim();

  if (trimmed.length === 0) {
    throw new Error("Draft input must be an interview directory or answers template path.");
  }

  const resolved = path.resolve(rootDir, trimmed);
  const stat = await fs.stat(resolved).catch(() => null);

  if (stat?.isDirectory()) {
    const candidate = path.join(resolved, "answers.template.md");

    if (await pathExists(candidate)) {
      return candidate;
    }

    throw new Error(`Interview directory does not contain answers.template.md: ${resolved}`);
  }

  if (stat?.isFile()) {
    return resolved;
  }

  throw new Error(`Draft input not found: ${resolved}`);
}

function formatProof(proof: ProofResult): string {
  return [
    `Proof: ${proof.ok ? "PASS" : "FAIL"}`,
    ...proof.checks.map(
      (check) => `- [${check.ok ? "pass" : "fail"}] ${check.name}: ${check.detail}`
    )
  ].join("\n");
}

function containsNamedValue(source: string, value: string): boolean {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const pattern = new RegExp(`(^|[^a-z0-9+.#-])${escaped}($|[^a-z0-9+.#-])`, "i");
  return pattern.test(source);
}

function hasImplementationPreferences(
  preferences: RalphImplementationPreferences | undefined
): preferences is RalphImplementationPreferences {
  if (!preferences) {
    return false;
  }

  return (
    (preferences.targetSurfaces?.length ?? 0) > 0 ||
    (preferences.preferredLanguages?.length ?? 0) > 0 ||
    (preferences.preferredFrameworks?.length ?? 0) > 0 ||
    (preferences.nonNegotiables?.length ?? 0) > 0
  );
}

function extractImplementationPreferences(
  answers: InterviewAnswerDocument
): RalphImplementationPreferences | undefined {
  const targetSurfaces = (answers.answers["target-surface"]?.items ?? [])
    .flatMap((item) => item.split(/[\s,/]+/))
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is RalphTargetSurface =>
      KNOWN_TARGET_SURFACES.includes(item as RalphTargetSurface)
    );

  const languageResponse = answers.answers["language-constraints"]?.response ?? "";
  const lowerLanguageResponse = languageResponse.toLowerCase();
  const preferredLanguages = KNOWN_LANGUAGES.filter((language) =>
    containsNamedValue(lowerLanguageResponse, language.toLowerCase())
  );
  const preferredFrameworks = KNOWN_FRAMEWORKS.filter((framework) =>
    containsNamedValue(lowerLanguageResponse, framework.toLowerCase())
  );
  const nonNegotiables =
    languageResponse.length > 0 &&
    !lowerLanguageResponse.includes("platform chooses") &&
    preferredLanguages.length === 0 &&
    preferredFrameworks.length === 0
      ? [languageResponse]
      : [];

  const preferences: RalphImplementationPreferences = {
    ...(targetSurfaces.length > 0 ? { targetSurfaces } : {}),
    ...(preferredLanguages.length > 0 ? { preferredLanguages: [...preferredLanguages] } : {}),
    ...(preferredFrameworks.length > 0
      ? { preferredFrameworks: [...preferredFrameworks] }
      : {}),
    ...(nonNegotiables.length > 0 ? { nonNegotiables } : {})
  };

  return hasImplementationPreferences(preferences) ? preferences : undefined;
}

function assessDraftCapability(
  model: SemanticWorldModel,
  blueprint: ApplicationBlueprint,
  proof: ProofResult
): RalphCapabilityAssessment {
  const reasons: string[] = [];

  if (proof.ok) {
    reasons.push("Proof harness passed.");
  } else {
    reasons.push("Proof harness failed.");
  }

  if (blueprint.workflows.length > 0) {
    reasons.push("Workflow semantics are present.");
  } else {
    reasons.push("No executable workflow semantics were inferred.");
  }

  if (blueprint.views.length > 0) {
    reasons.push("Operator views are present.");
  } else {
    reasons.push("No operator-facing views were inferred.");
  }

  if (model.openQuestions.length > 0) {
    reasons.push(`${model.openQuestions.length} open semantic question(s) remain.`);
  } else {
    reasons.push("No open semantic questions remain.");
  }

  if (proof.ok && blueprint.workflows.length > 0 && blueprint.views.length > 0) {
    if (model.openQuestions.length <= 1) {
      return {
        tier: "tier-a",
        deployable: true,
        autoPromotable: true,
        summary: "Deployable owned-runtime candidate for the current substrate.",
        reasons
      };
    }

    return {
      tier: "tier-b",
      deployable: false,
      autoPromotable: false,
      summary: "Structurally strong draft, but unresolved semantics still block safe promotion.",
      reasons
    };
  }

  if (model.entities.length > 0) {
    return {
      tier: "tier-b",
      deployable: false,
      autoPromotable: false,
      summary: "Usable semantic draft for human refinement, but not yet safe for runtime promotion.",
      reasons
    };
  }

  return {
    tier: "tier-c",
    deployable: false,
    autoPromotable: false,
    summary: "Research/spec-only result; the draft is too incomplete for promotion.",
    reasons
  };
}

function formatDraftReport(
  sourcePath: string,
  answers: InterviewAnswerDocument,
  model: SemanticWorldModel,
  blueprint: ApplicationBlueprint,
  proof: ProofResult,
  capability: RalphCapabilityAssessment,
  implementationPreferences?: RalphImplementationPreferences
): string {
  const lines = [
    "Ralph Draft Synthesis",
    `Source: ${sourcePath}`,
    `Prompt: ${answers.prompt}`,
    `Model: ${model.name}`,
    `Domain: ${model.domain}`,
    "",
    "Capability:",
    `- tier: ${capability.tier}`,
    `- deployable: ${capability.deployable ? "yes" : "no"}`,
    `- auto-promotable: ${capability.autoPromotable ? "yes" : "no"}`,
    `- summary: ${capability.summary}`,
    ...capability.reasons.map((reason) => `- reason: ${reason}`),
    "",
    "Open Questions:"
  ];

  if (model.openQuestions.length === 0) {
    lines.push("- none");
  } else {
    for (const question of model.openQuestions) {
      lines.push(`- ${question.id}: ${question.prompt}`);
    }
  }

  lines.push("");
  lines.push("Implementation Preferences:");
  lines.push(
    `- target surface: ${implementationPreferences?.targetSurfaces?.join(", ") || "not specified"}`
  );
  lines.push(
    `- preferred languages: ${implementationPreferences?.preferredLanguages?.join(", ") || "not specified"}`
  );
  lines.push(
    `- preferred frameworks: ${implementationPreferences?.preferredFrameworks?.join(", ") || "not specified"}`
  );
  lines.push(
    `- non-negotiables: ${implementationPreferences?.nonNegotiables?.join("; ") || "not specified"}`
  );
  lines.push("");
  lines.push(formatBlueprint(blueprint));
  lines.push("");
  lines.push(formatProof(proof));

  return lines.join("\n");
}

function summarizeEntityRelations(model: SemanticWorldModel, entityName: string): string[] {
  return model.relations
    .filter((relation) => relation.from === entityName)
    .map(
      (relation) =>
        `${relation.name} -> ${relation.to} (${relation.cardinality})${relation.description ? `: ${relation.description}` : ""}`
    );
}

function inferSuggestedInterfaces(
  model: SemanticWorldModel,
  blueprint: ApplicationBlueprint,
  implementationPreferences?: RalphImplementationPreferences
): string[] {
  const suggestions: string[] = [];
  const preferredSurfaces = implementationPreferences?.targetSurfaces ?? [];
  const primaryWorkflow = blueprint.workflows[0];
  const primaryView = blueprint.views[0];

  if (preferredSurfaces.includes("api") || preferredSurfaces.length === 0) {
    if (primaryWorkflow) {
      suggestions.push(
        `API mutations for ${primaryWorkflow.entity} transitions: ${primaryWorkflow.transitions.join(", ")}`
      );
    }

    if (primaryView) {
      suggestions.push(
        `API query surface for ${primaryView.entity} ${primaryView.kind}: ${primaryView.name}`
      );
    }
  }

  if (preferredSurfaces.includes("web") || preferredSurfaces.includes("mobile")) {
    const surface = preferredSurfaces.includes("mobile") ? "mobile capture and comparison flow" : "web operator flow";
    suggestions.push(`Primary ${surface} backed by ${blueprint.views.map((view) => view.name).join(", ")}`);
  }

  if (model.effects.length > 0) {
    suggestions.push(
      `Background jobs for side effects: ${model.effects.map((effect) => effect.name).join(", ")}`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("No specific interface surface inferred yet; begin with the semantic draft and proof artifacts.");
  }

  return suggestions;
}

function inferProductImprovements(
  answers: InterviewAnswerDocument,
  model: SemanticWorldModel
): string[] {
  const suggestions: string[] = [];
  const lowerPrompt = answers.prompt.toLowerCase();
  const entityNames = new Set(model.entities.map((entity) => entity.name));
  const attributeNames = new Set(
    model.entities.flatMap((entity) => entity.attributes.map((attribute) => attribute.name))
  );

  if (
    entityNames.has("AlternativeRecommendation") ||
    attributeNames.has("overallHealthScore") ||
    attributeNames.has("rank")
  ) {
    suggestions.push(
      "Add explainable ranking so every recommendation shows the health, allergen, price, and availability reasons behind its ordering."
    );
  }

  if (
    entityNames.has("RetailerOffer") ||
    attributeNames.has("price") ||
    attributeNames.has("savingsEstimate")
  ) {
    suggestions.push(
      "Add retailer-offer freshness windows, historical price tracking, and price-drop alerts instead of treating price as a timeless field."
    );
  }

  if (
    entityNames.has("IngredientObservation") ||
    entityNames.has("ScanSession") ||
    attributeNames.has("confidenceScore") ||
    lowerPrompt.includes("scan")
  ) {
    suggestions.push(
      "Add a human correction loop for low-confidence scans so users can fix extracted ingredients and improve future matching."
    );
  }

  if (entityNames.has("UserProfile")) {
    suggestions.push(
      "Add personalization rules driven by dietary goals, allergens, and budget mode so ranking changes per user instead of staying globally static."
    );
  }

  if (model.policies.length === 0 && (entityNames.has("UserProfile") || lowerPrompt.includes("user"))) {
    suggestions.push(
      "Add account, privacy, and admin-review policies before production because user-specific data and recommendation logic need access boundaries."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Add saved histories, feedback loops, and clearer operator review flows so the first version teaches Ralph which functionality users actually keep."
    );
  }

  return suggestions;
}

function inferImplementationSequence(
  model: SemanticWorldModel,
  blueprint: ApplicationBlueprint,
  implementationPreferences?: RalphImplementationPreferences
): string[] {
  const sequence: string[] = [];
  const primaryWorkflow = blueprint.workflows[0];
  const surfaces = implementationPreferences?.targetSurfaces?.join(", ") ?? "web/api";

  sequence.push("Lock the semantic model and relation graph before writing UI code.");

  if (primaryWorkflow) {
    sequence.push(
      `Implement the ${primaryWorkflow.entity} workflow first so the core state machine exists before secondary views.`
    );
  }

  if (model.relations.length > 0) {
    sequence.push("Build the read model around entity relations so the main screens can traverse the semantic graph directly.");
  }

  sequence.push(`Add the first operator surfaces for ${surfaces} after the workflow and query paths are stable.`);
  sequence.push("Keep proof checks in CI so invariants and relation validity stay ahead of feature growth.");

  return sequence;
}

function formatEngineeringHandoff(
  sourcePath: string,
  answers: InterviewAnswerDocument,
  model: SemanticWorldModel,
  blueprint: ApplicationBlueprint,
  proof: ProofResult,
  capability: RalphCapabilityAssessment,
  implementationPreferences?: RalphImplementationPreferences
): string {
  const lines = [
    "# Ralph Engineering Handoff",
    "",
    `Source: ${sourcePath}`,
    `Prompt: ${answers.prompt}`,
    `Model: ${model.name}`,
    `Domain: ${model.domain}`,
    `Capability Tier: ${capability.tier}`,
    ""
  ];

  lines.push("## Build First");
  lines.push("");
  for (const item of inferImplementationSequence(model, blueprint, implementationPreferences)) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Core Data Model");
  lines.push("");
  for (const entity of model.entities) {
    lines.push(`- ${entity.name}: ${entity.attributes.map((attribute) => `${attribute.name}:${attribute.type}`).join(", ")}`);
    const relations = summarizeEntityRelations(model, entity.name);
    for (const relation of relations) {
      lines.push(`- relation from ${entity.name}: ${relation}`);
    }
  }
  lines.push("");

  lines.push("## Runtime Surfaces");
  lines.push("");
  for (const item of inferSuggestedInterfaces(model, blueprint, implementationPreferences)) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Workflow And Proof");
  lines.push("");
  for (const workflow of blueprint.workflows) {
    lines.push(`- ${workflow.entity}: ${workflow.transitions.join(", ")}`);
  }
  for (const check of proof.checks.filter((candidate) => candidate.name.includes("state-chain") || candidate.name.startsWith("workflow-replay"))) {
    lines.push(`- proof: ${check.name}`);
  }
  lines.push("");

  lines.push("## Product Improvement Opportunities");
  lines.push("");
  for (const item of inferProductImprovements(answers, model)) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Open Questions");
  lines.push("");
  if (model.openQuestions.length === 0) {
    lines.push("- none");
  } else {
    for (const question of model.openQuestions) {
      lines.push(`- ${question.prompt}`);
    }
  }

  return lines.join("\n");
}

export async function runDraftFromArgument(
  rootDir: string,
  argument: string
): Promise<RalphDraftRun> {
  const sourcePath = await resolveAnswersPath(rootDir, argument);
  const answersRaw = await fs.readFile(sourcePath, "utf8");
  const answers = parseInterviewAnswerMarkdown(answersRaw);
  const model = synthesizeWorldModelFromInterview(answers);
  const blueprint = buildApplicationBlueprint(model);
  const proof = runKernelProofs(model);
  const capability = assessDraftCapability(model, blueprint, proof);
  const implementationPreferences = extractImplementationPreferences(answers);
  const draftId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(model.name || "draft")}`;
  const draftDir = path.join(
    rootDir,
    DEFAULT_DRAFTS_DIR,
    draftId
  );
  const answersPath = path.join(draftDir, "answers.json");
  const capabilityPath = path.join(draftDir, "capability.json");
  const manifestPath = path.join(draftDir, "manifest.json");
  const modelPath = path.join(draftDir, "world-model.json");
  const blueprintPath = path.join(draftDir, "blueprint.json");
  const proofPath = path.join(draftDir, "proof.json");
  const engineeringHandoffPath = path.join(draftDir, "engineering-handoff.md");
  const reportPath = path.join(draftDir, "report.md");
  const manifest: RalphDraftManifest = {
    draftId,
    sourcePath,
    generatedAt: new Date().toISOString(),
    modelName: model.name,
    domain: model.domain,
    proofOk: proof.ok,
    capability,
    artifactFiles: {
      answers: "answers.json",
      capability: "capability.json",
      manifest: "manifest.json",
      model: "world-model.json",
      blueprint: "blueprint.json",
      proof: "proof.json",
      engineeringHandoff: "engineering-handoff.md",
      report: "report.md"
    }
  };

  await fs.mkdir(draftDir, { recursive: true });
  await Promise.all([
    fs.writeFile(answersPath, `${JSON.stringify(answers, null, 2)}\n`, "utf8"),
    fs.writeFile(capabilityPath, `${JSON.stringify(capability, null, 2)}\n`, "utf8"),
    fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    fs.writeFile(modelPath, `${serializeWorldModel(model)}\n`, "utf8"),
    fs.writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`, "utf8"),
    fs.writeFile(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8"),
    fs.writeFile(
      engineeringHandoffPath,
      `${formatEngineeringHandoff(
        sourcePath,
        answers,
        model,
        blueprint,
        proof,
        capability,
        implementationPreferences
      )}\n`,
      "utf8"
    ),
    fs.writeFile(
      reportPath,
      `${formatDraftReport(
        sourcePath,
        answers,
        model,
        blueprint,
        proof,
        capability,
        implementationPreferences
      )}\n`,
      "utf8"
    )
  ]);

  return {
    draftId,
    sourcePath,
    answers,
    model,
    blueprint,
    proof,
    capability,
    ...(implementationPreferences ? { implementationPreferences } : {}),
    draftDir,
    answersPath,
    capabilityPath,
    manifestPath,
    modelPath,
    blueprintPath,
    proofPath,
    engineeringHandoffPath,
    reportPath
  };
}
