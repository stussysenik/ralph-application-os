/**
 * The semantic kernel is the stable data contract for the entire platform.
 * Natural language, screenshots, repositories, and human edits can all feed
 * into it, but builders and proof systems should only depend on this typed
 * representation of meaning.
 */

export type SemanticCardinality = "one-to-one" | "one-to-many" | "many-to-many";
export type SemanticViewKind =
  | "table"
  | "board"
  | "detail"
  | "dashboard"
  | "timeline";
export type SemanticPolicyEffect = "allow" | "deny" | "require-approval";
export type SemanticPolicyOperator = "eq" | "gte" | "lte" | "in";
export type SemanticEffectKind =
  | "notification"
  | "integration"
  | "calculation"
  | "automation";
export type SemanticProvenanceSource =
  | "benchmark"
  | "prompt"
  | "repo"
  | "doc"
  | "human-edit";

export interface SemanticProvenance {
  sourceType: SemanticProvenanceSource;
  sourceRef: string;
  note?: string;
  confidence?: number;
}

export interface SemanticConcept {
  name: string;
  description: string;
  aliases: string[];
  provenance: SemanticProvenance[];
}

export interface SemanticAttribute {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface SemanticEntity {
  name: string;
  description: string;
  attributes: SemanticAttribute[];
}

export interface SemanticRelation {
  name: string;
  from: string;
  to: string;
  cardinality: SemanticCardinality;
  description?: string;
}

export interface SemanticState {
  name: string;
  entity: string;
  description?: string;
  initial?: boolean;
  terminal?: boolean;
}

export interface SemanticAction {
  name: string;
  entity: string;
  from: string;
  to: string;
  actors: string[];
  description?: string;
}

export interface SemanticPolicyRule {
  field: string;
  operator: SemanticPolicyOperator;
  value: string | number | boolean;
}

export interface SemanticPolicy {
  name: string;
  appliesTo: string;
  effect: SemanticPolicyEffect;
  actors: string[];
  rules: SemanticPolicyRule[];
  description?: string;
}

export interface SemanticView {
  name: string;
  entity: string;
  kind: SemanticViewKind;
  columns: string[];
  description?: string;
}

export interface SemanticEffect {
  name: string;
  kind: SemanticEffectKind;
  trigger: string;
  description?: string;
}

export type SemanticInvariant =
  | {
      name: string;
      kind: "action-state-chain";
      action: string;
      requiredFrom: string;
      requiredTo: string;
      description?: string;
    }
  | {
      name: string;
      kind: "policy-threshold";
      policy: string;
      field: string;
      operator: SemanticPolicyOperator;
      value: string | number | boolean;
      requiredActor: string;
      description?: string;
    };

export interface SemanticOpenQuestion {
  id: string;
  prompt: string;
  status: "open" | "resolved";
}

export interface SemanticWorldModel {
  name: string;
  version: string;
  domain: string;
  concepts: SemanticConcept[];
  entities: SemanticEntity[];
  relations: SemanticRelation[];
  states: SemanticState[];
  actions: SemanticAction[];
  policies: SemanticPolicy[];
  views: SemanticView[];
  effects: SemanticEffect[];
  invariants: SemanticInvariant[];
  openQuestions: SemanticOpenQuestion[];
  provenance: SemanticProvenance[];
}
