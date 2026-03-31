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
  SemanticView
} from "./types.js";

export function semanticConceptKey(concept: SemanticConcept): string {
  return concept.name;
}

export function semanticEntityKey(entity: SemanticEntity): string {
  return entity.name;
}

export function semanticAttributeKey(attribute: SemanticAttribute): string {
  return attribute.name;
}

export function semanticRelationKey(relation: SemanticRelation): string {
  return `${relation.from}:${relation.name}:${relation.to}`;
}

export function semanticStateKey(state: SemanticState): string {
  return `${state.entity}:${state.name}`;
}

export function semanticActionKey(action: SemanticAction): string {
  return `${action.entity}:${action.name}:${action.from}:${action.to}`;
}

export function semanticPolicyKey(policy: SemanticPolicy): string {
  return policy.name;
}

export function semanticPolicyRuleKey(rule: SemanticPolicyRule): string {
  return `${rule.field}:${rule.operator}:${String(rule.value)}`;
}

export function semanticViewKey(view: SemanticView): string {
  return view.name;
}

export function semanticEffectKey(effect: SemanticEffect): string {
  return effect.name;
}

export function semanticInvariantKey(invariant: SemanticInvariant): string {
  return invariant.name;
}

export function semanticOpenQuestionKey(question: SemanticOpenQuestion): string {
  return question.id;
}

export function semanticProvenanceKey(provenance: SemanticProvenance): string {
  return `${provenance.sourceType}:${provenance.sourceRef}:${provenance.note ?? ""}`;
}
