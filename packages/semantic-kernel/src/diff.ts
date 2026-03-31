import { canonicalizeWorldModel } from "./serialize.js";
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

export type SemanticDiffKind = "added" | "removed" | "changed";

export interface SemanticDiffChange {
  kind: SemanticDiffKind;
  path: string;
  detail: string;
  before?: unknown;
  after?: unknown;
}

export interface SemanticWorldModelDiff {
  same: boolean;
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
  changes: SemanticDiffChange[];
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pushChange(
  changes: SemanticDiffChange[],
  kind: SemanticDiffKind,
  path: string,
  detail: string,
  before?: unknown,
  after?: unknown
): void {
  changes.push({
    kind,
    path,
    detail,
    ...(before === undefined ? {} : { before }),
    ...(after === undefined ? {} : { after })
  });
}

function diffScalar(
  changes: SemanticDiffChange[],
  path: string,
  detail: string,
  left: unknown,
  right: unknown
): void {
  if (!deepEqual(left, right)) {
    pushChange(changes, "changed", path, detail, left, right);
  }
}

function diffStringList(
  changes: SemanticDiffChange[],
  path: string,
  itemLabel: string,
  left: string[],
  right: string[]
): void {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const allValues = [...new Set([...left, ...right])].sort((a, b) => a.localeCompare(b));

  for (const value of allValues) {
    if (!rightSet.has(value)) {
      pushChange(changes, "removed", `${path}.${value}`, `Removed ${itemLabel} "${value}".`, value);
      continue;
    }

    if (!leftSet.has(value)) {
      pushChange(changes, "added", `${path}.${value}`, `Added ${itemLabel} "${value}".`, undefined, value);
    }
  }
}

function keyedMap<T>(items: T[], keyOf: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [keyOf(item), item]));
}

function diffKeyedCollection<T>(
  changes: SemanticDiffChange[],
  path: string,
  label: string,
  left: T[],
  right: T[],
  keyOf: (item: T) => string,
  diffExisting?: (changes: SemanticDiffChange[], basePath: string, left: T, right: T) => void
): void {
  const leftMap = keyedMap(left, keyOf);
  const rightMap = keyedMap(right, keyOf);
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort((a, b) =>
    a.localeCompare(b)
  );

  for (const key of keys) {
    const leftItem = leftMap.get(key);
    const rightItem = rightMap.get(key);
    const itemPath = `${path}.${key}`;

    if (leftItem && !rightItem) {
      pushChange(changes, "removed", itemPath, `Removed ${label} "${key}".`, leftItem);
      continue;
    }

    if (!leftItem && rightItem) {
      pushChange(changes, "added", itemPath, `Added ${label} "${key}".`, undefined, rightItem);
      continue;
    }

    if (!leftItem || !rightItem) {
      continue;
    }

    if (deepEqual(leftItem, rightItem)) {
      continue;
    }

    const beforeCount = changes.length;
    diffExisting?.(changes, itemPath, leftItem, rightItem);

    if (changes.length === beforeCount) {
      pushChange(changes, "changed", itemPath, `Changed ${label} "${key}".`, leftItem, rightItem);
    }
  }
}

function diffAttributes(
  changes: SemanticDiffChange[],
  path: string,
  left: SemanticAttribute[],
  right: SemanticAttribute[]
): void {
  diffKeyedCollection(changes, path, "attribute", left, right, semanticAttributeKey, (items, itemPath, leftAttribute, rightAttribute) => {
    diffScalar(
      items,
      `${itemPath}.type`,
      `Changed attribute ${leftAttribute.name} type.`,
      leftAttribute.type,
      rightAttribute.type
    );
    diffScalar(
      items,
      `${itemPath}.required`,
      `Changed attribute ${leftAttribute.name} required flag.`,
      leftAttribute.required,
      rightAttribute.required
    );
    diffScalar(
      items,
      `${itemPath}.description`,
      `Changed attribute ${leftAttribute.name} description.`,
      leftAttribute.description,
      rightAttribute.description
    );
  });
}

function diffProvenance(
  changes: SemanticDiffChange[],
  path: string,
  left: SemanticProvenance[],
  right: SemanticProvenance[]
): void {
  diffKeyedCollection(
    changes,
    path,
    "provenance entry",
    left,
    right,
    semanticProvenanceKey,
    (items, itemPath, leftEntry, rightEntry) => {
      diffScalar(
        items,
        `${itemPath}.confidence`,
        `Changed provenance confidence for ${leftEntry.sourceType}:${leftEntry.sourceRef}.`,
        leftEntry.confidence,
        rightEntry.confidence
      );
    }
  );
}

function diffConcepts(
  changes: SemanticDiffChange[],
  left: SemanticConcept[],
  right: SemanticConcept[]
): void {
  diffKeyedCollection(changes, "concepts", "concept", left, right, semanticConceptKey, (items, itemPath, leftConcept, rightConcept) => {
    diffScalar(
      items,
      `${itemPath}.description`,
      `Changed concept ${leftConcept.name} description.`,
      leftConcept.description,
      rightConcept.description
    );
    diffStringList(
      items,
      `${itemPath}.aliases`,
      `alias on concept ${leftConcept.name}`,
      leftConcept.aliases,
      rightConcept.aliases
    );
    diffProvenance(
      items,
      `${itemPath}.provenance`,
      leftConcept.provenance,
      rightConcept.provenance
    );
  });
}

function diffEntities(
  changes: SemanticDiffChange[],
  left: SemanticEntity[],
  right: SemanticEntity[]
): void {
  diffKeyedCollection(changes, "entities", "entity", left, right, semanticEntityKey, (items, itemPath, leftEntity, rightEntity) => {
    diffScalar(
      items,
      `${itemPath}.description`,
      `Changed entity ${leftEntity.name} description.`,
      leftEntity.description,
      rightEntity.description
    );
    diffAttributes(
      items,
      `${itemPath}.attributes`,
      leftEntity.attributes,
      rightEntity.attributes
    );
  });
}

function diffRelations(
  changes: SemanticDiffChange[],
  left: SemanticRelation[],
  right: SemanticRelation[]
): void {
  diffKeyedCollection(
    changes,
    "relations",
    "relation",
    left,
    right,
    semanticRelationKey,
    (items, itemPath, leftRelation, rightRelation) => {
      diffScalar(
        items,
        `${itemPath}.cardinality`,
        `Changed relation ${leftRelation.name} cardinality.`,
        leftRelation.cardinality,
        rightRelation.cardinality
      );
      diffScalar(
        items,
        `${itemPath}.description`,
        `Changed relation ${leftRelation.name} description.`,
        leftRelation.description,
        rightRelation.description
      );
    }
  );
}

function diffStates(
  changes: SemanticDiffChange[],
  left: SemanticState[],
  right: SemanticState[]
): void {
  diffKeyedCollection(
    changes,
    "states",
    "state",
    left,
    right,
    semanticStateKey,
    (items, itemPath, leftState, rightState) => {
      diffScalar(
        items,
        `${itemPath}.initial`,
        `Changed state ${leftState.entity}:${leftState.name} initial flag.`,
        leftState.initial,
        rightState.initial
      );
      diffScalar(
        items,
        `${itemPath}.terminal`,
        `Changed state ${leftState.entity}:${leftState.name} terminal flag.`,
        leftState.terminal,
        rightState.terminal
      );
      diffScalar(
        items,
        `${itemPath}.description`,
        `Changed state ${leftState.entity}:${leftState.name} description.`,
        leftState.description,
        rightState.description
      );
    }
  );
}

function diffActions(
  changes: SemanticDiffChange[],
  left: SemanticAction[],
  right: SemanticAction[]
): void {
  diffKeyedCollection(
    changes,
    "actions",
    "action",
    left,
    right,
    semanticActionKey,
    (items, itemPath, leftAction, rightAction) => {
      diffStringList(
        items,
        `${itemPath}.actors`,
        `actor on action ${leftAction.name}`,
        leftAction.actors,
        rightAction.actors
      );
      diffScalar(
        items,
        `${itemPath}.description`,
        `Changed action ${leftAction.name} description.`,
        leftAction.description,
        rightAction.description
      );
    }
  );
}

function diffRules(
  changes: SemanticDiffChange[],
  path: string,
  left: SemanticPolicyRule[],
  right: SemanticPolicyRule[]
): void {
  diffKeyedCollection(
    changes,
    path,
    "policy rule",
    left,
    right,
    semanticPolicyRuleKey
  );
}

function diffPolicies(
  changes: SemanticDiffChange[],
  left: SemanticPolicy[],
  right: SemanticPolicy[]
): void {
  diffKeyedCollection(changes, "policies", "policy", left, right, semanticPolicyKey, (items, itemPath, leftPolicy, rightPolicy) => {
    diffScalar(
      items,
      `${itemPath}.appliesTo`,
      `Changed policy ${leftPolicy.name} target entity.`,
      leftPolicy.appliesTo,
      rightPolicy.appliesTo
    );
    diffScalar(
      items,
      `${itemPath}.effect`,
      `Changed policy ${leftPolicy.name} effect.`,
      leftPolicy.effect,
      rightPolicy.effect
    );
    diffStringList(
      items,
      `${itemPath}.actors`,
      `actor on policy ${leftPolicy.name}`,
      leftPolicy.actors,
      rightPolicy.actors
    );
    diffRules(items, `${itemPath}.rules`, leftPolicy.rules, rightPolicy.rules);
    diffScalar(
      items,
      `${itemPath}.description`,
      `Changed policy ${leftPolicy.name} description.`,
      leftPolicy.description,
      rightPolicy.description
    );
  });
}

function diffViews(
  changes: SemanticDiffChange[],
  left: SemanticView[],
  right: SemanticView[]
): void {
  diffKeyedCollection(changes, "views", "view", left, right, semanticViewKey, (items, itemPath, leftView, rightView) => {
    diffScalar(
      items,
      `${itemPath}.entity`,
      `Changed view ${leftView.name} entity.`,
      leftView.entity,
      rightView.entity
    );
    diffScalar(
      items,
      `${itemPath}.kind`,
      `Changed view ${leftView.name} kind.`,
      leftView.kind,
      rightView.kind
    );
    diffStringList(
      items,
      `${itemPath}.columns`,
      `column on view ${leftView.name}`,
      leftView.columns,
      rightView.columns
    );
    diffScalar(
      items,
      `${itemPath}.description`,
      `Changed view ${leftView.name} description.`,
      leftView.description,
      rightView.description
    );
  });
}

function diffEffects(
  changes: SemanticDiffChange[],
  left: SemanticEffect[],
  right: SemanticEffect[]
): void {
  diffKeyedCollection(changes, "effects", "effect", left, right, semanticEffectKey, (items, itemPath, leftEffect, rightEffect) => {
    diffScalar(
      items,
      `${itemPath}.kind`,
      `Changed effect ${leftEffect.name} kind.`,
      leftEffect.kind,
      rightEffect.kind
    );
    diffScalar(
      items,
      `${itemPath}.trigger`,
      `Changed effect ${leftEffect.name} trigger.`,
      leftEffect.trigger,
      rightEffect.trigger
    );
    diffScalar(
      items,
      `${itemPath}.description`,
      `Changed effect ${leftEffect.name} description.`,
      leftEffect.description,
      rightEffect.description
    );
  });
}

function diffInvariants(
  changes: SemanticDiffChange[],
  left: SemanticInvariant[],
  right: SemanticInvariant[]
): void {
  diffKeyedCollection(changes, "invariants", "invariant", left, right, semanticInvariantKey, (items, itemPath, leftInvariant, rightInvariant) => {
    const keys = [...new Set([...Object.keys(leftInvariant), ...Object.keys(rightInvariant)])]
      .filter((key) => key !== "name")
      .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey));

    for (const key of keys) {
      diffScalar(
        items,
        `${itemPath}.${key}`,
        `Changed invariant ${leftInvariant.name} field ${key}.`,
        leftInvariant[key as keyof SemanticInvariant],
        rightInvariant[key as keyof SemanticInvariant]
      );
    }
  });
}

function diffOpenQuestions(
  changes: SemanticDiffChange[],
  left: SemanticOpenQuestion[],
  right: SemanticOpenQuestion[]
): void {
  diffKeyedCollection(
    changes,
    "openQuestions",
    "open question",
    left,
    right,
    semanticOpenQuestionKey,
    (items, itemPath, leftQuestion, rightQuestion) => {
      diffScalar(
        items,
        `${itemPath}.prompt`,
        `Changed open question ${leftQuestion.id} prompt.`,
        leftQuestion.prompt,
        rightQuestion.prompt
      );
      diffScalar(
        items,
        `${itemPath}.status`,
        `Changed open question ${leftQuestion.id} status.`,
        leftQuestion.status,
        rightQuestion.status
      );
    }
  );
}

export function diffWorldModels(
  left: SemanticWorldModel,
  right: SemanticWorldModel
): SemanticWorldModelDiff {
  const leftModel = canonicalizeWorldModel(left);
  const rightModel = canonicalizeWorldModel(right);
  const changes: SemanticDiffChange[] = [];

  diffScalar(changes, "name", "Changed model name.", leftModel.name, rightModel.name);
  diffScalar(changes, "version", "Changed model version.", leftModel.version, rightModel.version);
  diffScalar(changes, "domain", "Changed model domain.", leftModel.domain, rightModel.domain);

  diffConcepts(changes, leftModel.concepts, rightModel.concepts);
  diffEntities(changes, leftModel.entities, rightModel.entities);
  diffRelations(changes, leftModel.relations, rightModel.relations);
  diffStates(changes, leftModel.states, rightModel.states);
  diffActions(changes, leftModel.actions, rightModel.actions);
  diffPolicies(changes, leftModel.policies, rightModel.policies);
  diffViews(changes, leftModel.views, rightModel.views);
  diffEffects(changes, leftModel.effects, rightModel.effects);
  diffInvariants(changes, leftModel.invariants, rightModel.invariants);
  diffOpenQuestions(changes, leftModel.openQuestions, rightModel.openQuestions);
  diffProvenance(changes, "provenance", leftModel.provenance, rightModel.provenance);

  const summary = changes.reduce(
    (counts, change) => {
      counts[change.kind] += 1;
      return counts;
    },
    { added: 0, removed: 0, changed: 0 }
  );

  return {
    same: changes.length === 0,
    summary,
    changes
  };
}
