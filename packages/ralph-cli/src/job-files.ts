import fs from "node:fs/promises";
import path from "node:path";

import {
  formatRalphRun,
  inspectRalphJob,
  runRalphJob,
  type RalphJob,
  type RalphRoleBinding,
  type RalphRun,
  type RalphWorkflowDefinition
} from "@ralph/agent-swarm";

const DEFAULT_JOBS_DIR = ".ralph/jobs";
const DEFAULT_RUNS_DIR = "artifacts/ralph/runs";
const DEFAULT_TEAMS_DIR = "artifacts/ralph/teams";
const DEFAULT_LEDGER_PATH = "artifacts/ralph/hypertime-ledger.jsonl";
const DEFAULT_WORKFLOWS_DIR = ".ralph/workflows";
const DEFAULT_WORKFLOW_NAME = "default";
const DEFAULT_SWARM_ROLES_PATH = ".ralph/swarm/roles.json";
const DEFAULT_JOB_SCHEMA_PATH = ".ralph/jobs/job.schema.json";

interface RalphArtifactFiles {
  job: string;
  run: string;
  manifest: string;
  report: string;
  stageFiles: Record<string, string>;
}

interface RalphJobSchemaProperty {
  type?: string;
}

interface RalphJobSchemaFile {
  required?: string[];
  oneOf?: Array<{ required?: string[] }>;
  properties?: Record<string, RalphJobSchemaProperty>;
}

interface RalphSwarmRolesFile {
  roles: RalphRoleBinding[];
}

export interface RalphRunManifestStage {
  stage: string;
  agent: string;
  artifactKind: string;
  file: string;
}

export interface RalphRunManifest {
  runId: string;
  jobId: string;
  workflowName: string;
  promoted: boolean;
  decisionStatus: "promote" | "reject";
  proofScore: number;
  proofChecks: number;
  passingChecks: number;
  startedAt: string;
  completedAt: string;
  stages: RalphRunManifestStage[];
  artifactFiles: RalphArtifactFiles;
}

export interface RalphHypertimeLedgerEntry {
  runId: string;
  jobId: string;
  workflowName: string;
  decisionStatus: "promote" | "reject";
  proofScore: number;
  recordedAt: string;
  runDir: string;
}

export interface RalphTeamMemberResult {
  jobId: string;
  jobPath: string;
  runDir: string;
  promotionStatus: "promote" | "reject";
  proofScore: number;
}

export interface RalphTeamRun {
  startedAt: string;
  completedAt: string;
  jobsDirectory: string;
  totalJobs: number;
  promotedJobs: number;
  rejectedJobs: number;
  members: RalphTeamMemberResult[];
}

function buildRunId(job: RalphJob): string {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${job.id}`;
}

function buildArtifactFiles(run: RalphRun): RalphArtifactFiles {
  const stageFiles = Object.fromEntries(
    run.stages.map((stage, index) => [
      stage.stage,
      `${String(index + 1).padStart(2, "0")}-${stage.stage}.json`
    ])
  );

  return {
    job: "job.json",
    run: "run.json",
    manifest: "manifest.json",
    report: "report.md",
    stageFiles
  };
}

function getPromotionDecision(run: RalphRun): "promote" | "reject" {
  const stage = run.stages.find((candidate) => candidate.stage === "promote");

  if (!stage) {
    throw new Error("Ralph run is missing the promote stage.");
  }

  return (stage.artifact.data as { status: "promote" | "reject" }).status;
}

function getWorkflowName(job: RalphJob): string {
  return job.workflowName ?? DEFAULT_WORKFLOW_NAME;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function listJobFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listJobFiles(fullPath);
      }

      if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name === "job.schema.json") {
        return [];
      }

      return [fullPath];
    })
  );

  return nested.flat().sort();
}

async function loadWorkflowDefinition(
  rootDir: string,
  workflowName: string
): Promise<RalphWorkflowDefinition> {
  return readJsonFile<RalphWorkflowDefinition>(
    path.join(rootDir, DEFAULT_WORKFLOWS_DIR, `${workflowName}.json`)
  );
}

async function loadRoleBindings(rootDir: string): Promise<RalphRoleBinding[]> {
  const swarmRoles = await readJsonFile<RalphSwarmRolesFile>(
    path.join(rootDir, DEFAULT_SWARM_ROLES_PATH)
  );

  return swarmRoles.roles;
}

async function loadJobSchema(rootDir: string): Promise<RalphJobSchemaFile> {
  return readJsonFile<RalphJobSchemaFile>(path.join(rootDir, DEFAULT_JOB_SCHEMA_PATH));
}

async function validateJobAgainstTrackedSchema(rootDir: string, job: RalphJob): Promise<void> {
  const schema = await loadJobSchema(rootDir);
  const errors: string[] = [];
  const record = job as unknown as Record<string, unknown>;

  for (const requiredField of schema.required ?? []) {
    if (record[requiredField] === undefined) {
      errors.push(`Job schema requires field "${requiredField}".`);
    }
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    const satisfiesOneOf = schema.oneOf.some((clause) =>
      (clause.required ?? []).every((requiredField) => record[requiredField] !== undefined)
    );

    if (!satisfiesOneOf) {
      errors.push("Job schema requires one semantic source: benchmarkName or worldModel.");
    }
  }

  for (const [field, property] of Object.entries(schema.properties ?? {})) {
    const value = record[field];

    if (value === undefined || property.type === undefined) {
      continue;
    }

    const actualType =
      Array.isArray(value) ? "array" : value === null ? "null" : typeof value;

    if (actualType !== property.type) {
      errors.push(`Job field "${field}" must be ${property.type}, received ${actualType}.`);
    }
  }

  const semanticValidation = inspectRalphJob(job);
  if (!semanticValidation.ok) {
    errors.push(
      ...semanticValidation.issues.map((issue) => `${issue.path}: ${issue.message}`)
    );
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}

async function buildRunManifest(run: RalphRun): Promise<RalphRunManifest> {
  const artifactFiles = buildArtifactFiles(run);
  const decisionStatus = getPromotionDecision(run);

  return {
    runId: run.metadata.runId,
    jobId: run.job.id,
    workflowName: run.metadata.workflowName,
    promoted: decisionStatus === "promote",
    decisionStatus,
    proofScore: run.metadata.summary.proofScore,
    proofChecks: run.metadata.summary.proofChecks,
    passingChecks: run.metadata.summary.passingChecks,
    startedAt: run.metadata.startedAt,
    completedAt: run.metadata.completedAt,
    stages: run.stages.map((stage) => ({
      stage: stage.stage,
      agent: stage.agent,
      artifactKind: stage.artifact.kind,
      file: artifactFiles.stageFiles[stage.stage] ?? `${stage.stage}.json`
    })),
    artifactFiles
  };
}

async function appendLedgerEntry(
  rootDir: string,
  runDir: string,
  manifest: RalphRunManifest
): Promise<string> {
  const ledgerPath = path.join(rootDir, DEFAULT_LEDGER_PATH);
  const entry: RalphHypertimeLedgerEntry = {
    runId: manifest.runId,
    jobId: manifest.jobId,
    workflowName: manifest.workflowName,
    decisionStatus: manifest.decisionStatus,
    proofScore: manifest.proofScore,
    recordedAt: manifest.completedAt,
    runDir
  };

  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.appendFile(ledgerPath, `${JSON.stringify(entry)}\n`, "utf8");

  return ledgerPath;
}

export async function createJobTemplate(
  rootDir: string,
  name: string
): Promise<{ jobPath: string; job: RalphJob }> {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, "-");
  const job: RalphJob = {
    id: `job-${normalized}`,
    prompt: `Describe what ${normalized} should do.`,
    benchmarkName: "ramp-like-spend-controls",
    workflowName: DEFAULT_WORKFLOW_NAME,
    inputs: [
      {
        kind: "prompt",
        ref: `brief:${normalized}`,
        note: "Primary operator brief."
      }
    ],
    constraints: [
      {
        name: "proof-required",
        detail: "Promotion is only allowed if the proof harness passes."
      }
    ],
    successCriteria: [
      {
        name: "proof-pass",
        detail: "All structural and benchmark-specific checks must pass."
      }
    ],
    notes: ["Replace the default benchmark with a real semantic source before promotion."],
    tags: [normalized]
  };

  const jobPath = path.join(rootDir, DEFAULT_JOBS_DIR, `${normalized}.json`);
  await fs.mkdir(path.dirname(jobPath), { recursive: true });
  await fs.writeFile(jobPath, `${JSON.stringify(job, null, 2)}\n`, "utf8");

  return { jobPath, job };
}

export async function loadJobFile(rootDir: string, jobPath: string): Promise<RalphJob> {
  const job = await readJsonFile<RalphJob>(jobPath);
  await validateJobAgainstTrackedSchema(rootDir, job);
  return job;
}

export async function validateJobFile(rootDir: string, jobPath: string): Promise<RalphJob> {
  return loadJobFile(rootDir, jobPath);
}

export async function writeRunArtifacts(
  rootDir: string,
  run: RalphRun
): Promise<{
  runDir: string;
  manifestPath: string;
  reportPath: string;
  ledgerPath: string;
}> {
  const runDir = path.join(rootDir, DEFAULT_RUNS_DIR, run.metadata.runId);
  const manifest = await buildRunManifest(run);
  const artifactFiles = manifest.artifactFiles;
  const manifestPath = path.join(runDir, artifactFiles.manifest);
  const reportPath = path.join(runDir, artifactFiles.report);

  await fs.mkdir(runDir, { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(runDir, artifactFiles.job),
      `${JSON.stringify(run.job, null, 2)}\n`,
      "utf8"
    ),
    ...run.stages.map((stage) =>
      fs.writeFile(
        path.join(runDir, artifactFiles.stageFiles[stage.stage] ?? `${stage.stage}.json`),
        `${JSON.stringify(stage.artifact.data, null, 2)}\n`,
        "utf8"
      )
    ),
    fs.writeFile(
      path.join(runDir, artifactFiles.run),
      `${JSON.stringify(run, null, 2)}\n`,
      "utf8"
    ),
    fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    fs.writeFile(reportPath, `${formatRalphRun(run)}\n`, "utf8")
  ]);

  const ledgerPath = await appendLedgerEntry(rootDir, runDir, manifest);

  return { runDir, manifestPath, reportPath, ledgerPath };
}

export async function runLoopFromJobFile(
  rootDir: string,
  jobPath: string
): Promise<{
  run: RalphRun;
  runDir: string;
  manifestPath: string;
  reportPath: string;
  ledgerPath: string;
}> {
  const job = await loadJobFile(rootDir, jobPath);
  const workflow = await loadWorkflowDefinition(rootDir, getWorkflowName(job));
  const roleBindings = await loadRoleBindings(rootDir);
  const run = runRalphJob(job, {
    runId: buildRunId(job),
    workflow,
    roleBindings
  });
  const { runDir, manifestPath, reportPath, ledgerPath } = await writeRunArtifacts(
    rootDir,
    run
  );

  return { run, runDir, manifestPath, reportPath, ledgerPath };
}

export async function runTeamFromJobsDirectory(
  rootDir: string,
  jobsDirectory = path.join(rootDir, DEFAULT_JOBS_DIR)
): Promise<{ teamRun: RalphTeamRun; teamDir: string }> {
  const startedAt = new Date().toISOString();
  const jobPaths = await listJobFiles(jobsDirectory);
  const members: RalphTeamMemberResult[] = [];

  for (const jobPath of jobPaths) {
    const { run, runDir } = await runLoopFromJobFile(rootDir, jobPath);
    members.push({
      jobId: run.job.id,
      jobPath,
      runDir,
      promotionStatus: getPromotionDecision(run),
      proofScore: run.metadata.summary.proofScore
    });
  }

  const promotedJobs = members.filter(
    (member) => member.promotionStatus === "promote"
  ).length;
  const teamRun: RalphTeamRun = {
    startedAt,
    completedAt: new Date().toISOString(),
    jobsDirectory,
    totalJobs: members.length,
    promotedJobs,
    rejectedJobs: members.length - promotedJobs,
    members
  };
  const teamDir = path.join(
    rootDir,
    DEFAULT_TEAMS_DIR,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-team`
  );

  await fs.mkdir(teamDir, { recursive: true });
  await fs.writeFile(
    path.join(teamDir, "team-run.json"),
    `${JSON.stringify(teamRun, null, 2)}\n`,
    "utf8"
  );

  return { teamRun, teamDir };
}
