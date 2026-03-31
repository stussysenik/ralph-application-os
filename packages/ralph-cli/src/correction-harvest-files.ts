import { buildIdeationBrief } from "@ralph/agent-swarm";
import type {
  SemanticCorrectionMemory,
  SemanticWorldModel
} from "@ralph/semantic-kernel";

function splitDomainKeywords(domain: string): string[] {
  return domain
    .split(/[^a-z0-9]+/i)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 4);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

export function enrichHarvestedCorrectionMemories(
  model: SemanticWorldModel,
  note: string | undefined,
  memories: SemanticCorrectionMemory[]
): SemanticCorrectionMemory[] {
  if (memories.length === 0) {
    return [];
  }

  const brief = buildIdeationBrief({
    prompt: [model.name, model.domain, note ?? ""].join(" ").trim(),
    worldModel: model
  });
  const categories = [brief.primaryCategory, ...brief.secondaryCategories];
  const domainKeywords = splitDomainKeywords(model.domain);

  return memories.map((memory) => ({
    ...memory,
    categories: uniqueStrings([...(memory.categories ?? []), ...categories]),
    promptKeywords: uniqueStrings([
      ...(memory.promptKeywords ?? []),
      ...domainKeywords
    ]).slice(0, 8)
  }));
}
