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
  seedFile: string;
  scriptFile: string;
  editExportFile: string;
  storageKey: string;
  capabilities: string[];
  proofExpected: "required-before-promotion";
}

export interface RuntimeSeedRecord {
  id: string;
  state?: string;
  values: Record<string, unknown>;
  links: Record<string, string[]>;
}

export interface RuntimeSeedCollection {
  entity: string;
  records: RuntimeSeedRecord[];
}

export interface RuntimeSeedData {
  modelName: string;
  storageKey: string;
  collections: RuntimeSeedCollection[];
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
  seedData: RuntimeSeedData;
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

function storageKeyForModel(model: SemanticWorldModel): string {
  return `ralph-runtime:${model.name}`;
}

function findWorkflowForEntity(
  workflows: RuntimeWorkflowMachine[],
  entityName: string
): RuntimeWorkflowMachine | undefined {
  return workflows.find((workflow) => workflow.entity === entityName);
}

function sampleStringValue(
  entityName: string,
  attributeName: string,
  recordIndex: number,
  stateName: string | undefined
): string {
  const prefix = entityName.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "REC";
  const normalized = attributeName.toLowerCase();

  if (normalized === "status" && stateName) {
    return stateName;
  }

  if (normalized.includes("name")) {
    return `${entityName} ${recordIndex + 1}`;
  }

  if (normalized.includes("title")) {
    return `${entityName} ${recordIndex + 1}`;
  }

  if (normalized.includes("slug")) {
    return `${entityName}-${recordIndex + 1}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }

  if (normalized.includes("identifier") || normalized.includes("number")) {
    return `${prefix}-${String(1000 + recordIndex).padStart(4, "0")}`;
  }

  if (normalized.includes("currency")) {
    return "USD";
  }

  if (normalized.includes("priority")) {
    return recordIndex === 0 ? "medium" : "high";
  }

  if (normalized.includes("role")) {
    return recordIndex === 0 ? "operator" : "reviewer";
  }

  if (normalized.includes("decision")) {
    return recordIndex === 0 ? "pending" : "approved";
  }

  if (normalized.includes("kind")) {
    return recordIndex === 0 ? "highlight" : "callout";
  }

  if (normalized.includes("risk")) {
    return recordIndex === 0 ? "standard" : "elevated";
  }

  return `${entityName.toLowerCase()}-${attributeName.toLowerCase()}-${recordIndex + 1}`;
}

function sampleValueForAttribute(
  entityName: string,
  attribute: RuntimeSchemaField,
  recordIndex: number,
  stateName: string | undefined
): unknown {
  switch (attribute.type) {
    case "number":
      return attribute.name.toLowerCase().includes("amount") ? 2500 * (recordIndex + 1) : 10 * (recordIndex + 1);
    case "boolean":
      return recordIndex % 2 === 0;
    case "date":
      return `2026-04-${String(recordIndex + 1).padStart(2, "0")}`;
    case "datetime":
      return `2026-04-${String(recordIndex + 1).padStart(2, "0")}T09:00:00.000Z`;
    case "json":
      return {
        note: `${entityName} payload ${recordIndex + 1}`,
        marker: recordIndex + 1
      };
    default:
      return sampleStringValue(entityName, attribute.name, recordIndex, stateName);
  }
}

function buildSeedRecordsForEntity(
  entity: RuntimeSchemaEntity,
  workflow: RuntimeWorkflowMachine | undefined
): RuntimeSeedRecord[] {
  const states: string[] = [];

  if (workflow && workflow.initialStates.length > 0) {
    const initialState = workflow.initialStates[0];

    if (initialState) {
      states.push(initialState);
    }

    const firstTransition = workflow.transitions.find(
      (transition) => transition.from === initialState
    );

    if (firstTransition) {
      states.push(firstTransition.to);
    }
  }

  const recordCount = Math.max(1, states.length || 0);

  return Array.from({ length: recordCount }, (_, recordIndex) => {
    const stateName = states[recordIndex];
    const values = Object.fromEntries(
      entity.fields.map((field) => [
        field.name,
        sampleValueForAttribute(entity.name, field, recordIndex, stateName)
      ])
    );

    if (stateName && !Object.prototype.hasOwnProperty.call(values, "status")) {
      values.status = stateName;
    }

    return {
      id: `${entity.name.toLowerCase()}-${recordIndex + 1}`,
      ...(stateName ? { state: stateName } : {}),
      values,
      links: {}
    };
  });
}

function buildRelationSeedLinks(
  relation: RuntimeSchemaRelation,
  targetRecords: RuntimeSeedRecord[],
  sourceIndex: number
): string[] {
  if (targetRecords.length === 0) {
    return [];
  }

  const primary = targetRecords[sourceIndex % targetRecords.length]?.id;

  if (!primary) {
    return [];
  }

  if (relation.cardinality === "many-to-many" && targetRecords.length > 1) {
    const secondary = targetRecords[(sourceIndex + 1) % targetRecords.length]?.id;
    return secondary && secondary !== primary ? [primary, secondary] : [primary];
  }

  return [primary];
}

function buildRuntimeSeedData(
  model: SemanticWorldModel,
  schema: RuntimeSchemaEntity[],
  workflows: RuntimeWorkflowMachine[]
): RuntimeSeedData {
  const collections = schema.map((entity) => ({
    entity: entity.name,
    records: buildSeedRecordsForEntity(entity, findWorkflowForEntity(workflows, entity.name))
  }));

  for (const collection of collections) {
    const entitySchema = schema.find((entity) => entity.name === collection.entity);

    if (!entitySchema) {
      continue;
    }

    collection.records.forEach((record, recordIndex) => {
      record.links = Object.fromEntries(
        entitySchema.relations.map((relation) => {
          const targetCollection = collections.find(
            (candidate) => candidate.entity === relation.targetEntity
          );
          return [
            relation.name,
            buildRelationSeedLinks(relation, targetCollection?.records ?? [], recordIndex)
          ];
        })
      );
    });
  }

  return {
    modelName: model.name,
    storageKey: storageKeyForModel(model),
    collections
  };
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
          <p class="muted">relations</p>
          <ul>${buildHtmlList(
            entity.relations.map(
              (relation) => `${relation.name} -> ${relation.targetEntity} (${relation.cardinality})`
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
      .toolbar {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      .button {
        appearance: none;
        border: 1px solid rgba(191, 90, 42, 0.22);
        border-radius: 999px;
        background: rgba(191, 90, 42, 0.12);
        color: var(--ink);
        padding: 10px 16px;
        font: inherit;
        cursor: pointer;
      }
      .button:hover {
        background: rgba(191, 90, 42, 0.2);
      }
      .runtime-shell {
        display: grid;
        gap: 18px;
      }
      .record-table {
        width: 100%;
        border-collapse: collapse;
      }
      .record-table td {
        padding: 8px 0;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      .record-table td:first-child {
        width: 34%;
        color: var(--muted);
      }
      .input-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .field {
        display: grid;
        gap: 6px;
      }
      .field span {
        font-size: 0.9rem;
        color: var(--muted);
      }
      .field input,
      .field textarea,
      .field select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.82);
        color: var(--ink);
        font: inherit;
      }
      .field textarea {
        min-height: 96px;
        resize: vertical;
      }
      .action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }
      .action-button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        padding: 8px 12px;
        font: inherit;
        cursor: pointer;
      }
      .action-button.secondary {
        background: rgba(31, 27, 22, 0.12);
        color: var(--ink);
      }
      .muted {
        color: var(--muted);
      }
      .runtime-card {
        min-height: 100%;
      }
      .stack {
        display: grid;
        gap: 12px;
      }
      .relation-block {
        border-top: 1px solid var(--line);
        padding-top: 12px;
        margin-top: 12px;
      }
      .relation-block ul {
        margin-top: 6px;
      }
      .runtime-card header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 4px 10px;
        background: rgba(31, 27, 22, 0.08);
        font-size: 0.9rem;
      }
      .section-stack {
        display: grid;
        gap: 18px;
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

      <div class="toolbar">
        <p>Local browser runtime backed by deterministic seed data and workflow actions.</p>
        <div class="action-row">
          <button class="button" data-runtime-export type="button">Export Runtime Edits</button>
          <button class="button" data-runtime-reset type="button">Reset Local Runtime</button>
        </div>
      </div>

      <section class="stats">
        <div class="stat"><strong>${schema.length}</strong>entities</div>
        <div class="stat"><strong>${workflows.length}</strong>workflows</div>
        <div class="stat"><strong>${policies.length}</strong>policies</div>
        <div class="stat"><strong>${views.length}</strong>views</div>
      </section>

      <section class="runtime-shell" data-runtime-root></section>

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
    <script type="module" src="runtime.js"></script>
  </body>
</html>`;
}

function renderRuntimeScript(
  artifact: Pick<
    ExecutableSubstrateArtifact,
    "modelName" | "schema" | "workflows" | "views" | "policies" | "manifest" | "seedData"
  >
): string {
  const boot = {
    modelName: artifact.modelName,
    schema: artifact.schema,
    workflows: artifact.workflows,
    views: artifact.views,
    policies: artifact.policies,
    manifest: artifact.manifest,
    seedData: artifact.seedData
  };

  return `const boot = ${JSON.stringify(boot, null, 2)};

const root = document.querySelector("[data-runtime-root]");
const resetButton = document.querySelector("[data-runtime-reset]");
const exportButton = document.querySelector("[data-runtime-export]");
const storageKey = boot.manifest.storageKey;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function defaultCollections() {
  return clone(boot.seedData.collections);
}

function normalizeRecord(record) {
  return {
    id: String(record.id || "record"),
    ...(record.state ? { state: String(record.state) } : {}),
    values: record && typeof record.values === "object" && record.values !== null ? record.values : {},
    links: Object.fromEntries(
      Object.entries(record && typeof record.links === "object" && record.links !== null ? record.links : {})
        .map(([name, value]) => [
          name,
          Array.isArray(value) ? value.map((item) => String(item)) : []
        ])
    )
  };
}

function normalizeState(raw) {
  const fallbackCollections = defaultCollections();
  const rawCollections = Array.isArray(raw && raw.collections) ? raw.collections : fallbackCollections;
  const collections = fallbackCollections.map((seedCollection) => {
    const existing = rawCollections.find((candidate) => candidate.entity === seedCollection.entity);
    const records = Array.isArray(existing && existing.records)
      ? existing.records.map(normalizeRecord)
      : clone(seedCollection.records);

    return {
      entity: seedCollection.entity,
      records
    };
  });

  return {
    collections,
    events: Array.isArray(raw && raw.events) ? raw.events : []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      return normalizeState(JSON.parse(raw));
    }
  } catch {
    // Ignore corrupted local runtime state and fall back to deterministic seed data.
  }

  return normalizeState({
    collections: defaultCollections(),
    events: []
  });
}

function saveState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getCollection(state, entity) {
  return state.collections.find((collection) => collection.entity === entity);
}

function getWorkflow(entity) {
  return boot.workflows.find((workflow) => workflow.entity === entity);
}

function getSchema(entity) {
  return boot.schema.find((schema) => schema.name === entity);
}

function getRecord(state, entity, recordId) {
  const collection = getCollection(state, entity);
  return collection && collection.records.find((candidate) => candidate.id === recordId);
}

function availableTransitions(entity, record) {
  const workflow = getWorkflow(entity);
  if (!workflow) {
    return [];
  }

  const currentState = record.state || record.values.status;
  return workflow.transitions.filter((transition) => transition.from === currentState);
}

function editableFields(entity) {
  const schema = getSchema(entity);
  const workflow = getWorkflow(entity);

  return schema
    ? schema.fields.filter((field) => !(workflow && field.name === "status"))
    : [];
}

function renderValue(value) {
  if (value === null || value === undefined) {
    return '<span class="muted">unset</span>';
  }

  if (typeof value === "object") {
    return "<code>" + escapeHtml(JSON.stringify(value)) + "</code>";
  }

  return escapeHtml(String(value));
}

function describeRecord(record) {
  const values = record && record.values ? record.values : {};
  return values.title || values.name || values.slug || record.id;
}

function renderFieldInput(entity, field, value, formKind, recordId) {
  const inputName = escapeHtml(field.name);
  const fieldLabel = "<span>" + inputName + "</span>";
  const valueString =
    field.type === "json"
      ? JSON.stringify(value === undefined ? {} : value, null, 2)
      : value === undefined || value === null
        ? ""
        : String(value);
  const commonAttrs =
    ' name="' +
    inputName +
    '" data-entity="' +
    escapeHtml(entity) +
    '" data-form-kind="' +
    escapeHtml(formKind) +
    '"' +
    (recordId ? ' data-record-id="' + escapeHtml(recordId) + '"' : "");

  if (field.type === "boolean") {
    return "<label class=\\"field\\">" +
      fieldLabel +
      "<select" + commonAttrs + ">" +
      "<option value=\\"false\\"" + (String(value) === "false" ? " selected" : "") + ">false</option>" +
      "<option value=\\"true\\"" + (String(value) === "true" ? " selected" : "") + ">true</option>" +
      "</select></label>";
  }

  if (field.type === "json") {
    return "<label class=\\"field\\">" +
      fieldLabel +
      "<textarea" + commonAttrs + ">" + escapeHtml(valueString) + "</textarea></label>";
  }

  const type =
    field.type === "number" ? "number" :
    field.type === "date" ? "date" :
    field.type === "datetime" ? "datetime-local" :
    "text";

  const normalizedValue =
    field.type === "datetime" && valueString
      ? valueString.replace(".000Z", "").slice(0, 16)
      : valueString;

  return "<label class=\\"field\\">" +
    fieldLabel +
    "<input type=\\"" + type + "\\"" + commonAttrs + " value=\\"" + escapeHtml(normalizedValue) + "\\" /></label>";
}

function coerceFieldValue(field, rawValue) {
  if (field.type === "number") {
    return rawValue === "" ? 0 : Number(rawValue);
  }

  if (field.type === "boolean") {
    return rawValue === "true";
  }

  if (field.type === "json") {
    if (rawValue.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(rawValue);
    } catch {
      return { raw: rawValue };
    }
  }

  if (field.type === "datetime") {
    return rawValue ? new Date(rawValue).toISOString() : "";
  }

  return rawValue;
}

function valuesFromForm(entity, form, existingValues) {
  const values = existingValues ? clone(existingValues) : {};
  const formData = new FormData(form);

  for (const field of editableFields(entity)) {
    const rawValue = formData.get(field.name);
    values[field.name] = coerceFieldValue(field, typeof rawValue === "string" ? rawValue : "");
  }

  return values;
}

function nextRecordId(entity, collection) {
  const prefix = entity.toLowerCase();
  let index = collection.records.length + 1;

  while (collection.records.some((record) => record.id === prefix + "-" + String(index))) {
    index += 1;
  }

  return prefix + "-" + String(index);
}

function pushEvent(state, event) {
  state.events.push({
    at: new Date().toISOString(),
    ...event
  });
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2) + "\\n"], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function runtimeEditExportFilename() {
  return boot.manifest.editExportFile || (boot.modelName + "-runtime-edit-log.json");
}

function buildRuntimeEditExport(state) {
  const events = state.events.filter((eventItem) =>
    ["create", "update", "link", "transition"].includes(eventItem.type)
  );

  return {
    kind: "ralph-runtime-edit-export",
    modelName: boot.modelName,
    domain: boot.manifest.domain,
    storageKey,
    exportedAt: new Date().toISOString(),
    eventCount: events.length,
    events
  };
}

function createRecord(entity, form) {
  const state = loadState();
  const collection = getCollection(state, entity);
  const schema = getSchema(entity);
  const workflow = getWorkflow(entity);

  if (!collection || !schema) {
    return;
  }

  const initialState = workflow && workflow.initialStates.length > 0 ? workflow.initialStates[0] : undefined;
  const values = valuesFromForm(entity, form, {});

  if (initialState && !Object.prototype.hasOwnProperty.call(values, "status")) {
    values.status = initialState;
  }

  const record = {
    id: nextRecordId(entity, collection),
    ...(initialState ? { state: initialState } : {}),
    values,
    links: Object.fromEntries(schema.relations.map((relation) => [relation.name, []]))
  };

  collection.records.push(record);
  pushEvent(state, {
    type: "create",
    entity,
    recordId: record.id,
    fieldNames: Object.keys(values).sort(),
    action: "create-record",
    to: record.state || "created"
  });

  saveState(state);
  renderRuntime(state);
}

function updateRecord(entity, recordId, form) {
  const state = loadState();
  const record = getRecord(state, entity, recordId);

  if (!record) {
    return;
  }

  const nextValues = valuesFromForm(entity, form, record.values);
  const fieldNames = Object.keys(nextValues)
    .filter((fieldName) => JSON.stringify(nextValues[fieldName]) !== JSON.stringify(record.values[fieldName]))
    .sort();

  record.values = nextValues;
  pushEvent(state, {
    type: "update",
    entity,
    recordId,
    fieldNames,
    action: "update-record",
    to: record.state || record.values.status || "updated"
  });

  saveState(state);
  renderRuntime(state);
}

function linkRecord(entity, recordId, relationName, targetRecordId) {
  const state = loadState();
  const record = getRecord(state, entity, recordId);
  const schema = getSchema(entity);
  const relation = schema && schema.relations.find((candidate) => candidate.name === relationName);

  if (!record || !relation) {
    return;
  }

  const targetIds = targetRecordId ? [targetRecordId] : [];

  if (relation.cardinality === "one-to-many" || relation.cardinality === "many-to-many") {
    const existing = Array.isArray(record.links[relationName]) ? record.links[relationName] : [];
    record.links[relationName] = targetRecordId
      ? Array.from(new Set([...existing, targetRecordId]))
      : [];
  } else {
    record.links[relationName] = targetIds;
  }

  pushEvent(state, {
    type: "link",
    entity,
    recordId,
    action: relationName,
    relationName,
    targetEntity: relation.targetEntity,
    targetRecordIds: Array.isArray(record.links[relationName]) ? record.links[relationName] : [],
    to: targetRecordId || "cleared"
  });

  saveState(state);
  renderRuntime(state);
}

function applyTransition(entityName, recordId, actionName) {
  const state = loadState();
  const record = getRecord(state, entityName, recordId);

  if (!record) {
    return;
  }

  const fromState = record.state || record.values.status;
  const transition = availableTransitions(entityName, record).find((candidate) => candidate.name === actionName);

  if (!transition) {
    return;
  }

  record.state = transition.to;
  if (Object.prototype.hasOwnProperty.call(record.values, "status")) {
    record.values.status = transition.to;
  }

  pushEvent(state, {
    type: "transition",
    entity: entityName,
    recordId,
    action: transition.name,
    from: fromState,
    to: transition.to
  });

  saveState(state);
  renderRuntime(state);
}

function renderView(view, state) {
  const collection = getCollection(state, view.entity);
  const records = collection ? collection.records : [];
  const header = view.columns.map((column) => "<th>" + escapeHtml(column) + "</th>").join("");
  const rows = records
    .map((record) => "<tr>" + view.columns.map((column) => "<td>" + renderValue(record.values[column]) + "</td>").join("") + "</tr>")
    .join("");

  return "<article class=\\"card runtime-card\\">" +
    "<header><h3>" + escapeHtml(view.name) + "</h3><span class=\\"pill\\">" + escapeHtml(view.kind) + "</span></header>" +
    "<p class=\\"muted\\">" + escapeHtml(view.entity) + "</p>" +
    "<table class=\\"record-table\\"><thead><tr>" + header + "</tr></thead><tbody>" + (rows || "<tr><td colspan=\\"" + String(view.columns.length) + "\\"><span class=\\"muted\\">No records</span></td></tr>") + "</tbody></table>" +
    "</article>";
}

function renderRelationEditor(entity, record, state) {
  const schema = getSchema(entity);

  if (!schema || schema.relations.length === 0) {
    return "";
  }

  return schema.relations
    .map((relation) => {
      const targetCollection = getCollection(state, relation.targetEntity);
      const linkedIds = Array.isArray(record.links[relation.name]) ? record.links[relation.name] : [];
      const currentLinks = linkedIds.length > 0
        ? "<ul>" +
          linkedIds
            .map((linkedId) => {
              const linkedRecord = targetCollection && targetCollection.records.find((candidate) => candidate.id === linkedId);
              return "<li>" + escapeHtml(linkedId) + " · " + escapeHtml(linkedRecord ? describeRecord(linkedRecord) : "missing") + "</li>";
            })
            .join("") +
          "</ul>"
        : "<p class=\\"muted\\">No linked records.</p>";
      const options = (targetCollection ? targetCollection.records : [])
        .map((candidate) => "<option value=\\"" + escapeHtml(candidate.id) + "\\">" + escapeHtml(candidate.id + " · " + describeRecord(candidate)) + "</option>")
        .join("");

      return "<div class=\\"relation-block\\">" +
        "<p><strong>" + escapeHtml(relation.name) + "</strong> → " + escapeHtml(relation.targetEntity) + " (" + escapeHtml(relation.cardinality) + ")</p>" +
        currentLinks +
        "<form class=\\"stack\\" data-link-form data-entity=\\"" + escapeHtml(entity) + "\\" data-record-id=\\"" + escapeHtml(record.id) + "\\" data-relation-name=\\"" + escapeHtml(relation.name) + "\\">" +
        "<div class=\\"input-grid\\"><label class=\\"field\\"><span>target record</span><select name=\\"targetRecordId\\"><option value=\\"\\">clear / none</option>" + options + "</select></label></div>" +
        "<div class=\\"action-row\\"><button class=\\"action-button secondary\\" type=\\"submit\\">Update relation</button></div>" +
        "</form>" +
        "</div>";
    })
    .join("");
}

function renderRecordCard(entity, record, state) {
  const schema = getSchema(entity);
  const transitions = availableTransitions(entity, record);
  const fieldRows = schema.fields
    .map((field) => "<tr><td>" + escapeHtml(field.name) + "</td><td>" + renderValue(record.values[field.name]) + "</td></tr>")
    .join("");
  const actions = transitions.length > 0
    ? transitions
        .map((transition) =>
          "<button class=\\"action-button\\" type=\\"button\\" data-entity=\\"" +
          escapeHtml(entity) +
          "\\" data-record-id=\\"" +
          escapeHtml(record.id) +
          "\\" data-action-name=\\"" +
          escapeHtml(transition.name) +
          "\\">" +
          escapeHtml(transition.name) +
          "</button>"
        )
        .join("")
    : "<span class=\\"muted\\">No available actions</span>";
  const editForm = editableFields(entity)
    .map((field) => renderFieldInput(entity, field, record.values[field.name], "update", record.id))
    .join("");

  return "<article class=\\"card runtime-card\\">" +
    "<header><h3>" + escapeHtml(record.id) + "</h3><span class=\\"pill\\">" + escapeHtml(String(record.state || record.values.status || "stateless")) + "</span></header>" +
    "<table class=\\"record-table\\"><tbody>" + fieldRows + "</tbody></table>" +
    "<div class=\\"action-row\\">" + actions + "</div>" +
    "<div class=\\"stack\\">" +
    "<form class=\\"stack\\" data-update-form data-entity=\\"" + escapeHtml(entity) + "\\" data-record-id=\\"" + escapeHtml(record.id) + "\\">" +
    "<div class=\\"input-grid\\">" + editForm + "</div>" +
    "<div class=\\"action-row\\"><button class=\\"action-button secondary\\" type=\\"submit\\">Save fields</button></div>" +
    "</form>" +
    renderRelationEditor(entity, record, state) +
    "</div>" +
    "</article>";
}

function renderCreateForm(entity) {
  const inputs = editableFields(entity)
    .map((field) => renderFieldInput(entity, field, undefined, "create"))
    .join("");

  return "<article class=\\"card\\">" +
    "<h3>Create " + escapeHtml(entity) + "</h3>" +
    "<form class=\\"stack\\" data-create-form data-entity=\\"" + escapeHtml(entity) + "\\">" +
    "<div class=\\"input-grid\\">" + inputs + "</div>" +
    "<div class=\\"action-row\\"><button class=\\"action-button secondary\\" type=\\"submit\\">Add record</button></div>" +
    "</form>" +
    "</article>";
}

function renderEntitySection(state, collection) {
  return "<section class=\\"section-stack\\">" +
    "<div><h2>" + escapeHtml(collection.entity) + "</h2><p class=\\"muted\\">" + String(collection.records.length) + " record(s) in the local runtime.</p></div>" +
    renderCreateForm(collection.entity) +
    "<div class=\\"grid\\">" + collection.records.map((record) => renderRecordCard(collection.entity, record, state)).join("") + "</div>" +
    "</section>";
}

function formatEvent(eventItem) {
  if (eventItem.type === "transition") {
    return eventItem.at + " · " + eventItem.entity + " · " + eventItem.recordId + " · " + eventItem.action + " → " + eventItem.to;
  }

  if (eventItem.type === "link") {
    return eventItem.at + " · " + eventItem.entity + " · " + eventItem.recordId + " · linked " + eventItem.action + " → " + eventItem.to;
  }

  if (eventItem.type === "create") {
    return eventItem.at + " · " + eventItem.entity + " · " + eventItem.recordId + " · created";
  }

  if (eventItem.type === "update") {
    return eventItem.at + " · " + eventItem.entity + " · " + eventItem.recordId + " · updated";
  }

  return eventItem.at + " · runtime event";
}

function renderEvents(state) {
  const items = state.events.length > 0
    ? state.events
        .slice()
        .reverse()
        .map((eventItem) => "<li>" + escapeHtml(formatEvent(eventItem)) + "</li>")
        .join("")
    : "<li>No runtime events yet.</li>";

  return "<article class=\\"card\\"><h2>Event Log</h2><ul>" + items + "</ul></article>";
}

function renderRuntime(state) {
  if (!root) {
    return;
  }

  const views = boot.views.map((view) => renderView(view, state)).join("");
  const collections = state.collections.map((collection) => renderEntitySection(state, collection)).join("");

  root.innerHTML =
    "<article class=\\"card\\"><h2>Live Views</h2><div class=\\"grid\\">" + views + "</div></article>" +
    "<article class=\\"card\\"><h2>Local Data Workspace</h2><p class=\\"muted\\">State persists in localStorage under " + escapeHtml(storageKey) + " and supports local create, update, relation-link, and workflow actions.</p></article>" +
    collections +
    renderEvents(state);
}

document.addEventListener("click", function(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const actionButton = target.closest("[data-action-name]");
  if (actionButton instanceof HTMLElement) {
    applyTransition(
      actionButton.dataset.entity || "",
      actionButton.dataset.recordId || "",
      actionButton.dataset.actionName || ""
    );
  }
});

document.addEventListener("submit", function(event) {
  const target = event.target;
  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  if (target.matches("[data-create-form]")) {
    event.preventDefault();
    createRecord(target.dataset.entity || "", target);
    return;
  }

  if (target.matches("[data-update-form]")) {
    event.preventDefault();
    updateRecord(target.dataset.entity || "", target.dataset.recordId || "", target);
    return;
  }

  if (target.matches("[data-link-form]")) {
    event.preventDefault();
    const formData = new FormData(target);
    linkRecord(
      target.dataset.entity || "",
      target.dataset.recordId || "",
      target.dataset.relationName || "",
      typeof formData.get("targetRecordId") === "string" ? formData.get("targetRecordId") : ""
    );
  }
});

if (resetButton instanceof HTMLElement) {
  resetButton.addEventListener("click", function() {
    localStorage.removeItem(storageKey);
    renderRuntime(loadState());
  });
}

if (exportButton instanceof HTMLElement) {
  exportButton.addEventListener("click", function() {
    downloadJson(runtimeEditExportFilename(), buildRuntimeEditExport(loadState()));
  });
}

renderRuntime(loadState());
`;
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
  const seedData = buildRuntimeSeedData(model, schema, workflows);
  const manifest: RuntimeManifest = {
    kind: "ralph-runtime-package",
    modelName: model.name,
    domain: model.domain,
    entrypoint: "index.html",
    schemaFile: "schema.json",
    workflowFile: "workflows.json",
    policyFile: "policies.json",
    viewFile: "views.json",
    seedFile: "seed-data.json",
    scriptFile: "runtime.js",
    editExportFile: `${model.name}-runtime-edit-log.json`,
    storageKey: seedData.storageKey,
    capabilities: [
      "local-persistence",
      "workflow-actions",
      "record-create",
      "record-update",
      "relation-linking",
      "event-history",
      "edit-export"
    ],
    proofExpected: "required-before-promotion"
  };
  const artifactContext = {
    modelName: model.name,
    schema,
    workflows,
    views,
    policies,
    manifest,
    seedData
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
      path: "seed-data.json",
      content: `${JSON.stringify(seedData, null, 2)}\n`
    },
    {
      path: "runtime.js",
      content: renderRuntimeScript(artifactContext)
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
    seedData,
    manifest,
    files,
    summary:
      `${model.name} emits an interactive local runtime package with ${files.length} files, ` +
      `entrypoint ${manifest.entrypoint}, and editable local data flows.`
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
