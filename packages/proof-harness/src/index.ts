import type {
  SemanticAction,
  SemanticInvariant,
  SemanticPolicy,
  SemanticState,
  SemanticWorldModel as KernelWorldModel,
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

function buildReachableStateSet(
  initialStates: string[],
  actions: SemanticAction[]
): Set<string> {
  const reachable = new Set(initialStates);
  let changed = true;

  while (changed) {
    changed = false;

    for (const action of actions) {
      if (reachable.has(action.from) && !reachable.has(action.to)) {
        reachable.add(action.to);
        changed = true;
      }
    }
  }

  return reachable;
}

function buildWorkflowReplayChecks(model: KernelWorldModel): ProofCheck[] {
  return model.entities.flatMap((entity) => {
    const entityStates = model.states.filter((state) => state.entity === entity.name);
    const entityActions = model.actions.filter((action) => action.entity === entity.name);

    if (entityStates.length === 0 || entityActions.length === 0) {
      return [];
    }

    const initialStates = entityStates.filter((state) => state.initial).map((state) => state.name);
    const terminalStates = entityStates
      .filter((state) => state.terminal)
      .map((state) => state.name);

    if (initialStates.length === 0) {
      return [
        {
          name: `workflow-replay:${entity.name}`,
          ok: false,
          detail: `Workflow ${entity.name} has transitions but no initial state.`
        }
      ];
    }

    const reachable = buildReachableStateSet(initialStates, entityActions);
    const unreachableTransitions = entityActions
      .filter((action) => !reachable.has(action.from))
      .map((action) => action.name);
    const reachableTerminals = terminalStates.filter((state) => reachable.has(state));
    const ok =
      unreachableTransitions.length === 0 &&
      (terminalStates.length === 0 || reachableTerminals.length > 0);
    const detail = ok
      ? `Workflow ${entity.name} replays from ${initialStates.join(", ")} to ${reachableTerminals.join(", ") || "reachable states"} cleanly.`
      : `Workflow ${entity.name} cannot replay cleanly. Unreachable transitions: ${unreachableTransitions.join(", ") || "none"}. Reachable terminal states: ${reachableTerminals.join(", ") || "none"}.`;

    return [
      {
        name: `workflow-replay:${entity.name}`,
        ok,
        detail
      }
    ];
  });
}

function buildMutationCandidate(
  model: KernelWorldModel,
  invariant: SemanticInvariant
): KernelWorldModel | undefined {
  if (invariant.kind === "action-state-chain") {
    const targetAction = model.actions.find((action) => action.name === invariant.action);

    if (!targetAction) {
      return undefined;
    }

    return {
      ...model,
      actions: model.actions.map((action) =>
        action.name === invariant.action
          ? {
              ...action,
              to: invariant.requiredFrom
            }
          : action
      )
    };
  }

  const targetPolicy = model.policies.find((policy) => policy.name === invariant.policy);

  if (!targetPolicy) {
    return undefined;
  }

  return {
    ...model,
    policies: model.policies.map((policy) =>
      policy.name === invariant.policy
        ? {
            ...policy,
            actors: policy.actors.filter((actor) => actor !== invariant.requiredActor),
            rules: policy.rules.filter(
              (rule) =>
                !(
                  rule.field === invariant.field &&
                  rule.operator === invariant.operator &&
                  rule.value === invariant.value
                )
            )
          }
        : policy
    )
  };
}

function buildMutationResistanceChecks(model: KernelWorldModel): ProofCheck[] {
  return model.invariants.map((invariant) => {
    const mutatedModel = buildMutationCandidate(model, invariant);

    if (!mutatedModel) {
      return {
        name: `mutation-resistance:${invariant.name}`,
        ok: false,
        detail: `Unable to synthesize a mutation candidate for invariant ${invariant.name}.`
      };
    }

    const mutatedResult = checkInvariant(mutatedModel, invariant);
    const ok = !mutatedResult.ok;

    return {
      name: `mutation-resistance:${invariant.name}`,
      ok,
      detail: ok
        ? `Invariant ${invariant.name} fails on the intentionally mutated model as expected.`
        : `Invariant ${invariant.name} still passed on the intentionally mutated model.`
    };
  });
}

/**
 * The proof harness is the contract that prevents the repo from drifting
 * into demo-only generation. This first implementation proves that a model
 * is structurally coherent, that core workflows replay from initial states,
 * and that benchmark-specific invariants resist targeted mutations.
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
    ...buildWorkflowReplayChecks(model),
    ...model.invariants.map((invariant) => checkInvariant(model, invariant)),
    ...buildMutationResistanceChecks(model)
  ];

  return {
    ok: checks.every((check) => check.ok),
    checks
  };
}
