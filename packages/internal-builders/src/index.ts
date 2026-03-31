import type {
  SemanticAction,
  SemanticAttribute,
  SemanticEntity,
  SemanticPolicyRule,
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

export interface RuntimeSchemaField {
  name: string;
  type: string;
  required: boolean;
}

export interface RuntimeSchemaRelation {
  name: string;
  targetEntity: string;
  cardinality: string;
}

export interface RuntimeSchemaEntity {
  name: string;
  description: string;
  fields: RuntimeSchemaField[];
  relations: RuntimeSchemaRelation[];
}

export interface RuntimeWorkflowTransition {
  name: string;
  from: string;
  to: string;
  actors: string[];
}

export interface RuntimeWorkflowMachine {
  entity: string;
  initialStates: string[];
  terminalStates: string[];
  transitions: RuntimeWorkflowTransition[];
}

export interface RuntimePolicySpec {
  name: string;
  appliesTo: string;
  effect: string;
  actors: string[];
  rules: SemanticPolicyRule[];
  description?: string;
}

export interface RuntimeViewSpec {
  name: string;
  entity: string;
  kind: string;
  columns: string[];
  description?: string;
}

export interface ExecutableArtifactFile {
  path: string;
  content: string;
}

export interface RuntimeManifest {
  kind: "ralph-runtime-package";
  modelName: string;
  domain: string;
  entrypoint: string;
  schemaFile: string;
  workflowFile: string;
  policyFile: string;
  viewFile: string;
  proofExpected: "required-before-promotion";
}

export interface ExecutableSubstrateArtifact {
  modelName: string;
  domain: string;
  entrypoint: string;
  blueprint: ApplicationBlueprint;
  schema: RuntimeSchemaEntity[];
  workflows: RuntimeWorkflowMachine[];
  policies: RuntimePolicySpec[];
  views: RuntimeViewSpec[];
  manifest: RuntimeManifest;
  files: ExecutableArtifactFile[];
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

function summarizeRuntimeField(attribute: SemanticAttribute): RuntimeSchemaField {
  return {
    name: attribute.name,
    type: attribute.type,
    required: attribute.required
  };
}

function buildRuntimeSchema(model: SemanticWorldModel): RuntimeSchemaEntity[] {
  return model.entities.map((entity) => ({
    name: entity.name,
    description: entity.description,
    fields: entity.attributes.map(summarizeRuntimeField),
    relations: model.relations
      .filter((relation) => relation.from === entity.name)
      .map((relation) => ({
        name: relation.name,
        targetEntity: relation.to,
        cardinality: relation.cardinality
      }))
  }));
}

function buildRuntimeWorkflows(model: SemanticWorldModel): RuntimeWorkflowMachine[] {
  return model.entities
    .map((entity) => {
      const entityStates = model.states.filter((state) => state.entity === entity.name);
      const entityActions = model.actions.filter((action) => action.entity === entity.name);

      if (entityStates.length === 0 && entityActions.length === 0) {
        return null;
      }

      return {
        entity: entity.name,
        initialStates: entityStates.filter((state) => state.initial).map((state) => state.name),
        terminalStates: entityStates.filter((state) => state.terminal).map((state) => state.name),
        transitions: entityActions.map((action) => ({
          name: action.name,
          from: action.from,
          to: action.to,
          actors: [...action.actors]
        }))
      };
    })
    .filter((workflow): workflow is RuntimeWorkflowMachine => workflow !== null);
}

function buildRuntimePolicies(model: SemanticWorldModel): RuntimePolicySpec[] {
  return model.policies.map((policy) => ({
    name: policy.name,
    appliesTo: policy.appliesTo,
    effect: policy.effect,
    actors: [...policy.actors],
    rules: policy.rules.map((rule) => ({ ...rule })),
    ...(policy.description ? { description: policy.description } : {})
  }));
}

function buildRuntimeViews(model: SemanticWorldModel): RuntimeViewSpec[] {
  return model.views.map((view) => ({
    name: view.name,
    entity: view.entity,
    kind: view.kind,
    columns: [...view.columns],
    ...(view.description ? { description: view.description } : {})
  }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtmlList(items: string[]): string {
  if (items.length === 0) {
    return "<li>none</li>";
  }

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderRuntimeIndexHtml(
  model: SemanticWorldModel,
  blueprint: ApplicationBlueprint,
  schema: RuntimeSchemaEntity[],
  workflows: RuntimeWorkflowMachine[],
  views: RuntimeViewSpec[],
  policies: RuntimePolicySpec[],
  manifest: RuntimeManifest
): string {
  const viewCards = views
    .map(
      (view) => `
        <article class="card">
          <h3>${escapeHtml(view.name)}</h3>
          <p>${escapeHtml(view.kind)} on ${escapeHtml(view.entity)}</p>
          <ul>${buildHtmlList(view.columns)}</ul>
        </article>`
    )
    .join("");

  const workflowCards = workflows
    .map(
      (workflow) => `
        <article class="card">
          <h3>${escapeHtml(workflow.entity)}</h3>
          <p>initial: ${escapeHtml(workflow.initialStates.join(", ") || "none")}</p>
          <p>terminal: ${escapeHtml(workflow.terminalStates.join(", ") || "none")}</p>
          <ul>${buildHtmlList(
            workflow.transitions.map(
              (transition) =>
                `${transition.name}: ${transition.from} -> ${transition.to} [${transition.actors.join(", ")}]`
            )
          )}</ul>
        </article>`
    )
    .join("");

  const schemaCards = schema
    .map(
      (entity) => `
        <article class="card">
          <h3>${escapeHtml(entity.name)}</h3>
          <p>${escapeHtml(entity.description)}</p>
          <ul>${buildHtmlList(
            entity.fields.map(
              (field) => `${field.name}:${field.type}${field.required ? " required" : ""}`
            )
          )}</ul>
        </article>`
    )
    .join("");

  const policyCards = policies
    .map(
      (policy) => `
        <article class="card">
          <h3>${escapeHtml(policy.name)}</h3>
          <p>${escapeHtml(policy.effect)} on ${escapeHtml(policy.appliesTo)}</p>
          <ul>${buildHtmlList(
            policy.rules.map((rule) => `${rule.field} ${rule.operator} ${String(rule.value)}`)
          )}</ul>
        </article>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(model.name)} Runtime Package</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --surface: rgba(255, 252, 248, 0.9);
        --ink: #1f1b16;
        --muted: #6a6055;
        --line: rgba(31, 27, 22, 0.12);
        --accent: #bf5a2a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(191, 90, 42, 0.12), transparent 32%),
          linear-gradient(180deg, #f8f3ea 0%, var(--bg) 100%);
      }
      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 20px 72px;
      }
      header {
        margin-bottom: 32px;
      }
      h1, h2, h3 { margin: 0 0 10px; line-height: 1.05; }
      h1 { font-size: clamp(2.8rem, 6vw, 5rem); letter-spacing: -0.05em; }
      h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--muted); }
      p { color: var(--muted); max-width: 70ch; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin: 18px 0 32px;
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
        background: var(--surface);
        backdrop-filter: blur(12px);
        box-shadow: 0 16px 50px rgba(44, 27, 14, 0.07);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin: 18px 0 28px;
      }
      .stat {
        padding: 16px;
        border-radius: 16px;
        background: rgba(255,255,255,0.72);
        border: 1px solid var(--line);
      }
      .stat strong {
        display: block;
        font-size: 1.7rem;
      }
      code, pre {
        font-family: "SFMono-Regular", "Menlo", monospace;
      }
      pre {
        overflow: auto;
        padding: 16px;
        border-radius: 16px;
        background: #1f1b16;
        color: #f8f3ea;
      }
      ul {
        margin: 10px 0 0;
        padding-left: 20px;
      }
      @media (max-width: 720px) {
        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h2>Ralph Runtime Package</h2>
        <h1>${escapeHtml(model.name)}</h1>
        <p>${escapeHtml(blueprint.summary)}</p>
      </header>

      <section class="stats">
        <div class="stat"><strong>${schema.length}</strong>entities</div>
        <div class="stat"><strong>${workflows.length}</strong>workflows</div>
        <div class="stat"><strong>${policies.length}</strong>policies</div>
        <div class="stat"><strong>${views.length}</strong>views</div>
      </section>

      <h2>Views</h2>
      <section class="grid">${viewCards}</section>

      <h2>Workflows</h2>
      <section class="grid">${workflowCards}</section>

      <h2>Schema</h2>
      <section class="grid">${schemaCards}</section>

      <h2>Policies</h2>
      <section class="grid">${policyCards}</section>

      <h2>Manifest</h2>
      <pre>${escapeHtml(JSON.stringify(manifest, null, 2))}</pre>
    </main>
  </body>
</html>`;
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

/**
 * The first executable substrate artifact is a deterministic static package:
 * JSON runtime plans plus an HTML entrypoint that can be opened directly.
 * It is intentionally simple, but it is a runnable package boundary instead
 * of a prose-only blueprint.
 */
export function buildExecutableSubstrateArtifact(
  model: SemanticWorldModel
): ExecutableSubstrateArtifact {
  const blueprint = buildApplicationBlueprint(model);
  const schema = buildRuntimeSchema(model);
  const workflows = buildRuntimeWorkflows(model);
  const policies = buildRuntimePolicies(model);
  const views = buildRuntimeViews(model);
  const manifest: RuntimeManifest = {
    kind: "ralph-runtime-package",
    modelName: model.name,
    domain: model.domain,
    entrypoint: "index.html",
    schemaFile: "schema.json",
    workflowFile: "workflows.json",
    policyFile: "policies.json",
    viewFile: "views.json",
    proofExpected: "required-before-promotion"
  };
  const files: ExecutableArtifactFile[] = [
    {
      path: "runtime-manifest.json",
      content: `${JSON.stringify(manifest, null, 2)}\n`
    },
    {
      path: "schema.json",
      content: `${JSON.stringify(schema, null, 2)}\n`
    },
    {
      path: "workflows.json",
      content: `${JSON.stringify(workflows, null, 2)}\n`
    },
    {
      path: "policies.json",
      content: `${JSON.stringify(policies, null, 2)}\n`
    },
    {
      path: "views.json",
      content: `${JSON.stringify(views, null, 2)}\n`
    },
    {
      path: "index.html",
      content: renderRuntimeIndexHtml(model, blueprint, schema, workflows, views, policies, manifest)
    }
  ];

  return {
    modelName: model.name,
    domain: model.domain,
    entrypoint: manifest.entrypoint,
    blueprint,
    schema,
    workflows,
    policies,
    views,
    manifest,
    files,
    summary:
      `${model.name} emits a static runtime package with ${files.length} files ` +
      `and entrypoint ${manifest.entrypoint}.`
  };
}

export function formatExecutableSubstrateArtifact(
  artifact: ExecutableSubstrateArtifact
): string {
  return [
    `Executable Artifact for ${artifact.modelName}`,
    `Domain: ${artifact.domain}`,
    artifact.summary,
    "Files:",
    ...artifact.files.map((file) => `  - ${file.path}`)
  ].join("\n");
}
