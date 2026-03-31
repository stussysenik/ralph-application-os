import fs from "node:fs/promises";
import path from "node:path";

import {
  benchmarkModels,
  serializeWorldModel,
  type SemanticWorldModel
} from "@ralph/semantic-kernel";
import {
  buildApplicationBlueprint,
  formatBlueprint
} from "@ralph/internal-builders";
import { runKernelProofs } from "@ralph/proof-harness";
import { formatRalphRun, runRalphJob } from "@ralph/agent-swarm";
import {
  createJobTemplate,
  runLoopFromJobFile,
  runTeamFromJobsDirectory,
  validateJobFile,
  type RalphTeamRun
} from "./job-files.js";
import { runDraftFromArgument } from "./draft-files.js";
import { runInterviewFromArgument } from "./interview-files.js";
import { promoteDraftFromArgument } from "./promotion-files.js";

function renderModelSummary(model: SemanticWorldModel): string {
  return [
    `Model: ${model.name}`,
    `Domain: ${model.domain}`,
    `Entities: ${model.entities.map((entity) => entity.name).join(", ")}`,
    `Views: ${model.views.map((view) => view.name).join(", ")}`,
    `Invariants: ${model.invariants.map((invariant) => invariant.name).join(", ")}`
  ].join("\n");
}

function renderProofResult(model: SemanticWorldModel): string {
  const proof = runKernelProofs(model);
  const renderedChecks = proof.checks
    .map((check) => `  - [${check.ok ? "pass" : "fail"}] ${check.name}: ${check.detail}`)
    .join("\n");

  return [`Proof: ${proof.ok ? "PASS" : "FAIL"}`, renderedChecks].join("\n");
}

function renderBenchmarkDemo(selectedName?: string): string {
  const models = selectedName
    ? benchmarkModels.filter((model) => model.name === selectedName)
    : benchmarkModels;

  if (models.length === 0) {
    throw new Error(`Unknown model: ${selectedName}`);
  }

  const sections = models.map((model) => {
    const blueprint = buildApplicationBlueprint(model);

    return [
      "=".repeat(72),
      renderModelSummary(model),
      "",
      formatBlueprint(blueprint),
      "",
      renderProofResult(model),
      "",
      "Stable serialization preview:",
      serializeWorldModel(model).split("\n").slice(0, 12).join("\n")
    ].join("\n");
  });

  return [
    "Ralph Application OS Demo",
    "Current benchmark families:",
    "  - approvals and spend controls",
    "  - issue and workflow tracking",
    "  - structured knowledge workspaces",
    "  - screenshot capture and sharing",
    "",
    sections.join("\n\n")
  ].join("\n");
}

function renderSwarmDemo(selectedName?: string): string {
  const benchmarkName = selectedName ?? "ramp-like-spend-controls";
  const run = runRalphJob({
    id: `swarm-${benchmarkName}`,
    prompt: `Build ${benchmarkName} using the Ralph semantic loop.`,
    benchmarkName
  });

  return [
    "Ralph Swarm Demo",
    "Typed stage execution with function-call artifacts",
    "",
    formatRalphRun(run)
  ].join("\n");
}

function renderTeamRun(teamRun: RalphTeamRun): string {
  const lines = [
    "Ralph Team Run",
    `Jobs directory: ${teamRun.jobsDirectory}`,
    `Summary: ${teamRun.promotedJobs} promoted, ${teamRun.rejectedJobs} rejected, ${teamRun.totalJobs} total`,
    ""
  ];

  for (const member of teamRun.members) {
    lines.push(
      `- ${member.jobId}: ${member.promotionStatus.toUpperCase()} (${(member.proofScore * 100).toFixed(0)}%)`
    );
    lines.push(`  job: ${member.jobPath}`);
    lines.push(`  run: ${member.runDir}`);
  }

  return lines.join("\n");
}

/**
 * The CLI currently offers two top-level demonstrations:
 * 1. semantic model -> blueprint -> proof
 * 2. typed Ralph swarm execution over the same semantic substrate
 */
function main(): void {
  const command = process.argv[2];
  const argument = process.argv[3];

  void (async () => {
    try {
      if (command === "swarm") {
        console.log(renderSwarmDemo(argument));
        return;
      }

      if (command === "team") {
        const jobsDirectory = argument ?? path.join(process.cwd(), ".ralph/jobs");
        const { teamRun, teamDir } = await runTeamFromJobsDirectory(
          process.cwd(),
          jobsDirectory
        );
        console.log(renderTeamRun(teamRun));
        console.log("");
        console.log(`Team artifacts written to: ${teamDir}`);
        return;
      }

      if (command === "benchmark") {
        console.log(renderBenchmarkDemo(argument));
        return;
      }

      if (command === "job:new") {
        const name = argument ?? "new-job";
        const { jobPath } = await createJobTemplate(process.cwd(), name);
        console.log(`Created Ralph job: ${jobPath}`);
        return;
      }

      if (command === "job:validate") {
        const jobPath =
          argument ??
          path.join(process.cwd(), ".ralph/jobs/examples/screenshot-studio.json");
        const job = await validateJobFile(process.cwd(), jobPath);
        console.log(`Valid Ralph job: ${jobPath}`);
        console.log(`Job: ${job.id}`);
        console.log(`Workflow: ${job.workflowName ?? "default"}`);
        return;
      }

      if (command === "job:from-draft") {
        if (!argument) {
          throw new Error(
            "Promotion input required. Pass an interview directory or answers.template.md path."
          );
        }

        const promotion = await promoteDraftFromArgument(process.cwd(), argument);
        console.log(await fs.readFile(promotion.reportPath, "utf8"));
        console.log("");
        console.log(`Artifacts written to: ${promotion.promotionDir}`);
        console.log(`Tracked model: ${promotion.modelPath}`);
        console.log(`Tracked job: ${promotion.jobPath ?? "not written"}`);
        return;
      }

      if (command === "interview") {
        const interviewInput =
          argument ??
          path.join(process.cwd(), ".ralph/jobs/examples/screenshot-studio.json");
        const { questions, interviewDir, reportPath, answersTemplatePath } =
          await runInterviewFromArgument(
          process.cwd(),
          interviewInput
        );
        console.log(await fs.readFile(reportPath, "utf8"));
        console.log("");
        console.log(`Ralph interview generated ${questions.length} questions.`);
        console.log(`Artifacts written to: ${interviewDir}`);
        console.log(`Report: ${reportPath}`);
        console.log(`Answer template: ${answersTemplatePath}`);
        return;
      }

      if (command === "draft") {
        if (!argument) {
          throw new Error(
            "Draft input required. Pass an interview directory or answers.template.md path."
          );
        }

        const { draftDir, reportPath, modelPath, proofPath, capabilityPath, manifestPath } =
          await runDraftFromArgument(process.cwd(), argument);
        console.log(await fs.readFile(reportPath, "utf8"));
        console.log("");
        console.log(`Artifacts written to: ${draftDir}`);
        console.log(`World model: ${modelPath}`);
        console.log(`Proof: ${proofPath}`);
        console.log(`Capability: ${capabilityPath}`);
        console.log(`Manifest: ${manifestPath}`);
        return;
      }

      if (command === "loop") {
        const jobPath =
          argument ??
          path.join(process.cwd(), ".ralph/jobs/examples/screenshot-studio.json");
        const { run, runDir, manifestPath, reportPath, ledgerPath } = await runLoopFromJobFile(
          process.cwd(),
          jobPath
        );
        console.log(formatRalphRun(run));
        console.log("");
        console.log(`Artifacts written to: ${runDir}`);
        console.log(`Manifest: ${manifestPath}`);
        console.log(`Report: ${reportPath}`);
        console.log(`Ledger: ${ledgerPath}`);
        return;
      }

      console.log(renderBenchmarkDemo(command));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  })();
}

main();
