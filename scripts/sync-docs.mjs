#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();

const markerPairs = {
  toc: ["<!-- generated:toc:start -->", "<!-- generated:toc:end -->"],
  readme_snapshot: [
    "<!-- generated:readme-snapshot:start -->",
    "<!-- generated:readme-snapshot:end -->"
  ],
  progress_snapshot: [
    "<!-- generated:progress-snapshot:start -->",
    "<!-- generated:progress-snapshot:end -->"
  ],
  ledger_snapshot: [
    "<!-- generated:ledger-snapshot:start -->",
    "<!-- generated:ledger-snapshot:end -->"
  ]
};

async function readText(relativePath) {
  return fs.readFile(path.join(rootDir, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

async function listJson(relativePath) {
  const directory = path.join(rootDir, relativePath);
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

async function listMarkdown(relativePath) {
  const directory = path.join(rootDir, relativePath);
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

function replaceGeneratedSection(document, [startMarker, endMarker], replacement) {
  const start = document.indexOf(startMarker);
  const end = document.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Missing generated markers: ${startMarker} / ${endMarker}`);
  }

  const before = document.slice(0, start + startMarker.length);
  const after = document.slice(end);

  return `${before}\n${replacement}\n${after}`;
}

function buildToc(readme) {
  const lines = readme.split("\n");
  const items = [];

  for (const line of lines) {
    const match = line.match(/^(##|###)\s+(.+)$/);

    if (!match) {
      continue;
    }

    const [, level, rawTitle] = match;
    const title = rawTitle.trim();
    if (title.includes("generated:") || title === "Table Of Contents") {
      continue;
    }

    const slug = title
      .toLowerCase()
      .replace(/`/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const indent = level === "###" ? "  " : "";

    items.push(`${indent}- [${title}](#${slug})`);
  }

  return items.join("\n");
}

function buildReadmeSnapshot({
  scripts,
  exampleJobCount,
  answeredInterviewCount,
  generatedModelCount,
  generatedJobCount
}) {
  const coreCommands = Object.keys(scripts)
    .filter((name) => name.startsWith("ralph:"))
    .sort();

  return [
    "- example jobs: " + exampleJobCount,
    "- answered interview examples: " + answeredInterviewCount,
    "- tracked generated models: " + generatedModelCount,
    "- tracked generated jobs: " + generatedJobCount,
    "- operator commands: " + coreCommands.join(", ")
  ].join("\n");
}

function buildProgressSnapshot({
  exampleJobCount,
  answeredInterviewCount,
  generatedModelCount,
  generatedJobCount
}) {
  return [
    "- tracked example jobs: " + exampleJobCount,
    "- tracked answered interview examples: " + answeredInterviewCount,
    "- tracked generated models: " + generatedModelCount,
    "- tracked generated jobs: " + generatedJobCount,
    "- current operator path: prompt -> ideate -> interview -> draft -> promotion -> diff -> patch -> merge -> artifact -> loop"
  ].join("\n");
}

function buildLedgerSnapshot({
  generatedModelCount,
  generatedJobCount
}) {
  return [
    "- tracked generated models now exist: " + (generatedModelCount > 0 ? "yes" : "no"),
    "- tracked generated jobs now exist: " + (generatedJobCount > 0 ? "yes" : "no"),
    "- current irreversible move under test: universal ideation briefs that classify software category before execution",
    "- latest capability contract artifact: artifacts/ralph/ideation/<run-id>/manifest.json"
  ].join("\n");
}

async function main() {
  const packageJson = await readJson("package.json");
  const exampleJobCount = await listJson(".ralph/jobs/examples");
  const answeredInterviewCount = await listMarkdown(".ralph/interviews/examples");
  const generatedModelCount = await listJson(".ralph/models/generated");
  const generatedJobCount = await listJson(".ralph/jobs/generated");
  const draftCapabilityPath =
    "artifacts/ralph/drafts/<run-id>/capability.json";

  const context = {
    scripts: packageJson.scripts,
    exampleJobCount,
    answeredInterviewCount,
    generatedModelCount,
    generatedJobCount
  };

  const readmePath = path.join(rootDir, "README.md");
  const progressPath = path.join(rootDir, "PROGRESS.md");
  const ledgerPath = path.join(rootDir, "HYPERTIME_LEDGER.md");

  const readme = await fs.readFile(readmePath, "utf8");
  const progress = await fs.readFile(progressPath, "utf8");
  const ledger = await fs.readFile(ledgerPath, "utf8");

  const updatedReadme = replaceGeneratedSection(
    replaceGeneratedSection(readme, markerPairs.toc, buildToc(readme)),
    markerPairs.readme_snapshot,
    buildReadmeSnapshot(context)
  );
  const updatedProgress = replaceGeneratedSection(
    progress,
    markerPairs.progress_snapshot,
    buildProgressSnapshot(context)
  );
  const updatedLedger = replaceGeneratedSection(
    ledger,
    markerPairs.ledger_snapshot,
    buildLedgerSnapshot(context)
  );

  await Promise.all([
    fs.writeFile(readmePath, updatedReadme, "utf8"),
    fs.writeFile(progressPath, updatedProgress, "utf8"),
    fs.writeFile(ledgerPath, updatedLedger, "utf8")
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
