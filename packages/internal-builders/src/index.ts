import type {
  SemanticAction,
  SemanticEntity,
  SemanticPolicy,
  SemanticView,
  SemanticWorldModel
} from "@ralph/semantic-kernel";

export interface StorageBlueprint {
  entity: string;
  fields: string[];
}

export interface WorkflowBlueprint {
  entity: string;
  states: string[];
  transitions: string[];
}

export interface PolicyBlueprint {
  name: string;
  summary: string;
}

export interface ViewBlueprint {
  name: string;
  kind: string;
  entity: string;
}

export interface ApplicationBlueprint {
  modelName: string;
  domain: string;
  storage: StorageBlueprint[];
  workflows: WorkflowBlueprint[];
  policies: PolicyBlueprint[];
  views: ViewBlueprint[];
  effects: string[];
  summary: string;
}

function summarizeEntity(entity: SemanticEntity): StorageBlueprint {
  return {
    entity: entity.name,
    fields: entity.attributes.map((attribute) => `${attribute.name}:${attribute.type}`)
  };
}

function summarizeWorkflow(
  entityName: string,
  actions: SemanticAction[],
  states: string[]
): WorkflowBlueprint {
  return {
    entity: entityName,
    states,
    transitions: actions.map((action) => `${action.name} (${action.from} -> ${action.to})`)
  };
}

function summarizePolicy(policy: SemanticPolicy): PolicyBlueprint {
  const ruleSummary = policy.rules
    .map((rule) => `${rule.field} ${rule.operator} ${String(rule.value)}`)
    .join(", ");

  return {
    name: policy.name,
    summary: `${policy.effect} on ${policy.appliesTo} via ${policy.actors.join(", ")} when ${ruleSummary}`
  };
}

function summarizeView(view: SemanticView): ViewBlueprint {
  return {
    name: view.name,
    kind: view.kind,
    entity: view.entity
  };
}

/**
 * Internal builders are where semantic meaning becomes runnable substrate.
 * The first real builder output is intentionally modest: an application
 * blueprint that shows what the platform understands about storage,
 * workflows, policies, views, and side effects for a given model.
 */
export function buildApplicationBlueprint(model: SemanticWorldModel): ApplicationBlueprint {
  const storage = model.entities.map(summarizeEntity);

  const workflows = model.entities
    .map((entity) => {
      const states = model.states
        .filter((state) => state.entity === entity.name)
        .map((state) => state.name);
      const actions = model.actions.filter((action) => action.entity === entity.name);

      if (states.length === 0 && actions.length === 0) {
        return null;
      }

      return summarizeWorkflow(entity.name, actions, states);
    })
    .filter((workflow): workflow is WorkflowBlueprint => workflow !== null);

  const policies = model.policies.map(summarizePolicy);
  const views = model.views.map(summarizeView);
  const effects = model.effects.map((effect) => `${effect.name} (${effect.kind})`);

  return {
    modelName: model.name,
    domain: model.domain,
    storage,
    workflows,
    policies,
    views,
    effects,
    summary:
      `${model.name} materializes ${storage.length} storage entities, ` +
      `${workflows.length} workflows, ${policies.length} policies, and ${views.length} views.`
  };
}

export function formatBlueprint(blueprint: ApplicationBlueprint): string {
  const storage = blueprint.storage
    .map((entry) => `  - ${entry.entity}: ${entry.fields.join(", ")}`)
    .join("\n");
  const workflows = blueprint.workflows
    .map((workflow) => `  - ${workflow.entity}: ${workflow.transitions.join("; ")}`)
    .join("\n");
  const policies = blueprint.policies
    .map((policy) => `  - ${policy.name}: ${policy.summary}`)
    .join("\n");
  const views = blueprint.views
    .map((view) => `  - ${view.name}: ${view.kind} on ${view.entity}`)
    .join("\n");

  return [
    `Blueprint for ${blueprint.modelName}`,
    `Domain: ${blueprint.domain}`,
    blueprint.summary,
    "Storage:",
    storage || "  - none",
    "Workflows:",
    workflows || "  - none",
    "Policies:",
    policies || "  - none",
    "Views:",
    views || "  - none"
  ].join("\n");
}
