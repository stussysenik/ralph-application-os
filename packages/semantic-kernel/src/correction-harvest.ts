import type { SemanticPatchDocument, SemanticPatchOperation } from "./patch.js";
import type { SemanticWorldModel } from "./types.js";
import type {
  SemanticCorrectionKind,
  SemanticCorrectionMemory
} from "./correction-memory.js";

export interface SemanticCorrectionHarvestInput {
  sourceModel: SemanticWorldModel;
  targetModel: SemanticWorldModel;
  patch: SemanticPatchDocument;
  sourceRef: string;
}

interface HarvestGroup {
  kind: SemanticCorrectionKind;
  operations: SemanticPatchOperation[];
  entityNames: Set<string>;
  promptKeywords: Set<string>;
}

const ROOT_KIND_MAP: Partial<Record<string, SemanticCorrectionKind>> = {
  concepts: "ontology",
  entities: "ontology",
  relations: "relation",
  states: "workflow",
  actions: "workflow",
  policies: "policy",
  views: "view",
  effects: "runtime",
  invariants: "workflow"
};

function normalizePath(path: string[] | string): string[] {
  return Array.isArray(path) ? [...path] : path.split(".").filter((segment) => segment.length > 0);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function formatEntityList(values: string[]): string {
  if (values.length === 0) {
    return "the semantic model";
  }

  if (values.length === 1) {
    return values[0] ?? "the semantic model";
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function splitDomainKeywords(domain: string): string[] {
  return domain
    .split(/[^a-z0-9]+/i)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 4);
}

function findEntityNamesForOperation(
  sourceModel: SemanticWorldModel,
  targetModel: SemanticWorldModel,
  operation: SemanticPatchOperation
): string[] {
  const path = normalizePath(operation.path);
  const root = path[0];
  const key = path[1];

  if (!root || !key) {
    return [];
  }

  switch (root) {
    case "entities":
    case "concepts":
      return [key];
    case "relations": {
      const [from, , to] = key.split(":");
      return uniqueStrings([from, to].filter((value): value is string => Boolean(value)));
    }
    case "states":
    case "actions": {
      const [entity] = key.split(":");
      return entity ? [entity] : [];
    }
    case "policies": {
      const policy =
        targetModel.policies.find((candidate) => candidate.name === key) ??
        sourceModel.policies.find((candidate) => candidate.name === key);
      return policy ? [policy.appliesTo] : [];
    }
    case "views": {
      const view =
        targetModel.views.find((candidate) => candidate.name === key) ??
        sourceModel.views.find((candidate) => candidate.name === key);
      return view ? [view.entity] : [];
    }
    case "invariants": {
      const invariant =
        targetModel.invariants.find((candidate) => candidate.name === key) ??
        sourceModel.invariants.find((candidate) => candidate.name === key);

      if (!invariant) {
        return [];
      }

      if (invariant.kind === "action-state-chain") {
        const action =
          targetModel.actions.find((candidate) => candidate.name === invariant.action) ??
          sourceModel.actions.find((candidate) => candidate.name === invariant.action);
        return action ? [action.entity] : [];
      }

      return [invariant.policy];
    }
    default:
      return [];
  }
}

function buildHarvestSummary(
  kind: SemanticCorrectionKind,
  entityNames: string[],
  operationCount: number,
  domain: string
): string {
  const entityText = formatEntityList(entityNames);

  switch (kind) {
    case "relation":
      return `${operationCount} relation change(s) made ${entityText} more explicit in ${domain}.`;
    case "policy":
      return `${operationCount} policy change(s) clarified access and approval boundaries around ${entityText}.`;
    case "workflow":
      return `${operationCount} workflow change(s) tightened states, actions, or invariants around ${entityText}.`;
    case "view":
      return `${operationCount} view change(s) made operator surfaces around ${entityText} more explicit.`;
    case "ontology":
      return `${operationCount} semantic structure change(s) strengthened the core concepts around ${entityText}.`;
    case "runtime":
      return `${operationCount} runtime/effect change(s) made execution concerns around ${entityText} more explicit.`;
    case "ranking":
    case "privacy":
      return `${operationCount} semantic change(s) refined ${kind} behavior around ${entityText}.`;
  }

  return `${operationCount} semantic change(s) refined ${entityText} in ${domain}.`;
}

function buildHarvestRecommendation(
  kind: SemanticCorrectionKind,
  entityNames: string[],
  domain: string
): string {
  const entityText = formatEntityList(entityNames);

  switch (kind) {
    case "relation":
      return `Promote explicit relations around ${entityText} so ${domain} stays queryable and readable without hidden joins or implied edges.`;
    case "policy":
      return `Capture durable policy boundaries for ${entityText} before broadening workflows or exposing more operator surfaces in ${domain}.`;
    case "workflow":
      return `Lock states, actions, and invariants around ${entityText} before layering more UI or automation into ${domain}.`;
    case "view":
      return `Model operator views for ${entityText} as first-class semantics so ${domain} does not rebuild critical read paths ad hoc in UI code.`;
    case "ontology":
      return `Treat ${entityText} as stable semantic primitives in ${domain} before adding more downstream behavior.`;
    case "runtime":
      return `Promote runtime and effect behavior around ${entityText} into explicit semantics so ${domain} stays provable under change.`;
    case "ranking":
      return `Keep ranking logic for ${entityText} explicit and inspectable so ${domain} does not hide product decisions in opaque scoring.`;
    case "privacy":
      return `Make privacy and access semantics for ${entityText} explicit before ${domain} handles broader user-facing data flows.`;
  }

  return `Capture a durable semantic lesson for ${entityText} so ${domain} stays explicit under change.`;
}

function groupPatchOperations(
  sourceModel: SemanticWorldModel,
  targetModel: SemanticWorldModel,
  patch: SemanticPatchDocument
): HarvestGroup[] {
  const groups = new Map<SemanticCorrectionKind, HarvestGroup>();

  for (const operation of patch.operations) {
    const path = normalizePath(operation.path);
    const root = path[0];
    const kind = root ? ROOT_KIND_MAP[root] : undefined;

    if (!kind) {
      continue;
    }

    const existing = groups.get(kind) ?? {
      kind,
      operations: [],
      entityNames: new Set<string>(),
      promptKeywords: new Set<string>()
    };

    existing.operations.push(operation);

    for (const entityName of findEntityNamesForOperation(sourceModel, targetModel, operation)) {
      existing.entityNames.add(entityName);
      existing.promptKeywords.add(entityName.toLowerCase());
    }

    groups.set(kind, existing);
  }

  return [...groups.values()].sort((left, right) => left.kind.localeCompare(right.kind));
}

/**
 * Patch and merge runs already capture what changed semantically. Harvesting
 * turns those accepted changes into small reusable correction-memory proposals
 * so later ideation and draft runs can benefit from the same lesson.
 */
export function harvestCorrectionMemoriesFromPatch(
  input: SemanticCorrectionHarvestInput
): SemanticCorrectionMemory[] {
  const groups = groupPatchOperations(input.sourceModel, input.targetModel, input.patch);
  const domainKeywords = splitDomainKeywords(input.targetModel.domain);

  return groups.map((group) => {
    const entityNames = [...group.entityNames].sort();
    const promptKeywords = uniqueStrings([
      ...domainKeywords,
      ...[...group.promptKeywords]
    ]).slice(0, 8);
    const id = slugify(
      `${input.targetModel.name}-${group.kind}-${entityNames.join("-") || "semantic"}`
    );

    return {
      id,
      title: `${group.kind} lesson for ${input.targetModel.name}`,
      kind: group.kind,
      summary: buildHarvestSummary(
        group.kind,
        entityNames,
        group.operations.length,
        input.targetModel.domain
      ),
      recommendation: buildHarvestRecommendation(
        group.kind,
        entityNames,
        input.targetModel.domain
      ),
      domains: [input.targetModel.domain],
      ...(entityNames.length > 0 ? { entityNames } : {}),
      ...(promptKeywords.length > 0 ? { promptKeywords } : {}),
      source: {
        sourceType: "human-edit",
        sourceRef: input.sourceRef,
        ...(input.patch.note ? { note: input.patch.note } : {}),
        confidence: 0.82
      }
    };
  });
}
