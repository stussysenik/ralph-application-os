import fs from "node:fs/promises";
import path from "node:path";

import {
  buildApplicationBlueprint,
  buildExecutableSubstrateArtifact,
  formatExecutableSubstrateArtifact,
  type ApplicationBlueprint,
  type ExecutableSubstrateArtifact
} from "@ralph/internal-builders";
import { runKernelProofs, type ProofResult } from "@ralph/proof-harness";
import { serializeWorldModel } from "@ralph/semantic-kernel";

import { resolveWorldModelInput, type RalphModelInput } from "./model-diff-files.js";

const DEFAULT_RUNTIME_PACKAGES_DIR = "artifacts/ralph/runtime-packages";

export interface RalphRuntimeArtifactRun {
  source: RalphModelInput;
  blueprint: ApplicationBlueprint;
  artifact: ExecutableSubstrateArtifact;
  proof: ProofResult;
  packageDir: string;
  manifestPath: string;
  reportPath: string;
  entrypointPath: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatProof(proof: ProofResult): string {
  return [
    `Proof: ${proof.ok ? "PASS" : "FAIL"}`,
    ...proof.checks.map(
      (check) => `- [${check.ok ? "pass" : "fail"}] ${check.name}: ${check.detail}`
    )
  ].join("\n");
}

function formatRuntimeArtifactReport(run: RalphRuntimeArtifactRun): string {
  return [
    "Ralph Runtime Artifact Build",
    `Source: ${run.source.label}`,
    `Entrypoint: ${run.entrypointPath}`,
    run.artifact.summary,
    "",
    formatExecutableSubstrateArtifact(run.artifact),
    "",
    formatProof(run.proof)
  ].join("\n");
}

export async function runRuntimeArtifactFromArgument(
  rootDir: string,
  argument: string
): Promise<RalphRuntimeArtifactRun> {
  const source = await resolveWorldModelInput(rootDir, argument);
  const blueprint = buildApplicationBlueprint(source.model);
  const artifact = buildExecutableSubstrateArtifact(source.model);
  const proof = runKernelProofs(source.model);
  const packageId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(source.model.name)}`;
  const packageDir = path.join(rootDir, DEFAULT_RUNTIME_PACKAGES_DIR, packageId);
  const manifestPath = path.join(packageDir, "manifest.json");
  const reportPath = path.join(packageDir, "report.md");
  const entrypointPath = path.join(packageDir, artifact.entrypoint);

  await fs.mkdir(packageDir, { recursive: true });

  await Promise.all([
    fs.writeFile(path.join(packageDir, "world-model.json"), `${serializeWorldModel(source.model)}\n`, "utf8"),
    fs.writeFile(path.join(packageDir, "blueprint.json"), `${JSON.stringify(blueprint, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(packageDir, "proof.json"), `${JSON.stringify(proof, null, 2)}\n`, "utf8"),
    ...artifact.files.map((file) =>
      fs.writeFile(path.join(packageDir, file.path), file.content, "utf8")
    )
  ]);

  const run: RalphRuntimeArtifactRun = {
    source,
    blueprint,
    artifact,
    proof,
    packageDir,
    manifestPath,
    reportPath,
    entrypointPath
  };

  await Promise.all([
    fs.writeFile(reportPath, `${formatRuntimeArtifactReport(run)}\n`, "utf8"),
    fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          source: source.label,
          modelName: source.model.name,
          proofOk: proof.ok,
          entrypoint: artifact.entrypoint,
          artifactFiles: {
            worldModel: "world-model.json",
            blueprint: "blueprint.json",
            proof: "proof.json",
            runtimeManifest: "runtime-manifest.json",
            schema: "schema.json",
            workflows: "workflows.json",
            policies: "policies.json",
            views: "views.json",
            entrypoint: artifact.entrypoint,
            report: "report.md"
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    )
  ]);

  return run;
}
