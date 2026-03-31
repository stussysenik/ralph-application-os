import type {
  SemanticAction,
  SemanticAttribute,
  SemanticConcept,
  SemanticEffect,
  SemanticEntity,
  SemanticInvariant,
  SemanticOpenQuestion,
  SemanticPolicy,
  SemanticPolicyRule,
  SemanticProvenance,
  SemanticRelation,
  SemanticState,
  SemanticView,
  SemanticWorldModel
} from "./types.js";

function compareByName(left: { name: string }, right: { name: string }): number {
  return left.name.localeCompare(right.name);
}

function sortStrings(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sortProvenanceEntries(entries: SemanticProvenance[]): SemanticProvenance[] {
  return [...entries].sort((left, right) => {
    const leftKey = `${left.sourceType}:${left.sourceRef}:${left.note ?? ""}`;
    const rightKey = `${right.sourceType}:${right.sourceRef}:${right.note ?? ""}`;
    return leftKey.localeCompare(rightKey);
  });
}

function sortAttributes(attributes: SemanticAttribute[]): SemanticAttribute[] {
  return [...attributes].sort(compareByName);
}

function sortConcepts(concepts: SemanticConcept[]): SemanticConcept[] {
  return [...concepts]
    .map((concept) => ({
      ...concept,
      aliases: sortStrings(concept.aliases),
      provenance: sortProvenanceEntries(concept.provenance)
    }))
    .sort(compareByName);
}

function sortEntities(entities: SemanticEntity[]): SemanticEntity[] {
  return [...entities]
    .map((entity) => ({
      ...entity,
      attributes: sortAttributes(entity.attributes)
    }))
    .sort(compareByName);
}

function sortRelations(relations: SemanticRelation[]): SemanticRelation[] {
  return [...relations].sort((left, right) => {
    const leftKey = `${left.from}:${left.name}:${left.to}`;
    const rightKey = `${right.from}:${right.name}:${right.to}`;
    return leftKey.localeCompare(rightKey);
  });
}

function sortStates(states: SemanticState[]): SemanticState[] {
  return [...states].sort((left, right) => {
    const leftKey = `${left.entity}:${left.name}`;
    const rightKey = `${right.entity}:${right.name}`;
    return leftKey.localeCompare(rightKey);
  });
}

function sortActions(actions: SemanticAction[]): SemanticAction[] {
  return [...actions]
    .map((action) => ({
      ...action,
      actors: sortStrings(action.actors)
    }))
    .sort((left, right) => {
      const leftKey = `${left.entity}:${left.name}:${left.from}:${left.to}`;
      const rightKey = `${right.entity}:${right.name}:${right.from}:${right.to}`;
      return leftKey.localeCompare(rightKey);
    });
}

function sortPolicyRules(rules: SemanticPolicyRule[]): SemanticPolicyRule[] {
  return [...rules].sort((left, right) => {
    const leftKey = `${left.field}:${left.operator}:${String(left.value)}`;
    const rightKey = `${right.field}:${right.operator}:${String(right.value)}`;
    return leftKey.localeCompare(rightKey);
  });
}

function sortPolicies(policies: SemanticPolicy[]): SemanticPolicy[] {
  return [...policies]
    .map((policy) => ({
      ...policy,
      actors: sortStrings(policy.actors),
      rules: sortPolicyRules(policy.rules)
    }))
    .sort(compareByName);
}

function sortViews(views: SemanticView[]): SemanticView[] {
  return [...views]
    .map((view) => ({
      ...view,
      columns: sortStrings(view.columns)
    }))
    .sort(compareByName);
}

function sortEffects(effects: SemanticEffect[]): SemanticEffect[] {
  return [...effects].sort(compareByName);
}

function sortInvariants(invariants: SemanticInvariant[]): SemanticInvariant[] {
  return [...invariants].sort(compareByName);
}

function sortOpenQuestions(openQuestions: SemanticOpenQuestion[]): SemanticOpenQuestion[] {
  return [...openQuestions].sort((left, right) => left.id.localeCompare(right.id));
}

/**
 * Stable serialization is the first hard contract in the repo.
 * If two models mean the same thing, they should serialize the same way.
 * That contract is what later makes semantic diffing, provenance, replay,
 * and deterministic builder output possible.
 */
export function canonicalizeWorldModel(model: SemanticWorldModel): SemanticWorldModel {
  return {
    ...model,
    concepts: sortConcepts(model.concepts),
    entities: sortEntities(model.entities),
    relations: sortRelations(model.relations),
    states: sortStates(model.states),
    actions: sortActions(model.actions),
    policies: sortPolicies(model.policies),
    views: sortViews(model.views),
    effects: sortEffects(model.effects),
    invariants: sortInvariants(model.invariants),
    openQuestions: sortOpenQuestions(model.openQuestions),
    provenance: sortProvenanceEntries(model.provenance)
  };
}

export function serializeWorldModel(model: SemanticWorldModel): string {
  return JSON.stringify(canonicalizeWorldModel(model), null, 2);
}
