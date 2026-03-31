import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createCorrectionTemplate,
  loadCorrectionMemories
} from "../src/correction-memory-files.js";

const createdDirectories: string[] = [];

async function createTempRoot(): Promise<string> {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-correction-"));
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

describe("correction-memory files", () => {
  it("creates a correction template and loads it back as typed memory", async () => {
    const rootDir = await createTempRoot();
    const { correctionPath } = await createCorrectionTemplate(
      rootDir,
      "Vision Commerce Freshness"
    );

    const raw = await fs.readFile(correctionPath, "utf8");
    expect(raw).toContain('"id": "vision-commerce-freshness"');

    const memories = await loadCorrectionMemories(rootDir);
    expect(memories).toHaveLength(1);
    expect(memories[0]?.title).toBe("Vision Commerce Freshness");
    expect(memories[0]?.kind).toBe("relation");
  });
});
