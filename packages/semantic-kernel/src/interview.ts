import type {
  SemanticAction,
  SemanticAttribute,
  SemanticConcept,
  SemanticEntity,
  SemanticEffect,
  SemanticInvariant,
  SemanticOpenQuestion,
  SemanticPolicy,
  SemanticPolicyEffect,
  SemanticState,
  SemanticView,
  SemanticWorldModel
} from "./types.js";

export interface InterviewAnswer {
  id: string;
  response: string;
  items: string[];
}

export interface InterviewAnswerDocument {
  prompt: string;
  answers: Record<string, InterviewAnswer>;
}

interface ParsedWorkflowSequence {
  entity: string;
  states: string[];
}

const PROMPT_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "build",
  "create",
  "for",
  "make",
  "of",
  "or",
  "the",
  "to"
]);

function toSlug(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function toPascalCase(value: string): string {
  return splitWords(value)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join("");
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);

  if (pascal.length === 0) {
    return "";
  }

  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function inferAttributeType(name: string): string {
  const normalized = toSlug(name);

  if (
    normalized.endsWith("-at") ||
    normalized.includes("created-at") ||
    normalized.includes("updated-at") ||
    normalized.includes("captured-at") ||
    normalized.includes("submitted-at")
  ) {
    return "datetime";
  }

  if (
    normalized.endsWith("-date") ||
    normalized.startsWith("date-") ||
    normalized.includes("scheduled-for")
  ) {
    return "date";
  }

  if (
    normalized.includes("amount") ||
    normalized.includes("total") ||
    normalized.includes("count") ||
    normalized.includes("size") ||
    normalized.includes("score") ||
    normalized.includes("threshold")
  ) {
    return "number";
  }

  if (
    normalized.includes("payload") ||
    normalized.includes("metadata") ||
    normalized.includes("config") ||
    normalized.includes("json")
  ) {
    return "json";
  }

  return "string";
}

function splitItemList(value: string): string[] {
  return value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeAnswerItems(lines: string[]): string[] {
  const cleanedLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== "- TODO" && line !== "TODO");

  if (cleanedLines.length === 0) {
    return [];
  }

  const bulletItems = cleanedLines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((line) => line.length > 0);

  if (bulletItems.length > 0) {
    return bulletItems;
  }

  return cleanedLines.flatMap((line) => splitItemList(line));
}

function buildAnswer(lines: string[]): { response: string; items: string[] } {
  const items = normalizeAnswerItems(lines);

  return {
    response: items.join("\n"),
    items
  };
}

/**
 * Interview answers stay in markdown on purpose: humans can edit them directly
 * and the parser remains transparent enough to debug without model assistance.
 */
export function parseInterviewAnswerMarkdown(markdown: string): InterviewAnswerDocument {
  const answers: Record<string, InterviewAnswer> = {};
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let prompt = "";
  let currentId: string | null = null;
  let collectingAnswer = false;
  let answerLines: string[] = [];

  const commitAnswer = (): void => {
    if (currentId === null) {
      return;
    }

    const answer = buildAnswer(answerLines);
    answers[currentId] = {
      id: currentId,
      response: answer.response,
      items: answer.items
    };
  };

  for (const line of lines) {
    if (line.startsWith("Prompt: ")) {
      prompt = line.slice("Prompt: ".length).trim();
      continue;
    }

    if (line.startsWith("## ")) {
      commitAnswer();
      currentId = line.slice(3).trim();
      collectingAnswer = false;
      answerLines = [];
      continue;
    }

    if (currentId === null) {
      continue;
    }

    if (line.trim() === "Answer:") {
      collectingAnswer = true;
      continue;
    }

    if (collectingAnswer) {
      answerLines.push(line);
    }
  }

  commitAnswer();

  return {
    prompt,
    answers
  };
}

function getAnswerItems(document: InterviewAnswerDocument, id: string): string[] {
  return document.answers[id]?.items ?? [];
}

function getAnswerText(document: InterviewAnswerDocument, id: string): string {
  return document.answers[id]?.response ?? "";
}

function ensureUnique<T extends { name: string }>(items: T[], next: T): void {
  if (!items.some((item) => item.name === next.name)) {
    items.push(next);
  }
}

function buildPromptSlug(prompt: string): string {
  const tokens = splitWords(prompt)
    .map((token) => token.toLowerCase())
    .filter((token) => !PROMPT_STOP_WORDS.has(token));

  return tokens.slice(0, 6).join("-");
}

function deriveModelName(prompt: string, fallback: string): string {
  const slug = buildPromptSlug(prompt);
  return slug.length > 0 ? slug : fallback;
}

function deriveDomain(prompt: string, primaryEntity: string | null): string {
  const tokens = buildPromptSlug(prompt)
    .split("-")
    .filter((token) => token.length > 0)
    .slice(0, 4);

  if (tokens.length >= 2) {
    return tokens.join("-");
  }

  return primaryEntity ? `${toSlug(primaryEntity)}-operations` : "general-operations";
}

function parseEntityAnswer(item: string): { name: string; attributeNames: string[] } | null {
  const cleaned = item.trim().replace(/[.]+$/g, "");

  if (cleaned.length === 0) {
    return null;
  }

  const functionMatch = cleaned.match(/^([^()]+)\(([^)]+)\)$/);
  const colonIndex = cleaned.indexOf(":");

  let entityName = cleaned;
  let attributes = "";

  if (functionMatch) {
    const [, matchedName = "", matchedAttributes = ""] = functionMatch;
    entityName = matchedName.trim();
    attributes = matchedAttributes.trim();
  } else if (colonIndex >= 0) {
    entityName = cleaned.slice(0, colonIndex).trim();
    attributes = cleaned.slice(colonIndex + 1).trim();
  }

  const name = toPascalCase(entityName);

  if (name.length === 0) {
    return null;
  }

  const attributeNames = splitItemList(attributes).map((attribute) => {
    const [candidate] = attribute.split(":");
    return toCamelCase(candidate ?? attribute);
  });

  return {
    name,
    attributeNames: attributeNames.filter((attribute) => attribute.length > 0)
  };
}

function parseWorkflowSequence(
  item: string,
  fallbackEntity: string | null
): ParsedWorkflowSequence | null {
  const cleaned = item.trim().replace(/[.]+$/g, "");

  if (!cleaned.includes("->")) {
    return null;
  }

  let entityPart = fallbackEntity;
  let statePart = cleaned;
  const colonIndex = cleaned.indexOf(":");

  if (colonIndex >= 0) {
    const candidateStates = cleaned.slice(colonIndex + 1).trim();

    if (candidateStates.includes("->")) {
      entityPart = cleaned.slice(0, colonIndex).trim();
      statePart = candidateStates;
    }
  }

  const entity = toPascalCase(entityPart ?? "");
  const states = statePart
    .split("->")
    .map((state) => toSlug(state))
    .filter((state) => state.length > 0);

  if (entity.length === 0 || states.length < 2) {
    return null;
  }

  return {
    entity,
    states
  };
}

function buildEntityAttributes(
  entityName: string,
  attributeNames: string[],
  needsStatus: boolean
): SemanticAttribute[] {
  const attributes: SemanticAttribute[] = [];
  const seen = new Set<string>();

  const addAttribute = (name: string, required: boolean): void => {
    const normalized = toCamelCase(name);

    if (normalized.length === 0 || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    attributes.push({
      name: normalized,
      type: inferAttributeType(normalized),
      required
    });
  };

  for (const attributeName of attributeNames) {
    addAttribute(attributeName, true);
  }

  if (attributes.length === 0) {
    addAttribute(entityName === "Document" || entityName === "Capture" ? "title" : "name", true);
  }

  if (needsStatus) {
    addAttribute("status", true);
  }

  return attributes;
}

function buildStates(sequences: ParsedWorkflowSequence[]): SemanticState[] {
  const states: SemanticState[] = [];

  for (const sequence of sequences) {
    sequence.states.forEach((stateName, index) => {
      const state: SemanticState = {
        name: stateName,
        entity: sequence.entity
      };

      if (index === 0) {
        state.initial = true;
      }

      if (index === sequence.states.length - 1) {
        state.terminal = true;
      }

      if (!states.some((candidate) => candidate.entity === state.entity && candidate.name === state.name)) {
        states.push(state);
      }
    });
  }

  return states;
}

function buildActions(
  sequences: ParsedWorkflowSequence[],
  primaryActor: string
): SemanticAction[] {
  const actions: SemanticAction[] = [];

  for (const sequence of sequences) {
    for (let index = 1; index < sequence.states.length; index += 1) {
      const toState = sequence.states[index];
      const fromState = sequence.states[index - 1];

      if (!toState || !fromState) {
        continue;
      }

      actions.push({
        name: `move${sequence.entity}To${toPascalCase(toState)}`,
        entity: sequence.entity,
        from: fromState,
        to: toState,
        actors: [primaryActor]
      });
    }
  }

  return actions;
}

function buildPolicies(
  permissionItems: string[],
  entities: SemanticEntity[],
  primaryEntity: string | null,
  states: SemanticState[]
): SemanticPolicy[] {
  if (entities.length === 0 || permissionItems.length === 0) {
    return [];
  }

  const policies: SemanticPolicy[] = [];
  const stateByEntity = new Map(
    states.filter((state) => state.initial).map((state) => [state.entity, state.name])
  );

  const findEntityTargets = (item: string): SemanticEntity[] => {
    const normalized = item.toLowerCase();
    const matches = entities.filter((entity) => {
      const words = splitWords(entity.name).map((word) => word.toLowerCase());
      const phrase = words.join(" ");

      if (phrase.length === 0) {
        return false;
      }

      return (
        normalized.includes(phrase) ||
        normalized.includes(`${phrase}s`) ||
        normalized.includes(entity.name.toLowerCase())
      );
    });

    if (matches.length > 0) {
      return matches;
    }

    const fallbackEntity = primaryEntity
      ? entities.find((entity) => entity.name === primaryEntity) ?? entities[0]
      : entities[0];

    return fallbackEntity ? [fallbackEntity] : [];
  };

  for (const item of permissionItems) {
    const actorMatch = item.match(/^([A-Za-z0-9 /_-]+?)\s+(can|must|may|should)\b/i);

    if (!actorMatch) {
      continue;
    }

    const [, matchedActor = ""] = actorMatch;
    const actor = toSlug(matchedActor);

    if (actor.length === 0) {
      continue;
    }

    const effect: SemanticPolicyEffect =
      item.toLowerCase().includes("approve") || item.toLowerCase().includes("approval")
        ? "require-approval"
        : "allow";
    const targets = findEntityTargets(item);

    for (const target of targets) {
      const initialState = stateByEntity.get(target.name);

      if (!initialState) {
        continue;
      }

      ensureUnique(policies, {
        name:
          effect === "require-approval"
            ? `${actor}-${toSlug(target.name)}-approval`
            : `${actor}-${toSlug(target.name)}-access`,
        appliesTo: target.name,
        effect,
        actors: [actor],
        rules: [{ field: "status", operator: "eq", value: initialState }],
        description: item
      });
    }
  }

  return policies;
}

function buildEffects(integrationItems: string[], actions: SemanticAction[]): SemanticEffect[] {
  const trigger = actions[0]?.name ?? "manual";
  const effects: SemanticEffect[] = [];

  for (const item of integrationItems) {
    const normalized = toPascalCase(item);

    if (normalized.length === 0) {
      continue;
    }

    ensureUnique(effects, {
      name: `sync${normalized}`,
      kind:
        item.toLowerCase().includes("notify") || item.toLowerCase().includes("email")
          ? "notification"
          : "integration",
      trigger,
      description: item
    });
  }

  return effects;
}

function buildViews(entities: SemanticEntity[], primaryEntity: string | null): SemanticView[] {
  return entities.map((entity) => ({
    name:
      entity.name === primaryEntity
        ? `${toCamelCase(entity.name)}Overview`
        : `${toCamelCase(entity.name)}Table`,
    entity: entity.name,
    kind: entity.name === primaryEntity ? "table" : "table",
    columns: entity.attributes.slice(0, 4).map((attribute) => attribute.name)
  }));
}

function buildInvariants(actions: SemanticAction[]): SemanticInvariant[] {
  return actions.map((action) => ({
    name: `${toSlug(action.name)}-state-chain`,
    kind: "action-state-chain",
    action: action.name,
    requiredFrom: action.from,
    requiredTo: action.to,
    description: `Synthesized invariant for ${action.name}.`
  }));
}

function buildConcepts(
  prompt: string,
  primaryUserAnswer: string,
  primaryEntity: string | null
): SemanticConcept[] {
  const concepts: SemanticConcept[] = [];

  if (primaryUserAnswer.length > 0) {
    concepts.push({
      name: "operator-outcome",
      description: primaryUserAnswer,
      aliases: [],
      provenance: [
        {
          sourceType: "human-edit",
          sourceRef: "interview:primary-user-and-outcome",
          confidence: 0.8
        }
      ]
    });
  }

  if (primaryEntity) {
    concepts.push({
      name: `${toSlug(primaryEntity)}-lifecycle`,
      description: `Lifecycle semantics for ${primaryEntity} inferred from the interview answers.`,
      aliases: [buildPromptSlug(prompt)],
      provenance: [
        {
          sourceType: "prompt",
          sourceRef: prompt,
          confidence: 0.6
        }
      ]
    });
  }

  return concepts;
}

function buildOpenQuestions(
  entities: SemanticEntity[],
  sequences: ParsedWorkflowSequence[],
  relationsCount: number
): SemanticOpenQuestion[] {
  const questions: SemanticOpenQuestion[] = [];

  if (entities.length > 1 && relationsCount === 0) {
    questions.push({
      id: "relation-map",
      prompt: "How should the core entities relate to one another?",
      status: "open"
    });
  }

  if (sequences.length === 0) {
    questions.push({
      id: "workflow-map",
      prompt: "What lifecycle states and transitions should the primary record follow?",
      status: "open"
    });
  }

  return questions;
}

/**
 * This synthesizer is intentionally conservative. It only converts answered
 * interview facts into a first semantic draft, leaving unresolved structure
 * as explicit open questions rather than inventing hidden semantics.
 */
export function synthesizeWorldModelFromInterview(
  document: InterviewAnswerDocument
): SemanticWorldModel {
  const prompt = document.prompt.trim();
  const entityInputs = getAnswerItems(document, "core-records")
    .map((item) => parseEntityAnswer(item))
    .filter((entity): entity is { name: string; attributeNames: string[] } => entity !== null);
  const fallbackPrimaryEntity = entityInputs[0]?.name ?? null;
  const workflowInputs = getAnswerItems(document, "core-workflow")
    .map((item) => parseWorkflowSequence(item, fallbackPrimaryEntity))
    .filter((sequence): sequence is ParsedWorkflowSequence => sequence !== null);
  const primaryEntity = workflowInputs[0]?.entity ?? fallbackPrimaryEntity;
  const statefulEntities = new Set(workflowInputs.map((sequence) => sequence.entity));
  const entities: SemanticEntity[] = entityInputs.map((entityInput) => ({
    name: entityInput.name,
    description: `${entityInput.name} synthesized from interview answers.`,
    attributes: buildEntityAttributes(
      entityInput.name,
      entityInput.attributeNames,
      statefulEntities.has(entityInput.name)
    )
  }));
  const states = buildStates(workflowInputs);
  const primaryActor = primaryEntity ? `${toSlug(primaryEntity)}-operator` : "operator";
  const actions = buildActions(workflowInputs, primaryActor);
  const policies = buildPolicies(
    getAnswerItems(document, "permissions-and-audit"),
    entities,
    primaryEntity,
    states
  );
  const effects = buildEffects(getAnswerItems(document, "external-integrations"), actions);
  const views = buildViews(entities, primaryEntity);
  const invariants = buildInvariants(actions);
  const primaryUserAnswer = getAnswerText(document, "primary-user-and-outcome");
  const concepts = buildConcepts(prompt, primaryUserAnswer, primaryEntity);
  const openQuestions = buildOpenQuestions(entities, workflowInputs, 0);

  return {
    name: deriveModelName(prompt, "interview-draft"),
    version: "0.1.0",
    domain: deriveDomain(prompt, primaryEntity),
    concepts,
    entities,
    relations: [],
    states,
    actions,
    policies,
    views,
    effects,
    invariants,
    openQuestions,
    provenance: [
      {
        sourceType: "prompt",
        sourceRef: prompt,
        confidence: 0.7
      },
      {
        sourceType: "human-edit",
        sourceRef: "interview-answers",
        confidence: 0.9
      }
    ]
  };
}
