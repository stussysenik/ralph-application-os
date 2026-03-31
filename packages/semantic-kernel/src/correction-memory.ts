import type { SemanticProvenance } from "./types.js";

export type SemanticCorrectionKind =
  | "relation"
  | "policy"
  | "workflow"
  | "view"
  | "ranking"
  | "privacy"
  | "ontology"
  | "runtime";

export interface SemanticCorrectionMemory {
  id: string;
  title: string;
  kind: SemanticCorrectionKind;
  summary: string;
  recommendation: string;
  categories?: string[];
  domains?: string[];
  promptKeywords?: string[];
  entityNames?: string[];
  source: SemanticProvenance;
}

export interface SemanticCorrectionMatchContext {
  prompt: string;
  categories?: string[];
  domain?: string;
  entityNames?: string[];
  limit?: number;
}

export interface SemanticCorrectionMemoryMatch {
  memory: SemanticCorrectionMemory;
  score: number;
  reasons: string[];
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function keywordMatches(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  if (normalizedKeyword.length === 0) {
    return false;
  }

  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword);
  }

  return new RegExp(`(^|[^a-z0-9])${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "i").test(
    normalizedText
  );
}

/**
 * Correction memory is intentionally small and explicit. Ralph should learn
 * from durable operator fixes, but the first loop only needs enough signal to
 * recognize familiar semantic gaps and surface them earlier in ideation or
 * handoff. Matching stays deterministic so the operator can see why a memory
 * entry applied.
 */
export function matchCorrectionMemories(
  memories: SemanticCorrectionMemory[],
  context: SemanticCorrectionMatchContext
): SemanticCorrectionMemoryMatch[] {
  const normalizedPrompt = normalizeText(context.prompt);
  const normalizedCategories = new Set((context.categories ?? []).map(normalizeText));
  const normalizedDomain = context.domain ? normalizeText(context.domain) : "";
  const normalizedEntities = new Set((context.entityNames ?? []).map(normalizeText));
  const matches: SemanticCorrectionMemoryMatch[] = [];

  for (const memory of memories) {
    const reasons: string[] = [];
    let score = 0;

    const categoryMatches = uniqueStrings(
      (memory.categories ?? []).filter((category) =>
        normalizedCategories.has(normalizeText(category))
      )
    );

    if (categoryMatches.length > 0) {
      score += 4;
      reasons.push(`matched category: ${categoryMatches.join(", ")}`);
    }

    const domainMatches = uniqueStrings(
      (memory.domains ?? []).filter((domain) => {
        if (normalizedDomain.length === 0) {
          return false;
        }

        const normalizedMemoryDomain = normalizeText(domain);
        return (
          normalizedDomain === normalizedMemoryDomain ||
          normalizedDomain.includes(normalizedMemoryDomain) ||
          normalizedMemoryDomain.includes(normalizedDomain)
        );
      })
    );

    if (domainMatches.length > 0) {
      score += 3;
      reasons.push(`matched domain: ${domainMatches.join(", ")}`);
    }

    const entityMatches = uniqueStrings(
      (memory.entityNames ?? []).filter((entityName) =>
        normalizedEntities.has(normalizeText(entityName))
      )
    );

    if (entityMatches.length > 0) {
      score += Math.min(4, entityMatches.length * 2);
      reasons.push(`matched entity: ${entityMatches.join(", ")}`);
    }

    const promptKeywordMatches = uniqueStrings(
      (memory.promptKeywords ?? []).filter((keyword) => keywordMatches(normalizedPrompt, keyword))
    );

    if (promptKeywordMatches.length > 0) {
      score += Math.min(4, promptKeywordMatches.length);
      reasons.push(`matched prompt keyword: ${promptKeywordMatches.join(", ")}`);
    }

    if (score > 0) {
      matches.push({
        memory,
        score,
        reasons
      });
    }
  }

  return matches
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.memory.title.localeCompare(right.memory.title);
    })
    .slice(0, context.limit ?? 4);
}
