import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@ralph/semantic-kernel": path.resolve(
        __dirname,
        "packages/semantic-kernel/src/index.ts"
      ),
      "@ralph/internal-builders": path.resolve(
        __dirname,
        "packages/internal-builders/src/index.ts"
      ),
      "@ralph/proof-harness": path.resolve(
        __dirname,
        "packages/proof-harness/src/index.ts"
      ),
      "@ralph/agent-swarm": path.resolve(
        __dirname,
        "packages/agent-swarm/src/index.ts"
      )
    }
  },
  test: {
    include: ["packages/**/*.test.ts"],
    environment: "node"
  }
});
