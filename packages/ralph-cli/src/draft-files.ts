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
    reportPath
  };
}
