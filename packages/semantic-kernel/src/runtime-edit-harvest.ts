import { semanticProvenanceKey } from "./keys.js";
import type { SemanticPatchDocument, SemanticPatchOperation } from "./patch.js";
import type {
  SemanticCorrectionKind,
  SemanticCorrectionMemory
} from "./correction-memory.js";
import type {
  SemanticAction,
  SemanticRelation,
  SemanticWorldModel
} from "./types.js";

export interface SemanticRuntimeCreateEvent {
  type: "create";
  at: string;
  entity: string;
  recordId: string;
  fieldNames: string[];
  to: string;
}

export interface SemanticRuntimeUpdateEvent {
  type: "update";
  at: string;
  entity: string;
  recordId: string;
  fieldNames: string[];
  to: string;
}

export interface SemanticRuntimeLinkEvent {
  type: "link";
  at: string;
  entity: string;
  recordId: string;
  relationName: string;
  targetEntity: string;
  targetRecordIds: string[];
  to: string;
}

export interface SemanticRuntimeTransitionEvent {
  type: "transition";
  at: string;
  entity: string;
  recordId: string;
  action: string;
  from?: string;
  to: string;
}

export type SemanticRuntimeEditEvent =
  | SemanticRuntimeCreateEvent
  | SemanticRuntimeUpdateEvent
  | SemanticRuntimeLinkEvent
  | SemanticRuntimeTransitionEvent;

export interface SemanticRuntimeEditExport {
  kind: "ralph-runtime-edit-export";
  modelName: string;
  domain: string;
  storageKey: string;
  exportedAt: string;
  eventCount: number;
  events: SemanticRuntimeEditEvent[];
}

export interface SemanticRuntimeEditHarvestInput {
  model: SemanticWorldModel;
  runtimeEditExport: SemanticRuntimeEditExport;
  sourceRef?: string;
}

export interface SemanticRuntimeEditHarvestResult {
  patch: SemanticPatchDocument;
  harvestedCorrections: SemanticCorrectionMemory[];
  summary: string;
}

interface RuntimeHarvestGroup {
  kind: SemanticCorrectionKind;
  eventCount: number;
  entityNames: Set<string>;
  promptKeywords: Set<string>;
  relationNames: Set<string>;
  actionNames: Set<string>;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function splitKeywordValues(values: string[]): string[] {
  return values
    .flatMap((value) => value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^a-z0-9]+/i))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 4);
}

function splitDomainKeywords(domain: string): string[] {
  return domain
    .split(/[^a-z0-9]+/i)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 4);
}

function formatEntityList(entityNames: string[]): string {
  if (entityNames.length === 0) {
    return "the semantic model";
  }

  if (entityNames.length === 1) {
    return entityNames[0] ?? "the semantic model";
  }

  return `${entityNames.slice(0, -1).join(", ")}, and ${entityNames.at(-1)}`;
}

function expectRecord(value: unknown, source: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid runtime edit export in ${source}: expected an object.`);
  }

  return value as Record<string, unknown>;
}

function expectString(value: unknown, source: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid runtime edit export in ${source}: field "${field}" must be a string.`);
  }

  return value;
}

function expectStringArray(value: unknown, source: string, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(
      `Invalid runtime edit export in ${source}: field "${field}" must be a string array.`
    );
  }

  return value;
}

function parseRuntimeEditEvent(
  value: unknown,
  source: string,
  index: number
): SemanticRuntimeEditEvent {
  const event = expectRecord(value, source);
  const type = expectString(event.type, source, `events[${index}].type`);
  const at = expectString(event.at, source, `events[${index}].at`);
  const entity = expectString(event.entity, source, `events[${index}].entity`);
  const recordId = expectString(event.recordId, source, `events[${index}].recordId`);

  if (type === "create" || type === "update") {
    return {
      type,
      at,
      entity,
      recordId,
      fieldNames: expectStringArray(event.fieldNames, source, `events[${index}].fieldNames`),
      to: expectString(event.to, source, `events[${index}].to`)
    };
  }

  if (type === "link") {
    return {
      type,
      at,
      entity,
      recordId,
      relationName: expectString(event.relationName, source, `events[${index}].relationName`),
      targetEntity: expectString(event.targetEntity, source, `events[${index}].targetEntity`),
      targetRecordIds: expectStringArray(
        event.targetRecordIds,
        source,
        `events[${index}].targetRecordIds`
      ),
      to: expectString(event.to, source, `events[${index}].to`)
    };
  }

  if (type === "transition") {
    return {
      type,
      at,
      entity,
      recordId,
      action: expectString(event.action, source, `events[${index}].action`),
      ...(typeof event.from === "string" ? { from: event.from } : {}),
      to: expectString(event.to, source, `events[${index}].to`)
    };
  }

  throw new Error(`Invalid runtime edit export in ${source}: unknown event type "${type}".`);
}

/**
 * Runtime edit exports are the bridge between local prototype usage and the
 * semantic loop. They stay small, typed, and explicit so the CLI can replay
 * them deterministically back into semantic provenance and reusable lessons.
 */
export function parseRuntimeEditExport(
  value: unknown,
  source = "<runtime-edit-export>"
): SemanticRuntimeEditExport {
  const record = expectRecord(value, source);
  const kind = expectString(record.kind, source, "kind");

  if (kind !== "ralph-runtime-edit-export") {
    throw new Error(
      `Invalid runtime edit export in ${source}: expected kind "ralph-runtime-edit-export".`
    );
  }

  const eventsValue = record.events;

  if (!Array.isArray(eventsValue)) {
    throw new Error(`Invalid runtime edit export in ${source}: field "events" must be an array.`);
  }

  const events = eventsValue.map((event, index) => parseRuntimeEditEvent(event, source, index));

  return {
    kind: "ralph-runtime-edit-export",
    modelName: expectString(record.modelName, source, "modelName"),
    domain: expectString(record.domain, source, "domain"),
    storageKey: expectString(record.storageKey, source, "storageKey"),
    exportedAt: expectString(record.exportedAt, source, "exportedAt"),
    eventCount:
      typeof record.eventCount === "number" && Number.isFinite(record.eventCount)
        ? record.eventCount
        : events.length,
    events
  };
}

function ensureKnownEntity(model: SemanticWorldModel, entityName: string, source: string): void {
  if (!model.entities.some((entity) => entity.name === entityName)) {
    throw new Error(`${source}: unknown entity "${entityName}".`);
  }
}

function findKnownRelation(
  model: SemanticWorldModel,
  event: SemanticRuntimeLinkEvent,
  source: string
): SemanticRelation {
  ensureKnownEntity(model, event.entity, source);
  ensureKnownEntity(model, event.targetEntity, source);

  const relation = model.relations.find(
    (candidate) =>
      candidate.from === event.entity &&
      candidate.name === event.relationName &&
      candidate.to === event.targetEntity
  );

  if (!relation) {
    throw new Error(
      `${source}: unknown relation "${event.entity}:${event.relationName}:${event.targetEntity}".`
    );
  }

  return relation;
}

function findKnownAction(
  model: SemanticWorldModel,
  event: SemanticRuntimeTransitionEvent,
  source: string
): SemanticAction {
  ensureKnownEntity(model, event.entity, source);

  const action = model.actions.find(
    (candidate) => candidate.entity === event.entity && candidate.name === event.action
  );

  if (!action) {
    throw new Error(`${source}: unknown action "${event.entity}:${event.action}".`);
  }

  return action;
}

function buildHarvestSummary(
  kind: SemanticCorrectionKind,
  entityNames: string[],
  eventCount: number,
  model: SemanticWorldModel,
  group: RuntimeHarvestGroup
): string {
  const entityText = formatEntityList(entityNames);

  switch (kind) {
    case "relation":
      return `${eventCount} runtime relation event(s) confirmed explicit links around ${entityText} in ${model.domain}${group.relationNames.size > 0 ? ` using ${[...group.relationNames].sort().join(", ")}` : ""}.`;
    case "workflow":
      return `${eventCount} runtime workflow event(s) exercised ${entityText} in ${model.domain}${group.actionNames.size > 0 ? ` through ${[...group.actionNames].sort().join(", ")}` : ""}.`;
    case "runtime":
      return `${eventCount} runtime edit event(s) showed active local editing around ${entityText} in ${model.domain}.`;
    default:
      return `${eventCount} runtime event(s) refined ${entityText} in ${model.domain}.`;
  }
}

function buildHarvestRecommendation(
  kind: SemanticCorrectionKind,
  entityNames: string[]
): string {
  const entityText = formatEntityList(entityNames);

  switch (kind) {
    case "relation":
      return `Keep relation semantics around ${entityText} explicit so local prototype behavior and future generated software continue to agree on the same graph.`;
    case "workflow":
      return `Keep workflow transitions around ${entityText} explicit and provable so accepted runtime behavior becomes durable product logic.`;
    case "runtime":
      return `Keep editable runtime surfaces around ${entityText} first-class so operator-heavy products do not hide core flows outside the semantic substrate.`;
    default:
      return `Capture a durable semantic lesson around ${entityText} so accepted runtime usage feeds the next iteration.`;
  }
}

function ensureGroup(
  groups: Map<SemanticCorrectionKind, RuntimeHarvestGroup>,
  kind: SemanticCorrectionKind
): RuntimeHarvestGroup {
  const existing = groups.get(kind);

  if (existing) {
    return existing;
  }

  const created: RuntimeHarvestGroup = {
    kind,
    eventCount: 0,
    entityNames: new Set<string>(),
    promptKeywords: new Set<string>(),
    relationNames: new Set<string>(),
    actionNames: new Set<string>()
  };

  groups.set(kind, created);
  return created;
}

function collectKeywords(group: RuntimeHarvestGroup, values: string[]): void {
  for (const keyword of splitKeywordValues(values)) {
    group.promptKeywords.add(keyword);
  }
}

function groupRuntimeEditEvents(
  model: SemanticWorldModel,
  runtimeEditExport: SemanticRuntimeEditExport
): RuntimeHarvestGroup[] {
  const groups = new Map<SemanticCorrectionKind, RuntimeHarvestGroup>();

  for (const event of runtimeEditExport.events) {
    if (event.type === "create" || event.type === "update") {
      ensureKnownEntity(model, event.entity, "runtime edit export");
      const group = ensureGroup(groups, "runtime");
      group.eventCount += 1;
      group.entityNames.add(event.entity);
      collectKeywords(group, [event.entity, ...event.fieldNames]);
      continue;
    }

    if (event.type === "link") {
      const relation = findKnownRelation(model, event, "runtime edit export");
      const group = ensureGroup(groups, "relation");
      group.eventCount += 1;
      group.entityNames.add(relation.from);
      group.entityNames.add(relation.to);
      group.relationNames.add(relation.name);
      collectKeywords(group, [relation.from, relation.to, relation.name, event.to]);
      continue;
    }

    const action = findKnownAction(model, event, "runtime edit export");
    const group = ensureGroup(groups, "workflow");
    group.eventCount += 1;
    group.entityNames.add(action.entity);
    group.actionNames.add(action.name);
    collectKeywords(group, [action.entity, action.name, action.from, action.to]);
  }

  return [...groups.values()].sort((left, right) => left.kind.localeCompare(right.kind));
}

function buildRuntimeHarvestPatchOperations(
  model: SemanticWorldModel,
  runtimeEditExport: SemanticRuntimeEditExport,
  groups: RuntimeHarvestGroup[],
  sourceRefBase: string
): { operations: SemanticPatchOperation[]; harvestedCorrections: SemanticCorrectionMemory[] } {
  const operations: SemanticPatchOperation[] = [];
  const harvestedCorrections: SemanticCorrectionMemory[] = [];
  const existingProvenanceKeys = new Set(model.provenance.map(semanticProvenanceKey));
  const domainKeywords = splitDomainKeywords(model.domain);

  for (const group of groups) {
    const entityNames = [...group.entityNames].sort();
    const summary = buildHarvestSummary(
      group.kind,
      entityNames,
      group.eventCount,
      model,
      group
    );
    const sourceRef = `${sourceRefBase}:${group.kind}`;
    const provenance = {
      sourceType: "human-edit" as const,
      sourceRef,
      note: summary,
      confidence: 0.8
    };
    const provenanceKey = semanticProvenanceKey(provenance);

    if (!existingProvenanceKeys.has(provenanceKey)) {
      operations.push({
        op: "add",
        path: ["provenance", provenanceKey],
        value: provenance
      });
      existingProvenanceKeys.add(provenanceKey);
    }

    const promptKeywords = uniqueStrings([
      ...domainKeywords,
      ...[...group.promptKeywords]
    ]).slice(0, 8);

    harvestedCorrections.push({
      id: slugify(
        `${model.name}-runtime-harvest-${group.kind}-${entityNames.join("-") || "semantic"}`
      ),
      title: `${group.kind} lesson from runtime edits for ${model.name}`,
      kind: group.kind,
      summary,
      recommendation: buildHarvestRecommendation(group.kind, entityNames),
      domains: [model.domain],
      ...(entityNames.length > 0 ? { entityNames } : {}),
      ...(promptKeywords.length > 0 ? { promptKeywords } : {}),
      source: provenance
    });
  }

  return { operations, harvestedCorrections };
}

/**
 * Runtime edit harvest turns accepted local prototype usage back into a small
 * semantic patch plus reusable correction memory. The first version is
 * intentionally conservative: it records runtime evidence as provenance and
 * harvests lessons from the exercised relations, workflows, and editable
 * surfaces rather than guessing entirely new schema from browser clicks.
 */
export function compileRuntimeEditHarvest(
  input: SemanticRuntimeEditHarvestInput
): SemanticRuntimeEditHarvestResult {
  const { model, runtimeEditExport } = input;

  if (runtimeEditExport.modelName !== model.name) {
    throw new Error(
      `Runtime edit export model mismatch: expected "${model.name}" but received "${runtimeEditExport.modelName}".`
    );
  }

  const groups = groupRuntimeEditEvents(model, runtimeEditExport);
  const sourceRefBase =
    input.sourceRef ??
    `runtime-harvest:${model.name}:${slugify(runtimeEditExport.exportedAt)}`;
  const { operations, harvestedCorrections } = buildRuntimeHarvestPatchOperations(
    model,
    runtimeEditExport,
    groups,
    sourceRefBase
  );

  return {
    patch: {
      note:
        groups.length > 0
          ? `Harvest runtime edit evidence from ${model.name} (${runtimeEditExport.events.length} event(s)).`
          : `No semantic runtime edits were harvested from ${model.name}.`,
      operations
    },
    harvestedCorrections,
    summary:
      groups.length > 0
        ? `Harvested ${groups.length} semantic lesson(s) from ${runtimeEditExport.events.length} runtime event(s).`
        : "No semantic lessons were harvested from the runtime edit export."
  };
}
