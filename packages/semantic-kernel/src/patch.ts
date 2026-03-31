import { canonicalizeWorldModel } from "./serialize.js";
import { validateWorldModel } from "./validate.js";
import {
  semanticActionKey,
  semanticAttributeKey,
  semanticConceptKey,
  semanticEffectKey,
  semanticEntityKey,
  semanticInvariantKey,
  semanticOpenQuestionKey,
  semanticPolicyKey,
  semanticPolicyRuleKey,
  semanticProvenanceKey,
  semanticRelationKey,
  semanticStateKey,
  semanticViewKey
} from "./keys.js";
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

export type SemanticPatchPath = string | string[];

export interface SemanticPatchAddOperation {
  op: "add";
  path: SemanticPatchPath;
  value: unknown;
}

export interface SemanticPatchSetOperation {
  op: "set";
  path: SemanticPatchPath;
  value: unknown;
}

export interface SemanticPatchRemoveOperation {
  op: "remove";
  path: SemanticPatchPath;
}

export type SemanticPatchOperation =
  | SemanticPatchAddOperation
  | SemanticPatchSetOperation
  | SemanticPatchRemoveOperation;

export interface SemanticPatchDocument {
  note?: string;
  operations: SemanticPatchOperation[];
}

function normalizePath(path: SemanticPatchPath): string[] {
  return Array.isArray(path) ? [...path] : path.split(".").filter((segment) => segment.length > 0);
}

function patchError(path: string[], message: string): Error {
  return new Error(`Invalid semantic patch at ${path.join(".") || "<root>"}: ${message}`);
}

function expectString(value: unknown, path: string[]): string {
  if (typeof value !== "string") {
    throw patchError(path, "Expected a string value.");
  }

  return value;
}

function expectRecord(value: unknown, path: string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw patchError(path, "Expected an object value.");
  }

  return value as Record<string, unknown>;
}

function expectArrayMember<T>(
  items: T[],
  key: string,
  keyOf: (item: T) => string,
  path: string[]
): { index: number; item: T } {
  const index = items.findIndex((item) => keyOf(item) === key);

  if (index === -1) {
    throw patchError(path, `No item found for key "${key}".`);
  }

  const item = items[index];

  if (!item) {
    throw patchError(path, `Item "${key}" resolved to an empty slot.`);
  }

  return { index, item };
}

function assertKeyMatch(expectedKey: string, actualKey: string, path: string[]): void {
  if (expectedKey !== actualKey) {
    throw patchError(path, `Patch key "${expectedKey}" does not match value key "${actualKey}".`);
  }
}

function addKeyedItem<T>(
  items: T[],
  key: string,
  keyOf: (item: T) => string,
  path: string[],
  value: unknown
): void {
  if (items.some((item) => keyOf(item) === key)) {
    throw patchError(path, `Item "${key}" already exists.`);
  }

  const record = value as T;
  assertKeyMatch(key, keyOf(record), path);
  items.push(record);
}

function setKeyedItem<T>(
  items: T[],
  key: string,
  keyOf: (item: T) => string,
  path: string[],
  value: unknown
): void {
  const { index } = expectArrayMember(items, key, keyOf, path);
  const record = value as T;
  assertKeyMatch(key, keyOf(record), path);
  items[index] = record;
}

function removeKeyedItem<T>(
  items: T[],
  key: string,
  keyOf: (item: T) => string,
  path: string[]
): void {
  const { index } = expectArrayMember(items, key, keyOf, path);
  items.splice(index, 1);
}

function addStringValue(items: string[], key: string, path: string[], value: unknown): void {
  const stringValue = expectString(value, path);
  assertKeyMatch(key, stringValue, path);

  if (items.includes(stringValue)) {
    throw patchError(path, `Value "${stringValue}" already exists.`);
  }

  items.push(stringValue);
}

function removeStringValue(items: string[], key: string, path: string[]): void {
  const index = items.findIndex((item) => item === key);

  if (index === -1) {
    throw patchError(path, `Value "${key}" does not exist.`);
  }

  items.splice(index, 1);
}

function setRecordField(
  target: Record<string, unknown>,
  field: string,
  path: string[],
  value: unknown
): void {
  if (!(field in target)) {
    throw patchError(path, `Field "${field}" does not exist.`);
  }

  target[field] = value;
}

function applyConceptOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Concept patches must include a concept key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.concepts, key, semanticConceptKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.concepts, key, semanticConceptKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.concepts, key, semanticConceptKey, path);
    return;
  }

  const concept = expectArrayMember(model.concepts, key, semanticConceptKey, path).item;
  const field = path[2];

  if (!field) {
    throw patchError(path, "Concept patch is missing a field.");
  }

  if (field === "aliases") {
    const alias = path[3];

    if (!alias) {
      throw patchError(path, "Alias patch must include an alias value.");
    }

    if (operation.op === "add") {
      addStringValue(concept.aliases, alias, path, operation.value);
      return;
    }

    if (operation.op === "remove") {
      removeStringValue(concept.aliases, alias, path);
      return;
    }

    throw patchError(path, "Use add/remove for concept aliases.");
  }

  if (field === "provenance") {
    const provenanceKey = path[3];

    if (!provenanceKey) {
      throw patchError(path, "Provenance patch must include a provenance key.");
    }

    if (path.length === 4) {
      if (operation.op === "add") {
        expectRecord(operation.value, path);
        addKeyedItem(concept.provenance, provenanceKey, semanticProvenanceKey, path, operation.value);
        return;
      }

      if (operation.op === "set") {
        expectRecord(operation.value, path);
        setKeyedItem(concept.provenance, provenanceKey, semanticProvenanceKey, path, operation.value);
        return;
      }

      removeKeyedItem(concept.provenance, provenanceKey, semanticProvenanceKey, path);
      return;
    }

    const provenance = expectArrayMember(
      concept.provenance,
      provenanceKey,
      semanticProvenanceKey,
      path
    ).item as unknown as Record<string, unknown>;

    if (operation.op !== "set") {
      throw patchError(path, "Use set for provenance fields.");
    }

    setRecordField(provenance, path[4] ?? "", path, operation.value);
    return;
  }

  if (operation.op !== "set") {
    throw patchError(path, `Use set for concept field "${field}".`);
  }

  setRecordField(concept as unknown as Record<string, unknown>, field, path, operation.value);
}

function applyEntityOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Entity patches must include an entity key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.entities, key, semanticEntityKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.entities, key, semanticEntityKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.entities, key, semanticEntityKey, path);
    return;
  }

  const entity = expectArrayMember(model.entities, key, semanticEntityKey, path).item;
  const field = path[2];

  if (field === "attributes") {
    const attributeKey = path[3];

    if (!attributeKey) {
      throw patchError(path, "Attribute patch must include an attribute key.");
    }

    if (path.length === 4) {
      if (operation.op === "add") {
        expectRecord(operation.value, path);
        addKeyedItem(entity.attributes, attributeKey, semanticAttributeKey, path, operation.value);
        return;
      }

      if (operation.op === "set") {
        expectRecord(operation.value, path);
        setKeyedItem(entity.attributes, attributeKey, semanticAttributeKey, path, operation.value);
        return;
      }

      removeKeyedItem(entity.attributes, attributeKey, semanticAttributeKey, path);
      return;
    }

    const attribute = expectArrayMember(
      entity.attributes,
      attributeKey,
      semanticAttributeKey,
      path
    ).item as unknown as Record<string, unknown>;

    if (operation.op !== "set") {
      throw patchError(path, "Use set for attribute fields.");
    }

    setRecordField(attribute, path[4] ?? "", path, operation.value);
    return;
  }

  if (operation.op !== "set") {
    throw patchError(path, `Use set for entity field "${field}".`);
  }

  setRecordField(entity as unknown as Record<string, unknown>, field ?? "", path, operation.value);
}

function applyRelationOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Relation patches must include a relation key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.relations, key, semanticRelationKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.relations, key, semanticRelationKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.relations, key, semanticRelationKey, path);
    return;
  }

  const relation = expectArrayMember(model.relations, key, semanticRelationKey, path)
    .item as unknown as Record<string, unknown>;

  if (operation.op !== "set") {
    throw patchError(path, "Use set for relation fields.");
  }

  setRecordField(relation, path[2] ?? "", path, operation.value);
}

function applyStateOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "State patches must include a state key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.states, key, semanticStateKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.states, key, semanticStateKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.states, key, semanticStateKey, path);
    return;
  }

  const state = expectArrayMember(model.states, key, semanticStateKey, path)
    .item as unknown as Record<string, unknown>;

  if (operation.op !== "set") {
    throw patchError(path, "Use set for state fields.");
  }

  setRecordField(state, path[2] ?? "", path, operation.value);
}

function applyActionOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Action patches must include an action key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.actions, key, semanticActionKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.actions, key, semanticActionKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.actions, key, semanticActionKey, path);
    return;
  }

  const action = expectArrayMember(model.actions, key, semanticActionKey, path).item;
  const field = path[2];

  if (field === "actors") {
    const actor = path[3];

    if (!actor) {
      throw patchError(path, "Actor patch must include an actor key.");
    }

    if (operation.op === "add") {
      addStringValue(action.actors, actor, path, operation.value);
      return;
    }

    if (operation.op === "remove") {
      removeStringValue(action.actors, actor, path);
      return;
    }

    throw patchError(path, "Use add/remove for action actors.");
  }

  if (operation.op !== "set") {
    throw patchError(path, `Use set for action field "${field}".`);
  }

  setRecordField(action as unknown as Record<string, unknown>, field ?? "", path, operation.value);
}

function applyPolicyOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Policy patches must include a policy key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.policies, key, semanticPolicyKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.policies, key, semanticPolicyKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.policies, key, semanticPolicyKey, path);
    return;
  }

  const policy = expectArrayMember(model.policies, key, semanticPolicyKey, path).item;
  const field = path[2];

  if (field === "actors") {
    const actor = path[3];

    if (!actor) {
      throw patchError(path, "Actor patch must include an actor key.");
    }

    if (operation.op === "add") {
      addStringValue(policy.actors, actor, path, operation.value);
      return;
    }

    if (operation.op === "remove") {
      removeStringValue(policy.actors, actor, path);
      return;
    }

    throw patchError(path, "Use add/remove for policy actors.");
  }

  if (field === "rules") {
    const ruleKey = path[3];

    if (!ruleKey) {
      throw patchError(path, "Rule patch must include a rule key.");
    }

    if (path.length === 4) {
      if (operation.op === "add") {
        expectRecord(operation.value, path);
        addKeyedItem(policy.rules, ruleKey, semanticPolicyRuleKey, path, operation.value);
        return;
      }

      if (operation.op === "set") {
        expectRecord(operation.value, path);
        setKeyedItem(policy.rules, ruleKey, semanticPolicyRuleKey, path, operation.value);
        return;
      }

      removeKeyedItem(policy.rules, ruleKey, semanticPolicyRuleKey, path);
      return;
    }

    const rule = expectArrayMember(policy.rules, ruleKey, semanticPolicyRuleKey, path)
      .item as unknown as Record<string, unknown>;

    if (operation.op !== "set") {
      throw patchError(path, "Use set for rule fields.");
    }

    setRecordField(rule, path[4] ?? "", path, operation.value);
    return;
  }

  if (operation.op !== "set") {
    throw patchError(path, `Use set for policy field "${field}".`);
  }

  setRecordField(policy as unknown as Record<string, unknown>, field ?? "", path, operation.value);
}

function applyViewOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "View patches must include a view key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.views, key, semanticViewKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.views, key, semanticViewKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.views, key, semanticViewKey, path);
    return;
  }

  const view = expectArrayMember(model.views, key, semanticViewKey, path).item;
  const field = path[2];

  if (field === "columns") {
    const column = path[3];

    if (!column) {
      throw patchError(path, "Column patch must include a column key.");
    }

    if (operation.op === "add") {
      addStringValue(view.columns, column, path, operation.value);
      return;
    }

    if (operation.op === "remove") {
      removeStringValue(view.columns, column, path);
      return;
    }

    throw patchError(path, "Use add/remove for view columns.");
  }

  if (operation.op !== "set") {
    throw patchError(path, `Use set for view field "${field}".`);
  }

  setRecordField(view as unknown as Record<string, unknown>, field ?? "", path, operation.value);
}

function applyEffectOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Effect patches must include an effect key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.effects, key, semanticEffectKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.effects, key, semanticEffectKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.effects, key, semanticEffectKey, path);
    return;
  }

  const effect = expectArrayMember(model.effects, key, semanticEffectKey, path)
    .item as unknown as Record<string, unknown>;

  if (operation.op !== "set") {
    throw patchError(path, "Use set for effect fields.");
  }

  setRecordField(effect, path[2] ?? "", path, operation.value);
}

function applyInvariantOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Invariant patches must include an invariant key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.invariants, key, semanticInvariantKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.invariants, key, semanticInvariantKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.invariants, key, semanticInvariantKey, path);
    return;
  }

  const invariant = expectArrayMember(model.invariants, key, semanticInvariantKey, path)
    .item as Record<string, unknown>;

  if (operation.op !== "set") {
    throw patchError(path, "Use set for invariant fields.");
  }

  setRecordField(invariant, path[2] ?? "", path, operation.value);
}

function applyOpenQuestionOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Open-question patches must include a question key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.openQuestions, key, semanticOpenQuestionKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.openQuestions, key, semanticOpenQuestionKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.openQuestions, key, semanticOpenQuestionKey, path);
    return;
  }

  const question = expectArrayMember(
    model.openQuestions,
    key,
    semanticOpenQuestionKey,
    path
  ).item as unknown as Record<string, unknown>;

  if (operation.op !== "set") {
    throw patchError(path, "Use set for open-question fields.");
  }

  setRecordField(question, path[2] ?? "", path, operation.value);
}

function applyProvenanceOperation(
  model: SemanticWorldModel,
  operation: SemanticPatchOperation,
  path: string[]
): void {
  const key = path[1];

  if (!key) {
    throw patchError(path, "Provenance patches must include a provenance key.");
  }

  if (path.length === 2) {
    if (operation.op === "add") {
      expectRecord(operation.value, path);
      addKeyedItem(model.provenance, key, semanticProvenanceKey, path, operation.value);
      return;
    }

    if (operation.op === "set") {
      expectRecord(operation.value, path);
      setKeyedItem(model.provenance, key, semanticProvenanceKey, path, operation.value);
      return;
    }

    removeKeyedItem(model.provenance, key, semanticProvenanceKey, path);
    return;
  }

  const provenance = expectArrayMember(model.provenance, key, semanticProvenanceKey, path)
    .item as unknown as Record<string, unknown>;

  if (operation.op !== "set") {
    throw patchError(path, "Use set for provenance fields.");
  }

  setRecordField(provenance, path[2] ?? "", path, operation.value);
}

function applyPatchOperation(model: SemanticWorldModel, operation: SemanticPatchOperation): void {
  const path = normalizePath(operation.path);
  const root = path[0];

  if (!root) {
    throw patchError(path, "Patch path must not be empty.");
  }

  if (root === "name" || root === "version" || root === "domain") {
    if (path.length !== 1 || operation.op !== "set") {
      throw patchError(path, `Top-level field "${root}" only supports set.`);
    }

    (model as unknown as Record<string, unknown>)[root] = operation.value;
    return;
  }

  switch (root) {
    case "concepts":
      applyConceptOperation(model, operation, path);
      return;
    case "entities":
      applyEntityOperation(model, operation, path);
      return;
    case "relations":
      applyRelationOperation(model, operation, path);
      return;
    case "states":
      applyStateOperation(model, operation, path);
      return;
    case "actions":
      applyActionOperation(model, operation, path);
      return;
    case "policies":
      applyPolicyOperation(model, operation, path);
      return;
    case "views":
      applyViewOperation(model, operation, path);
      return;
    case "effects":
      applyEffectOperation(model, operation, path);
      return;
    case "invariants":
      applyInvariantOperation(model, operation, path);
      return;
    case "openQuestions":
      applyOpenQuestionOperation(model, operation, path);
      return;
    case "provenance":
      applyProvenanceOperation(model, operation, path);
      return;
    default:
      throw patchError(path, `Unknown root section "${root}".`);
  }
}

/**
 * Semantic patches are the first editable mutation layer on top of the
 * canonical world model. They are intentionally strict: every operation
 * targets a known semantic path, and the final model must still validate.
 */
export function applySemanticPatch(
  model: SemanticWorldModel,
  patch: SemanticPatchDocument
): SemanticWorldModel {
  const workingModel = structuredClone(canonicalizeWorldModel(model));

  for (const operation of patch.operations) {
    applyPatchOperation(workingModel, operation);
  }

  const canonicalModel = canonicalizeWorldModel(workingModel);
  const validation = validateWorldModel(canonicalModel);

  if (!validation.ok) {
    const detail = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");

    throw new Error(`Patched model failed validation: ${detail}`);
  }

  return canonicalModel;
}
