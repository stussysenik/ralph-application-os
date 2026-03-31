import type { SemanticWorldModel } from "./types.js";

export interface SemanticValidationIssue {
  path: string;
  message: string;
}

export interface SemanticValidationResult {
  ok: boolean;
  issues: SemanticValidationIssue[];
}

function pushDuplicateIssues(
  issues: SemanticValidationIssue[],
  path: string,
  values: string[],
  messagePrefix: string
): void {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  for (const [value, count] of counts.entries()) {
    if (count > 1) {
      issues.push({
        path,
        message: `${messagePrefix} "${value}" appears ${count} times.`
      });
    }
  }
}

/**
 * Runtime validation keeps JSON-loaded models honest before they reach
 * builders, proofs, or operator-facing reports. The checks stay small on
 * purpose: enough to catch invalid or ambiguous kernels without pretending
 * we already have a full schema compiler.
 */
export function validateWorldModel(model: SemanticWorldModel): SemanticValidationResult {
  const issues: SemanticValidationIssue[] = [];

  if (model.name.trim().length === 0) {
    issues.push({ path: "name", message: "Model name must not be empty." });
  }

  if (model.version.trim().length === 0) {
    issues.push({ path: "version", message: "Model version must not be empty." });
  }

  if (model.domain.trim().length === 0) {
    issues.push({ path: "domain", message: "Model domain must not be empty." });
  }

  pushDuplicateIssues(
    issues,
    "entities",
    model.entities.map((entity) => entity.name),
    "Entity name"
  );
  pushDuplicateIssues(
    issues,
    "actions",
    model.actions.map((action) => action.name),
    "Action name"
  );
  pushDuplicateIssues(
    issues,
    "policies",
    model.policies.map((policy) => policy.name),
    "Policy name"
  );
  pushDuplicateIssues(
    issues,
    "views",
    model.views.map((view) => view.name),
    "View name"
  );
  pushDuplicateIssues(
    issues,
    "effects",
    model.effects.map((effect) => effect.name),
    "Effect name"
  );
  pushDuplicateIssues(
    issues,
    "invariants",
    model.invariants.map((invariant) => invariant.name),
    "Invariant name"
  );
  pushDuplicateIssues(
    issues,
    "openQuestions",
    model.openQuestions.map((question) => question.id),
    "Open question id"
  );
  pushDuplicateIssues(
    issues,
    "states",
    model.states.map((state) => `${state.entity}:${state.name}`),
    "State key"
  );

  for (const entity of model.entities) {
    pushDuplicateIssues(
      issues,
      `entities.${entity.name}.attributes`,
      entity.attributes.map((attribute) => attribute.name),
      `Attribute name on ${entity.name}`
    );
  }

  for (const action of model.actions) {
    if (action.actors.length === 0) {
      issues.push({
        path: `actions.${action.name}.actors`,
        message: `Action ${action.name} must list at least one actor.`
      });
    }
  }

  for (const policy of model.policies) {
    if (policy.actors.length === 0) {
      issues.push({
        path: `policies.${policy.name}.actors`,
        message: `Policy ${policy.name} must list at least one actor.`
      });
    }

    if (policy.rules.length === 0) {
      issues.push({
        path: `policies.${policy.name}.rules`,
        message: `Policy ${policy.name} must define at least one rule.`
      });
    }
  }

  const entityNamesWithStates = new Set(model.states.map((state) => state.entity));

  for (const entityName of entityNamesWithStates) {
    const states = model.states.filter((state) => state.entity === entityName);
    const initialStates = states.filter((state) => state.initial);

    if (initialStates.length === 0) {
      issues.push({
        path: `states.${entityName}`,
        message: `Entity ${entityName} has states but no initial state.`
      });
    }

    if (initialStates.length > 1) {
      issues.push({
        path: `states.${entityName}`,
        message: `Entity ${entityName} has ${initialStates.length} initial states.`
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}
