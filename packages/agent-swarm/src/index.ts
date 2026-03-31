import {
  benchmarkModels,
  serializeWorldModel,
  validateWorldModel,
  type SemanticWorldModel
} from "@ralph/semantic-kernel";
import {
  buildApplicationBlueprint,
  type ApplicationBlueprint
} from "@ralph/internal-builders";
import {
  runKernelProofs,
  type ProofResult
} from "@ralph/proof-harness";
import {
  buildCategoryInterviewQuestions,
  buildIdeationBrief
} from "./ideation.js";

export * from "./ideation.js";

export type RalphAgentRole =
  | "researcher"
  | "semantic-architect"
  | "builder"
  | "verifier"
  | "promoter";

export type RalphStage =
  | "research"
  | "model"
  | "build"
  | "prove"
  | "promote";

export interface RalphWorkflowDefinition {
  name: string;
  stageOrder: RalphStage[];
  artifacts: string[];
}

export interface RalphRoleBinding {
  role: RalphAgentRole;
  stages: RalphStage[];
}

export interface RalphFunctionCall<TInput = unknown, TOutput = unknown> {
  name: string;
  input: TInput;
  output: TOutput;
}

export interface RalphJobInput {
  kind: "prompt" | "repo" | "doc" | "schema" | "screenshot" | "trace";
  ref: string;
  note?: string;
}

export type RalphTargetSurface =
  | "web"
  | "cli"
  | "api"
  | "worker"
  | "mobile"
  | "desktop"
  | "embedded";

export interface RalphImplementationPreferences {
  targetSurfaces?: RalphTargetSurface[];
  preferredLanguages?: string[];
  preferredFrameworks?: string[];
  nonNegotiables?: string[];
}

export interface RalphArtifact<TData = unknown> {
  kind: string;
  data: TData;
}

export interface RalphStageResult<TArtifact = unknown> {
  stage: RalphStage;
  agent: RalphAgentRole;
  status: "completed";
  summary: string;
  calls: RalphFunctionCall[];
  artifact: RalphArtifact<TArtifact>;
}

export interface RalphPromotionDecision {
  status: "promote" | "reject";
  reason: string;
}

export interface RalphJobConstraint {
  name: string;
  detail: string;
}

export interface RalphJobSuccessCriterion {
  name: string;
  detail: string;
}

export interface RalphJob {
  id: string;
  prompt: string;
  benchmarkName?: string;
  worldModel?: SemanticWorldModel;
  workflowName?: string;
  inputs?: RalphJobInput[];
  implementationPreferences?: RalphImplementationPreferences;
  constraints?: RalphJobConstraint[];
  successCriteria?: RalphJobSuccessCriterion[];
  notes?: string[];
  tags?: string[];
}

export interface RalphJobValidationIssue {
  path: string;
  message: string;
}

export interface RalphJobValidationResult {
  ok: boolean;
  issues: RalphJobValidationIssue[];
}

export interface RalphResearchBrief {
  selectedBenchmark: string | null;
  prompt: string;
  workflowName: string;
  inputs: RalphJobInput[];
  implementationPreferences?: RalphImplementationPreferences;
  constraints: RalphJobConstraint[];
  successCriteria: RalphJobSuccessCriterion[];
  notes: string[];
  tags: string[];
}

export type RalphInterviewQuestionCategory =
  | "domain"
  | "data"
  | "workflow"
  | "policy"
  | "integration"
  | "interface"
  | "implementation"
  | "runtime"
  | "resource"
  | "performance"
  | "proof";

export interface RalphInterviewBrief {
  prompt: string;
  benchmarkName?: string;
  worldModel?: SemanticWorldModel;
  inputs?: RalphJobInput[];
  implementationPreferences?: RalphImplementationPreferences;
}

export interface RalphInterviewQuestion {
  id: string;
  category: RalphInterviewQuestionCategory;
  priority: "high" | "medium";
  blocking: boolean;
  prompt: string;
  rationale: string;
}

export interface RalphRunSummary {
  proofOk: boolean;
  proofChecks: number;
  passingChecks: number;
  proofScore: number;
}

export interface RalphRunMetadata {
  runId: string;
  startedAt: string;
  completedAt: string;
  workflowName: string;
  summary: RalphRunSummary;
}

export interface RalphRun {
  job: RalphJob;
  metadata: RalphRunMetadata;
  stages: RalphStageResult[];
}

export interface RalphRunOptions {
  runId?: string;
  workflow?: RalphWorkflowDefinition;
  roleBindings?: RalphRoleBinding[];
}

export const DEFAULT_RALPH_WORKFLOW: RalphWorkflowDefinition = {
  name: "default",
  stageOrder: ["research", "model", "build", "prove", "promote"],
  artifacts: [
    "research-brief",
    "world-model",
    "application-blueprint",
    "proof-result",
    "promotion-decision"
  ]
};

export const DEFAULT_RALPH_ROLE_BINDINGS: RalphRoleBinding[] = [
  { role: "researcher", stages: ["research"] },
  { role: "semantic-architect", stages: ["model"] },
  { role: "builder", stages: ["build"] },
  { role: "verifier", stages: ["prove"] },
  { role: "promoter", stages: ["promote"] }
];

function selectBenchmarkModel(benchmarkName: string): SemanticWorldModel {
  const selected = benchmarkModels.find((model) => model.name === benchmarkName);

  if (!selected) {
    throw new Error(`Unknown benchmark model: ${benchmarkName}`);
  }

  return selected;
}

function makePromotionDecision(proof: ProofResult): RalphPromotionDecision {
  if (proof.ok) {
    return {
      status: "promote",
      reason: "All proof checks passed."
    };
  }

  return {
    status: "reject",
    reason: "Proof failed; do not promote."
  };
}

function validateNamedDetails(
  issues: RalphJobValidationIssue[],
  path: "constraints" | "successCriteria",
  values: Array<{ name: string; detail: string }> | undefined
): void {
  if (!values) {
    return;
  }

  for (const [index, value] of values.entries()) {
    if (value.name.trim().length === 0) {
      issues.push({
        path: `${path}.${index}.name`,
        message: `${path} entries require a non-empty name.`
      });
    }

    if (value.detail.trim().length === 0) {
      issues.push({
        path: `${path}.${index}.detail`,
        message: `${path} entries require a non-empty detail.`
      });
    }
  }
}

function validateStringList(
  issues: RalphJobValidationIssue[],
  path: string,
  values: string[] | undefined
): void {
  if (!values) {
    return;
  }

  for (const [index, value] of values.entries()) {
    if (value.trim().length === 0) {
      issues.push({
        path: `${path}.${index}`,
        message: `${path} entries must not be empty.`
      });
    }
  }
}

export function inspectRalphJob(job: RalphJob): RalphJobValidationResult {
  const issues: RalphJobValidationIssue[] = [];

  if (job.id.trim().length === 0) {
    issues.push({ path: "id", message: "Ralph jobs require a non-empty id." });
  }

  if (job.prompt.trim().length === 0) {
    issues.push({
      path: "prompt",
      message: "Ralph jobs require a non-empty prompt."
    });
  }

  if (job.benchmarkName && job.worldModel) {
    issues.push({
      path: "benchmarkName",
      message:
        "Ralph jobs must choose exactly one input source: benchmarkName or worldModel."
    });
  }

  if (!job.benchmarkName && !job.worldModel) {
    issues.push({
      path: "benchmarkName",
      message: "A Ralph job requires at least one semantic source: benchmarkName or worldModel."
    });
  }

  if (job.benchmarkName) {
    const selected = benchmarkModels.find((model) => model.name === job.benchmarkName);

    if (!selected) {
      issues.push({
        path: "benchmarkName",
        message: `Unknown benchmark model: ${job.benchmarkName}.`
      });
    }
  }

  if (job.workflowName && job.workflowName.trim().length === 0) {
    issues.push({
      path: "workflowName",
      message: "Workflow name must not be empty when provided."
    });
  }

  for (const [index, input] of (job.inputs ?? []).entries()) {
    if (input.ref.trim().length === 0) {
      issues.push({
        path: `inputs.${index}.ref`,
        message: "Ralph job inputs require a non-empty ref."
      });
    }
  }

  validateStringList(
    issues,
    "implementationPreferences.targetSurfaces",
    job.implementationPreferences?.targetSurfaces
  );
  validateStringList(
    issues,
    "implementationPreferences.preferredLanguages",
    job.implementationPreferences?.preferredLanguages
  );
  validateStringList(
    issues,
    "implementationPreferences.preferredFrameworks",
    job.implementationPreferences?.preferredFrameworks
  );
  validateStringList(
    issues,
    "implementationPreferences.nonNegotiables",
    job.implementationPreferences?.nonNegotiables
  );

  validateNamedDetails(issues, "constraints", job.constraints);
  validateNamedDetails(issues, "successCriteria", job.successCriteria);

  for (const [index, note] of (job.notes ?? []).entries()) {
    if (note.trim().length === 0) {
      issues.push({
        path: `notes.${index}`,
        message: "Job notes must not be empty."
      });
    }
  }

  for (const [index, tag] of (job.tags ?? []).entries()) {
    if (tag.trim().length === 0) {
      issues.push({
        path: `tags.${index}`,
        message: "Job tags must not be empty."
      });
    }
  }

  if (job.worldModel) {
    const worldModelValidation = validateWorldModel(job.worldModel);
    issues.push(
      ...worldModelValidation.issues.map((issue) => ({
        path: `worldModel.${issue.path}`,
        message: issue.message
      }))
    );
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

export function validateRalphJob(job: RalphJob): void {
  const validation = inspectRalphJob(job);

  if (!validation.ok) {
    throw new Error(
      validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")
    );
  }
}

function findRoleForStage(
  stage: RalphStage,
  roleBindings: RalphRoleBinding[]
): RalphAgentRole {
  const binding = roleBindings.find((candidate) => candidate.stages.includes(stage));

  if (!binding) {
    throw new Error(`No Ralph role binding found for stage: ${stage}`);
  }

  return binding.role;
}

function getPromotionDecision(run: RalphRun): RalphPromotionDecision {
  const stage = run.stages.find(
    (candidate): candidate is RalphStageResult<RalphPromotionDecision> =>
      candidate.stage === "promote"
  );

  if (!stage) {
    throw new Error("Ralph run is missing the promote stage.");
  }

  return stage.artifact.data;
}

function buildRunSummary(proof: ProofResult): RalphRunSummary {
  const passingChecks = proof.checks.filter((check) => check.ok).length;

  return {
    proofOk: proof.ok,
    proofChecks: proof.checks.length,
    passingChecks,
    proofScore: proof.checks.length === 0 ? 0 : passingChecks / proof.checks.length
  };
}

/**
 * This is the current Ralph control-plane seed: specialized stages, typed
 * function-call artifacts, configurable workflow ordering, and promotion
 * guarded by proof. The semantic kernel remains the source of truth.
 */
export function runRalphJob(job: RalphJob, options: RalphRunOptions = {}): RalphRun {
  validateRalphJob(job);

  const workflow = options.workflow ?? DEFAULT_RALPH_WORKFLOW;
  const roleBindings = options.roleBindings ?? DEFAULT_RALPH_ROLE_BINDINGS;
  const startedAt = new Date().toISOString();
  const selectedModel =
    job.worldModel ?? (job.benchmarkName ? selectBenchmarkModel(job.benchmarkName) : null);

  if (!selectedModel) {
    throw new Error("A Ralph job requires either benchmarkName or worldModel.");
  }

  const researchStage: RalphStageResult<RalphResearchBrief> = {
    stage: "research",
    agent: findRoleForStage("research", roleBindings),
    status: "completed",
    summary: "Selected the semantic source and captured the operator brief.",
    calls: [
      {
        name: "selectBenchmarkModel",
        input: { benchmarkName: job.benchmarkName ?? null },
        output: { modelName: selectedModel.name }
      }
    ],
    artifact: {
      kind: "research-brief",
      data: {
        selectedBenchmark: job.benchmarkName ?? null,
        prompt: job.prompt,
        workflowName: workflow.name,
        inputs: job.inputs ?? [],
        ...(job.implementationPreferences
          ? { implementationPreferences: job.implementationPreferences }
          : {}),
        constraints: job.constraints ?? [],
        successCriteria: job.successCriteria ?? [],
        notes: job.notes ?? [],
        tags: job.tags ?? []
      }
    }
  };

  const modelStage: RalphStageResult<SemanticWorldModel> = {
    stage: "model",
    agent: findRoleForStage("model", roleBindings),
    status: "completed",
    summary: "Normalized the selected input into a semantic world model.",
    calls: [
      {
        name: "serializeWorldModel",
        input: { modelName: selectedModel.name },
        output: {
          serializedPreview: serializeWorldModel(selectedModel).split("\n").slice(0, 6).join("\n")
        }
      }
    ],
    artifact: {
      kind: "world-model",
      data: selectedModel
    }
  };

  const blueprint = buildApplicationBlueprint(selectedModel);
  const buildStage: RalphStageResult<ApplicationBlueprint> = {
    stage: "build",
    agent: findRoleForStage("build", roleBindings),
    status: "completed",
    summary: "Built an internal application blueprint from the world model.",
    calls: [
      {
        name: "buildApplicationBlueprint",
        input: { modelName: selectedModel.name },
        output: { summary: blueprint.summary }
      }
    ],
    artifact: {
      kind: "application-blueprint",
      data: blueprint
    }
  };

  const proof = runKernelProofs(selectedModel);
  const proveStage: RalphStageResult<ProofResult> = {
    stage: "prove",
    agent: findRoleForStage("prove", roleBindings),
    status: "completed",
    summary: "Ran structural and benchmark-specific proof checks.",
    calls: [
      {
        name: "runKernelProofs",
        input: { modelName: selectedModel.name },
        output: { ok: proof.ok, checks: proof.checks.length }
      }
    ],
    artifact: {
      kind: "proof-result",
      data: proof
    }
  };

  const decision = makePromotionDecision(proof);
  const promoteStage: RalphStageResult<RalphPromotionDecision> = {
    stage: "promote",
    agent: findRoleForStage("promote", roleBindings),
    status: "completed",
    summary: "Applied the promotion gate to the proof result.",
    calls: [
      {
        name: "makePromotionDecision",
        input: { proofOk: proof.ok },
        output: decision
      }
    ],
    artifact: {
      kind: "promotion-decision",
      data: decision
    }
  };

  const stageMap: Record<RalphStage, RalphStageResult> = {
    research: researchStage,
    model: modelStage,
    build: buildStage,
    prove: proveStage,
    promote: promoteStage
  };

  return {
    job,
    metadata: {
      runId: options.runId ?? `run-${job.id}`,
      startedAt,
      completedAt: new Date().toISOString(),
      workflowName: workflow.name,
      summary: buildRunSummary(proof)
    },
    stages: workflow.stageOrder.map((stage) => {
      const result = stageMap[stage];

      if (!result) {
        throw new Error(`Unsupported Ralph stage in workflow ${workflow.name}: ${stage}`);
      }

      return result;
    })
  };
}

export function formatRalphRun(run: RalphRun): string {
  const decision = getPromotionDecision(run);
  const lines = [
    `Ralph swarm run: ${run.metadata.runId}`,
    `Job: ${run.job.id}`,
    `Started: ${run.metadata.startedAt}`,
    `Prompt: ${run.job.prompt}`,
    `Workflow: ${run.metadata.workflowName}`,
    `Proof score: ${run.metadata.summary.passingChecks}/${run.metadata.summary.proofChecks} (${(run.metadata.summary.proofScore * 100).toFixed(0)}%)`,
    `Promotion: ${decision.status.toUpperCase()} - ${decision.reason}`,
    ""
  ];

  if (run.job.inputs && run.job.inputs.length > 0) {
    lines.push("Inputs:");
    for (const input of run.job.inputs) {
      lines.push(`  - ${input.kind}: ${input.ref}${input.note ? ` (${input.note})` : ""}`);
    }
    lines.push("");
  }

  const implementationPreferences = run.job.implementationPreferences;
  if (
    implementationPreferences &&
    ((implementationPreferences.targetSurfaces?.length ?? 0) > 0 ||
      (implementationPreferences.preferredLanguages?.length ?? 0) > 0 ||
      (implementationPreferences.preferredFrameworks?.length ?? 0) > 0 ||
      (implementationPreferences.nonNegotiables?.length ?? 0) > 0)
  ) {
    lines.push("Implementation preferences:");

    if (implementationPreferences.targetSurfaces?.length) {
      lines.push(`  - target surfaces: ${implementationPreferences.targetSurfaces.join(", ")}`);
    }

    if (implementationPreferences.preferredLanguages?.length) {
      lines.push(
        `  - preferred languages: ${implementationPreferences.preferredLanguages.join(", ")}`
      );
    }

    if (implementationPreferences.preferredFrameworks?.length) {
      lines.push(
        `  - preferred frameworks: ${implementationPreferences.preferredFrameworks.join(", ")}`
      );
    }

    if (implementationPreferences.nonNegotiables?.length) {
      for (const item of implementationPreferences.nonNegotiables) {
        lines.push(`  - non-negotiable: ${item}`);
      }
    }

    lines.push("");
  }

  if (run.job.constraints && run.job.constraints.length > 0) {
    lines.push("Constraints:");
    for (const constraint of run.job.constraints) {
      lines.push(`  - ${constraint.name}: ${constraint.detail}`);
    }
    lines.push("");
  }

  if (run.job.successCriteria && run.job.successCriteria.length > 0) {
    lines.push("Success criteria:");
    for (const criterion of run.job.successCriteria) {
      lines.push(`  - ${criterion.name}: ${criterion.detail}`);
    }
    lines.push("");
  }

  if (run.job.notes && run.job.notes.length > 0) {
    lines.push("Notes:");
    for (const note of run.job.notes) {
      lines.push(`  - ${note}`);
    }
    lines.push("");
  }

  for (const stage of run.stages) {
    lines.push(`${stage.stage.toUpperCase()} by ${stage.agent}`);
    lines.push(`Artifact: ${stage.artifact.kind}`);
    lines.push(`Summary: ${stage.summary}`);

    for (const call of stage.calls) {
      lines.push(`  fn ${call.name}`);
    }

    if (stage.stage === "build") {
      const blueprint = stage.artifact.data as ApplicationBlueprint;
      lines.push(`  ${blueprint.summary}`);
    }

    if (stage.stage === "prove") {
      const proof = stage.artifact.data as ProofResult;
      lines.push(`  checks: ${proof.checks.length}, ok: ${proof.ok}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function addInterviewQuestion(
  questions: RalphInterviewQuestion[],
  nextQuestion: RalphInterviewQuestion
): void {
  if (!questions.some((question) => question.id === nextQuestion.id)) {
    questions.push(nextQuestion);
  }
}

function sortInterviewQuestions(
  questions: RalphInterviewQuestion[]
): RalphInterviewQuestion[] {
  const priorityScore = (question: RalphInterviewQuestion): number => {
    if (question.blocking && question.priority === "high") {
      return 0;
    }

    if (question.priority === "high") {
      return 1;
    }

    if (question.blocking) {
      return 2;
    }

    return 3;
  };

  return [...questions].sort((left, right) => {
    const scoreDifference = priorityScore(left) - priorityScore(right);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return left.id.localeCompare(right.id);
  });
}

export function buildInterviewQuestions(
  brief: RalphInterviewBrief
): RalphInterviewQuestion[] {
  const prompt = brief.prompt.trim().toLowerCase();
  const selectedModel =
    brief.worldModel ?? (brief.benchmarkName ? selectBenchmarkModel(brief.benchmarkName) : null);
  const ideation = buildIdeationBrief(brief);
  const questions: RalphInterviewQuestion[] = [];

  addInterviewQuestion(questions, {
    id: "primary-user-and-outcome",
    category: "domain",
    priority: "high",
    blocking: true,
    prompt: "Who is the primary user, and what is the one outcome they must achieve reliably?",
    rationale: "The product needs a concrete operator and success condition before modeling."
  });

  addInterviewQuestion(questions, {
    id: "core-records",
    category: "data",
    priority: "high",
    blocking: true,
    prompt: "What are the 3-7 core records, components, or semantic objects this system must track or model?",
    rationale:
      "The data model is the enabling core value, so the first durable objects must be explicit."
  });

  addInterviewQuestion(questions, {
    id: "core-workflow",
    category: "workflow",
    priority: "high",
    blocking: true,
    prompt: "What is the critical lifecycle, execution loop, or workflow from start to finish?",
    rationale:
      "The platform needs the main transitions or control flow before it can build or prove behavior."
  });

  for (const question of buildCategoryInterviewQuestions(ideation)) {
    addInterviewQuestion(questions, question);
  }

  if (
    prompt.includes("approve") ||
    prompt.includes("share") ||
    prompt.includes("admin") ||
    prompt.includes("operator") ||
    selectedModel?.policies.length ||
    selectedModel?.actions.length
  ) {
    addInterviewQuestion(questions, {
      id: "permissions-and-audit",
      category: "policy",
      priority: "high",
      blocking: true,
      prompt: "What permissions, approvals, or audit requirements are non-negotiable?",
      rationale: "Policies and accountability often change the semantic shape of the system."
    });
  }

  if (
    prompt.includes("share") ||
    prompt.includes("sync") ||
    prompt.includes("email") ||
    prompt.includes("payment") ||
    prompt.includes("import") ||
    prompt.includes("export") ||
    (selectedModel?.effects.length ?? 0) > 0
  ) {
    addInterviewQuestion(questions, {
      id: "external-integrations",
      category: "integration",
      priority: "medium",
      blocking: false,
      prompt: "Which external systems, data sources, or export paths does the first version need?",
      rationale: "Effects and integrations shape builders and proof obligations."
    });
  }

  if ((brief.implementationPreferences?.targetSurfaces?.length ?? 0) === 0) {
    addInterviewQuestion(questions, {
      id: "target-surface",
      category: "interface",
      priority: "high",
      blocking: true,
      prompt: "What should the first implementation target: web app, CLI, API, worker, mobile, desktop, or a mix?",
      rationale: "Target surface affects builders, runtime assumptions, and proof flows."
    });
  }

  if ((brief.implementationPreferences?.preferredLanguages?.length ?? 0) === 0) {
    addInterviewQuestion(questions, {
      id: "language-constraints",
      category: "implementation",
      priority: "medium",
      blocking: false,
      prompt: "Do you have hard language, framework, or runtime constraints, or should the platform choose?",
      rationale: "Language choices are optional implementation constraints, not semantic source of truth."
    });
  }

  for (const openQuestion of selectedModel?.openQuestions ?? []) {
    if (openQuestion.status === "open") {
      addInterviewQuestion(questions, {
        id: `open-question-${openQuestion.id}`,
        category: "domain",
        priority: "high",
        blocking: true,
        prompt: openQuestion.prompt,
        rationale: "The current semantic model still has an unresolved ambiguity here."
      });
    }
  }

  return sortInterviewQuestions(questions);
}

export function formatInterviewQuestions(
  brief: RalphInterviewBrief,
  questions: RalphInterviewQuestion[]
): string {
  const ideation = buildIdeationBrief(brief);
  const lines = [
    "Ralph Interview Loop",
    `Prompt: ${brief.prompt}`,
    `Primary category: ${ideation.primaryCategory}`,
    `Execution mode: ${ideation.executionMode}`,
    `Confidence: ${(ideation.confidence * 100).toFixed(0)}%`,
    `Questions: ${questions.length}`,
    ""
  ];

  if (brief.benchmarkName) {
    lines.push(`Benchmark: ${brief.benchmarkName}`);
    lines.push("");
  }

  if (ideation.secondaryCategories.length > 0) {
    lines.push(`Secondary categories: ${ideation.secondaryCategories.join(", ")}`);
    lines.push("");
  }

  lines.push("Why this path:");
  for (const item of ideation.rationale) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  for (const question of questions) {
    lines.push(
      `- [${question.priority}${question.blocking ? ", blocking" : ""}] ${question.prompt}`
    );
    lines.push(`  why: ${question.rationale}`);
  }

  return lines.join("\n");
}
