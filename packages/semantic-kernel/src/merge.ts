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
import { applySemanticPatch, type SemanticPatchDocument, type SemanticPatchOperation } from "./patch.js";
import { canonicalizeWorldModel } from "./serialize.js";
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

export interface SemanticMergeConflict {
  path: string;
  reason: string;
  leftOperation: SemanticPatchOperation;
  rightOperation: SemanticPatchOperation;
}

export interface SemanticWorldModelMergeResult {
  ok: boolean;
  leftPatch: SemanticPatchDocument;
  rightPatch: SemanticPatchDocument;
  mergedPatch: SemanticPatchDocument;
  conflicts: SemanticMergeConflict[];
  mergedModel?: SemanticWorldModel;
  validationError?: string;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pathToString(path: string[]): string {
  return path.join(".");
}

function normalizePath(path: string[] | string): string[] {
  return Array.isArray(path) ? [...path] : path.split(".").filter((segment) => segment.length > 0);
}

function comparePaths(left: string[], right: string[]): number {
  return pathToString(left).localeCompare(pathToString(right));
}

function scalarChanged(left: unknown, right: unknown): boolean {
  return !deepEqual(left, right);
}

function sortPatchOperations(operations: SemanticPatchOperation[]): SemanticPatchOperation[] {
  return [...operations].sort((leftOperation, rightOperation) => {
    const leftPath = normalizePath(leftOperation.path);
    const rightPath = normalizePath(rightOperation.path);
    const leftIsRemove = leftOperation.op === "remove";
    const rightIsRemove = rightOperation.op === "remove";

    if (leftIsRemove !== rightIsRemove) {
      return leftIsRemove ? -1 : 1;
    }

    if (leftIsRemove && rightIsRemove && leftPath.length !== rightPath.length) {
      return rightPath.length - leftPath.length;
    }

    if (!leftIsRemove && !rightIsRemove && leftPath.length !== rightPath.length) {
      return leftPath.length - rightPath.length;
    }

    if (leftOperation.op !== rightOperation.op) {
      return leftOperation.op.localeCompare(rightOperation.op);
    }

    return comparePaths(leftPath, rightPath);
  });
}

function pushSetOperation(
  operations: SemanticPatchOperation[],
  path: string[],
  left: unknown,
  right: unknown
): void {
  if (!scalarChanged(left, right)) {
    return;
  }

  operations.push({
    op: "set",
    path,
    value: right
  });
}

function collectStringListPatch(
  operations: SemanticPatchOperation[],
  basePath: string[],
  left: string[],
  right: string[]
): void {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const values = [...new Set([...left, ...right])].sort((a, b) => a.localeCompare(b));

  for (const value of values) {
    if (!rightSet.has(value)) {
      operations.push({ op: "remove", path: [...basePath, value] });
      continue;
    }

    if (!leftSet.has(value)) {
      operations.push({ op: "add", path: [...basePath, value], value });
    }
  }
}

function collectKeyedCollectionPatch<T>(
  operations: SemanticPatchOperation[],
  basePath: string[],
  left: T[],
  right: T[],
  keyOf: (item: T) => string,
  collectExisting?: (operations: SemanticPatchOperation[], itemPath: string[], left: T, right: T) => void
): void {
  const leftMap = new Map(left.map((item) => [keyOf(item), item]));
  const rightMap = new Map(right.map((item) => [keyOf(item), item]));
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort((a, b) => a.localeCompare(b));

  for (const key of keys) {
    const leftItem = leftMap.get(key);
    const rightItem = rightMap.get(key);
    const itemPath = [...basePath, key];

    if (leftItem && !rightItem) {
      operations.push({ op: "remove", path: itemPath });
      continue;
    }

    if (!leftItem && rightItem) {
      operations.push({ op: "add", path: itemPath, value: rightItem });
      continue;
    }

    if (!leftItem || !rightItem || deepEqual(leftItem, rightItem)) {
      continue;
    }

    if (collectExisting) {
      collectExisting(operations, itemPath, leftItem, rightItem);
      continue;
    }

    operations.push({ op: "set", path: itemPath, value: rightItem });
  }
}

function collectConceptPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticConcept,
  right: SemanticConcept
): void {
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
  collectStringListPatch(operations, [...itemPath, "aliases"], left.aliases, right.aliases);
  collectKeyedCollectionPatch(
    operations,
    [...itemPath, "provenance"],
    left.provenance,
    right.provenance,
    semanticProvenanceKey,
    (items, provenancePath, leftEntry, rightEntry) => {
      pushSetOperation(items, [...provenancePath, "sourceType"], leftEntry.sourceType, rightEntry.sourceType);
      pushSetOperation(items, [...provenancePath, "sourceRef"], leftEntry.sourceRef, rightEntry.sourceRef);
      pushSetOperation(items, [...provenancePath, "note"], leftEntry.note, rightEntry.note);
      pushSetOperation(items, [...provenancePath, "confidence"], leftEntry.confidence, rightEntry.confidence);
    }
  );
}

function collectEntityPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticEntity,
  right: SemanticEntity
): void {
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
  collectKeyedCollectionPatch(
    operations,
    [...itemPath, "attributes"],
    left.attributes,
    right.attributes,
    semanticAttributeKey,
    (items, attributePath, leftAttribute, rightAttribute) => {
      pushSetOperation(items, [...attributePath, "type"], leftAttribute.type, rightAttribute.type);
      pushSetOperation(items, [...attributePath, "required"], leftAttribute.required, rightAttribute.required);
      pushSetOperation(items, [...attributePath, "description"], leftAttribute.description, rightAttribute.description);
    }
  );
}

function collectRelationPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticRelation,
  right: SemanticRelation
): void {
  pushSetOperation(operations, [...itemPath, "cardinality"], left.cardinality, right.cardinality);
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
}

function collectStatePatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticState,
  right: SemanticState
): void {
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
  pushSetOperation(operations, [...itemPath, "initial"], left.initial, right.initial);
  pushSetOperation(operations, [...itemPath, "terminal"], left.terminal, right.terminal);
}

function collectActionPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticAction,
  right: SemanticAction
): void {
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
  collectStringListPatch(operations, [...itemPath, "actors"], left.actors, right.actors);
}

function collectPolicyPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticPolicy,
  right: SemanticPolicy
): void {
  pushSetOperation(operations, [...itemPath, "appliesTo"], left.appliesTo, right.appliesTo);
  pushSetOperation(operations, [...itemPath, "effect"], left.effect, right.effect);
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
  collectStringListPatch(operations, [...itemPath, "actors"], left.actors, right.actors);
  collectKeyedCollectionPatch(
    operations,
    [...itemPath, "rules"],
    left.rules,
    right.rules,
    semanticPolicyRuleKey,
    (items, rulePath, leftRule, rightRule) => {
      pushSetOperation(items, [...rulePath, "field"], leftRule.field, rightRule.field);
      pushSetOperation(items, [...rulePath, "operator"], leftRule.operator, rightRule.operator);
      pushSetOperation(items, [...rulePath, "value"], leftRule.value, rightRule.value);
    }
  );
}

function collectViewPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticView,
  right: SemanticView
): void {
  pushSetOperation(operations, [...itemPath, "entity"], left.entity, right.entity);
  pushSetOperation(operations, [...itemPath, "kind"], left.kind, right.kind);
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
  collectStringListPatch(operations, [...itemPath, "columns"], left.columns, right.columns);
}

function collectEffectPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticEffect,
  right: SemanticEffect
): void {
  pushSetOperation(operations, [...itemPath, "kind"], left.kind, right.kind);
  pushSetOperation(operations, [...itemPath, "trigger"], left.trigger, right.trigger);
  pushSetOperation(operations, [...itemPath, "description"], left.description, right.description);
}

function collectInvariantPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticInvariant,
  right: SemanticInvariant
): void {
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .filter((key) => key !== "name")
    .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey));

  for (const key of keys) {
    pushSetOperation(
      operations,
      [...itemPath, key],
      left[key as keyof SemanticInvariant],
      right[key as keyof SemanticInvariant]
    );
  }
}

function collectOpenQuestionPatch(
  operations: SemanticPatchOperation[],
  itemPath: string[],
  left: SemanticOpenQuestion,
  right: SemanticOpenQuestion
): void {
  pushSetOperation(operations, [...itemPath, "prompt"], left.prompt, right.prompt);
  pushSetOperation(operations, [...itemPath, "status"], left.status, right.status);
}

function collectProvenancePatch(
  operations: SemanticPatchOperation[],
  basePath: string[],
  left: SemanticProvenance[],
  right: SemanticProvenance[]
): void {
  collectKeyedCollectionPatch(
    operations,
    basePath,
    left,
    right,
    semanticProvenanceKey,
    (items, provenancePath, leftEntry, rightEntry) => {
      pushSetOperation(items, [...provenancePath, "sourceType"], leftEntry.sourceType, rightEntry.sourceType);
      pushSetOperation(items, [...provenancePath, "sourceRef"], leftEntry.sourceRef, rightEntry.sourceRef);
      pushSetOperation(items, [...provenancePath, "note"], leftEntry.note, rightEntry.note);
      pushSetOperation(items, [...provenancePath, "confidence"], leftEntry.confidence, rightEntry.confidence);
    }
  );
}

export function createSemanticPatchFromWorldModels(
  base: SemanticWorldModel,
  target: SemanticWorldModel,
  note?: string
): SemanticPatchDocument {
  const baseModel = canonicalizeWorldModel(base);
  const targetModel = canonicalizeWorldModel(target);
  const operations: SemanticPatchOperation[] = [];

  pushSetOperation(operations, ["name"], baseModel.name, targetModel.name);
  pushSetOperation(operations, ["version"], baseModel.version, targetModel.version);
  pushSetOperation(operations, ["domain"], baseModel.domain, targetModel.domain);

  collectKeyedCollectionPatch(operations, ["concepts"], baseModel.concepts, targetModel.concepts, semanticConceptKey, collectConceptPatch);
  collectKeyedCollectionPatch(operations, ["entities"], baseModel.entities, targetModel.entities, semanticEntityKey, collectEntityPatch);
  collectKeyedCollectionPatch(operations, ["relations"], baseModel.relations, targetModel.relations, semanticRelationKey, collectRelationPatch);
  collectKeyedCollectionPatch(operations, ["states"], baseModel.states, targetModel.states, semanticStateKey, collectStatePatch);
  collectKeyedCollectionPatch(operations, ["actions"], baseModel.actions, targetModel.actions, semanticActionKey, collectActionPatch);
  collectKeyedCollectionPatch(operations, ["policies"], baseModel.policies, targetModel.policies, semanticPolicyKey, collectPolicyPatch);
  collectKeyedCollectionPatch(operations, ["views"], baseModel.views, targetModel.views, semanticViewKey, collectViewPatch);
  collectKeyedCollectionPatch(operations, ["effects"], baseModel.effects, targetModel.effects, semanticEffectKey, collectEffectPatch);
  collectKeyedCollectionPatch(operations, ["invariants"], baseModel.invariants, targetModel.invariants, semanticInvariantKey, collectInvariantPatch);
  collectKeyedCollectionPatch(
    operations,
    ["openQuestions"],
    baseModel.openQuestions,
    targetModel.openQuestions,
    semanticOpenQuestionKey,
    collectOpenQuestionPatch
  );
  collectProvenancePatch(operations, ["provenance"], baseModel.provenance, targetModel.provenance);

  return {
    ...(note ? { note } : {}),
    operations: sortPatchOperations(operations)
  };
}

function operationsEqual(left: SemanticPatchOperation, right: SemanticPatchOperation): boolean {
  if (left.op !== right.op) {
    return false;
  }

  if (!deepEqual(normalizePath(left.path), normalizePath(right.path))) {
    return false;
  }

  return deepEqual(
    "value" in left ? left.value : undefined,
    "value" in right ? right.value : undefined
  );
}

function pathsOverlap(leftPath: string[], rightPath: string[]): boolean {
  const minLength = Math.min(leftPath.length, rightPath.length);

  for (let index = 0; index < minLength; index += 1) {
    if (leftPath[index] !== rightPath[index]) {
      return false;
    }
  }

  return true;
}

function mergePatchDocuments(
  leftPatch: SemanticPatchDocument,
  rightPatch: SemanticPatchDocument
): { mergedPatch: SemanticPatchDocument; conflicts: SemanticMergeConflict[] } {
  const mergedOperations: SemanticPatchOperation[] = [];
  const conflicts: SemanticMergeConflict[] = [];

  for (const operation of sortPatchOperations(leftPatch.operations)) {
    mergedOperations.push(operation);
  }

  for (const rightOperation of sortPatchOperations(rightPatch.operations)) {
    let shouldAdd = true;

    for (const leftOperation of mergedOperations) {
      const leftPath = normalizePath(leftOperation.path);
      const rightPath = normalizePath(rightOperation.path);

      if (!pathsOverlap(leftPath, rightPath)) {
        continue;
      }

      if (operationsEqual(leftOperation, rightOperation)) {
        shouldAdd = false;
        break;
      }

      const samePath = deepEqual(leftPath, rightPath);
      const reason = samePath
        ? "Both branches changed the same semantic path differently."
        : "One branch changed a parent semantic path while the other changed a nested semantic path.";

      conflicts.push({
        path: pathToString(samePath ? leftPath : leftPath.length <= rightPath.length ? leftPath : rightPath),
        reason,
        leftOperation,
        rightOperation
      });
      shouldAdd = false;
      break;
    }

    if (shouldAdd) {
      mergedOperations.push(rightOperation);
    }
  }

  return {
    mergedPatch: {
      note: "Auto-merged semantic patch from left and right branches.",
      operations: sortPatchOperations(mergedOperations)
    },
    conflicts
  };
}

export function mergeSemanticWorldModels(
  base: SemanticWorldModel,
  left: SemanticWorldModel,
  right: SemanticWorldModel
): SemanticWorldModelMergeResult {
  const leftPatch = createSemanticPatchFromWorldModels(base, left, "Left branch semantic patch.");
  const rightPatch = createSemanticPatchFromWorldModels(base, right, "Right branch semantic patch.");
  const { mergedPatch, conflicts } = mergePatchDocuments(leftPatch, rightPatch);

  if (conflicts.length > 0) {
    return {
      ok: false,
      leftPatch,
      rightPatch,
      mergedPatch,
      conflicts
    };
  }

  try {
    const mergedModel = applySemanticPatch(base, mergedPatch);

    return {
      ok: true,
      leftPatch,
      rightPatch,
      mergedPatch,
      conflicts,
      mergedModel
    };
  } catch (error) {
    return {
      ok: false,
      leftPatch,
      rightPatch,
      mergedPatch,
      conflicts,
      validationError: error instanceof Error ? error.message : String(error)
    };
  }
}
