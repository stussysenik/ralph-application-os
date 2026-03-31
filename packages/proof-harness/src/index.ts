import type {
  SemanticAction,
  SemanticInvariant,
  SemanticPolicy,
  SemanticState,
  SemanticWorldModel
} from "@ralph/semantic-kernel";
import { validateWorldModel } from "@ralph/semantic-kernel";

export interface ProofCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface ProofResult {
  ok: boolean;
  checks: ProofCheck[];
}

function findState(
  states: SemanticState[],
  entity: string,
  stateName: string
): SemanticState | undefined {
  return states.find((state) => state.entity === entity && state.name === stateName);
}

function checkActionInvariant(
  action: SemanticAction | undefined,
  invariant: Extract<SemanticInvariant, { kind: "action-state-chain" }>
): ProofCheck {
  if (!action) {
    return {
      name: invariant.name,
      ok: false,
      detail: `Action ${invariant.action} does not exist.`
    };
  }

  const ok = action.from === invariant.requiredFrom && action.to === invariant.requiredTo;

  return {
    name: invariant.name,
    ok,
    detail: ok
      ? `Action ${action.name} matches ${invariant.requiredFrom} -> ${invariant.requiredTo}.`
      : `Expected ${action.name} to be ${invariant.requiredFrom} -> ${invariant.requiredTo}, got ${action.from} -> ${action.to}.`
  };
}

function checkPolicyInvariant(
  policy: SemanticPolicy | undefined,
  invariant: Extract<SemanticInvariant, { kind: "policy-threshold" }>
): ProofCheck {
  if (!policy) {
    return {
      name: invariant.name,
      ok: false,
      detail: `Policy ${invariant.policy} does not exist.`
    };
  }

  const actorPresent = policy.actors.includes(invariant.requiredActor);
  const rulePresent = policy.rules.some(
    (rule) =>
      rule.field === invariant.field &&
      rule.operator === invariant.operator &&
      rule.value === invariant.value
  );
  const ok = actorPresent && rulePresent;

  return {
    name: invariant.name,
    ok,
    detail: ok
      ? `Policy ${policy.name} contains the required actor and threshold rule.`
      : `Policy ${policy.name} is missing actor ${invariant.requiredActor} or rule ${invariant.field} ${invariant.operator} ${String(invariant.value)}.`
  };
}

function checkInvariant(model: SemanticWorldModel, invariant: SemanticInvariant): ProofCheck {
  if (invariant.kind === "action-state-chain") {
    const action = model.actions.find((candidate) => candidate.name === invariant.action);
    return checkActionInvariant(action, invariant);
  }

  const policy = model.policies.find((candidate) => candidate.name === invariant.policy);
  return checkPolicyInvariant(policy, invariant);
}

/**
 * The proof harness is the contract that prevents the repo from drifting
 * into demo-only generation. This first implementation proves that a model
 * is structurally coherent and that benchmark-specific invariants hold.
 */
export function runKernelProofs(model: SemanticWorldModel): ProofResult {
  const entityNames = new Set(model.entities.map((entity) => entity.name));
  const validation = validateWorldModel(model);

  const checks: ProofCheck[] = [
    {
      name: "world-model-passes-runtime-validation",
      ok: validation.ok,
      detail: validation.ok
        ? "Model passed runtime validation."
        : `Model has ${validation.issues.length} validation issue(s).`
    },
    ...validation.issues.map((issue) => ({
      name: `validation:${issue.path}`,
      ok: false,
      detail: issue.message
    })),
    {
      name: "world-model-has-entities",
      ok: model.entities.length > 0,
      detail: `Model contains ${model.entities.length} entities.`
    },
    {
      name: "relations-target-known-entities",
      ok: model.relations.every(
        (relation) => entityNames.has(relation.from) && entityNames.has(relation.to)
      ),
      detail: "Every relation endpoint resolves to a known entity."
    },
    {
      name: "states-attach-to-known-entities",
      ok: model.states.every((state) => entityNames.has(state.entity)),
      detail: "Every state attaches to a known entity."
    },
    {
      name: "actions-reference-known-state-chain",
      ok: model.actions.every((action) => {
        if (!entityNames.has(action.entity)) {
          return false;
        }

        return (
          findState(model.states, action.entity, action.from) !== undefined &&
          findState(model.states, action.entity, action.to) !== undefined
        );
      }),
      detail: "Every action references valid from/to states on a known entity."
    },
    {
      name: "views-reference-known-entities-and-fields",
      ok: model.views.every((view) => {
        const entity = model.entities.find((candidate) => candidate.name === view.entity);
        if (!entity) {
          return false;
        }

        const fieldNames = new Set(entity.attributes.map((attribute) => attribute.name));
        return view.columns.every((column) => fieldNames.has(column));
      }),
      detail: "Every view references a known entity and valid columns."
    },
    {
      name: "policies-reference-known-entities",
      ok: model.policies.every((policy) => entityNames.has(policy.appliesTo)),
      detail: "Every policy attaches to a known entity."
    },
    ...model.invariants.map((invariant) => checkInvariant(model, invariant))
  ];

  return {
    ok: checks.every((check) => check.ok),
    checks
  };
}
