import { describe, expect, it } from "vitest";
import { benchmarkModels } from "@ralph/semantic-kernel";
import { runRalphJob } from "../src/index.js";
describe("runRalphJob", () => {
    it("promotes a valid benchmark model", () => {
        const run = runRalphJob({
            id: "job-ramp",
            prompt: "Build a Ramp-like approval system.",
            benchmarkName: "ramp-like-spend-controls"
        });
        expect(run.stages[4].artifact.data.status).toBe("promote");
        expect(run.stages[3].artifact.data.ok).toBe(true);
    });
    it("rejects a broken inline model", () => {
        const brokenModel = {
            ...benchmarkModels[0],
            policies: benchmarkModels[0].policies.map((policy) => policy.name === "finance-threshold"
                ? { ...policy, actors: [], rules: [] }
                : policy)
        };
        const run = runRalphJob({
            id: "job-broken",
            prompt: "Broken finance policy",
            worldModel: brokenModel
        });
        expect(run.stages[3].artifact.data.ok).toBe(false);
        expect(run.stages[4].artifact.data.status).toBe("reject");
    });
});
//# sourceMappingURL=run.test.js.map