import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runRuntimeArtifactFromArgument } from "../src/artifact-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-runtime-artifact-"));
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

describe("runRuntimeArtifactFromArgument", () => {
  it("writes a runnable static runtime package for a benchmark model", async () => {
    const rootDir = await createTempRoot();
    const run = await runRuntimeArtifactFromArgument(rootDir, "ramp-like-spend-controls");
    const [reportRaw, htmlRaw, manifestRaw, scriptRaw, seedRaw] = await Promise.all([
      fs.readFile(run.reportPath, "utf8"),
      fs.readFile(run.entrypointPath, "utf8"),
      fs.readFile(run.manifestPath, "utf8"),
      fs.readFile(path.join(run.packageDir, "runtime.js"), "utf8"),
      fs.readFile(path.join(run.packageDir, "seed-data.json"), "utf8")
    ]);

    expect(run.proof.ok).toBe(true);
    expect(reportRaw).toContain("Ralph Runtime Artifact Build");
    expect(reportRaw).toContain("Proof: PASS");
    expect(htmlRaw).toContain("<!doctype html>");
    expect(htmlRaw).toContain("approvalQueue");
    expect(htmlRaw).toContain('src="runtime.js"');
    expect(scriptRaw).toContain("localStorage");
    expect(scriptRaw).toContain("renderRuntime");
    expect(scriptRaw).toContain("createRecord");
    expect(scriptRaw).toContain("linkRecord");
    expect(seedRaw).toContain('"entity": "Invoice"');
    expect(seedRaw).toContain('"links"');
    expect(manifestRaw).toContain('"entrypoint": "index.html"');
    expect(manifestRaw).toContain('"script": "runtime.js"');
  });
});
