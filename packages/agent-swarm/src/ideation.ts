import {
  matchCorrectionMemories,
  type SemanticCorrectionMemory,
  type SemanticCorrectionMemoryMatch,
  type SemanticWorldModel
} from "@ralph/semantic-kernel";

/**
 * Cross-domain ideation is intentionally deterministic. Ralph can broaden its
 * intake surface without pretending every prompt is deployable on the current
 * substrate by classifying the prompt, exposing the implied proof regime, and
 * steering the operator toward the right next artifact.
 */
export type RalphSoftwareCategory =
  | "workflow-app"
  | "knowledge-system"
  | "vision-commerce"
  | "developer-tooling"
  | "api-service"
  | "agent-system"
  | "data-pipeline"
  | "graphics-rendering"
  | "game-system"
  | "compiler-toolchain"
  | "browser-engine"
  | "system-kernel"
  | "protocol-embedded"
  | "scientific-compute"
  | "general-product";

export type RalphExecutionMode =
  | "interactive-runtime"
  | "semantic-runtime-plan"
  | "architecture-spec";

export type RalphIdeationSurface =
  | "web"
  | "cli"
  | "api"
  | "worker"
  | "mobile"
  | "desktop"
  | "embedded";

export type RalphIdeationQuestionCategory =
  | "domain"
  | "data"
  | "workflow"
  | "policy"
  | "integration"
  | "interface"
  | "implementation"
  | "runtime"
  | "resource"
  | "performance"
  | "proof";

export interface RalphIdeationContext {
  prompt: string;
  benchmarkName?: string;
  worldModel?: SemanticWorldModel;
  correctionMemories?: SemanticCorrectionMemory[];
  implementationPreferences?: {
    targetSurfaces?: RalphIdeationSurface[];
    preferredLanguages?: string[];
  };
}

export interface RalphIdeationQuestionBlueprint {
  id: string;
  category: RalphIdeationQuestionCategory;
  priority: "high" | "medium";
  blocking: boolean;
  prompt: string;
  rationale: string;
}

export interface RalphIdeationBrief {
  prompt: string;
  primaryCategory: RalphSoftwareCategory;
  secondaryCategories: RalphSoftwareCategory[];
  executionMode: RalphExecutionMode;
  confidence: number;
  rationale: string[];
  semanticAxes: string[];
  systemConcerns: string[];
  proofRegime: string[];
  builderTargets: string[];
  recommendedSurfaces: RalphIdeationSurface[];
  recommendedLanguages: string[];
  correctionMemoryMatches: SemanticCorrectionMemoryMatch[];
  improvementOpportunities: string[];
  suggestedCommands: string[];
  interviewFocusIds: string[];
}

interface CategoryDefinition {
  category: RalphSoftwareCategory;
  keywords: string[];
  executionMode: RalphExecutionMode;
  semanticAxes: string[];
  systemConcerns: string[];
  proofRegime: string[];
  builderTargets: string[];
  recommendedSurfaces: RalphIdeationSurface[];
  recommendedLanguages: string[];
  interviewQuestions: RalphIdeationQuestionBlueprint[];
}

const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    category: "workflow-app",
    keywords: [
      "workflow",
      "approval",
      "queue",
      "backoffice",
      "ops",
      "operator",
      "admin",
      "crm",
      "invoice",
      "dashboard"
    ],
    executionMode: "interactive-runtime",
    semanticAxes: [
      "entities and relationships",
      "state transitions",
      "permissions and approvals",
      "derived views and queues"
    ],
    systemConcerns: [
      "multi-actor coordination",
      "auditability",
      "deterministic rule execution"
    ],
    proofRegime: [
      "workflow invariants",
      "policy checks",
      "view consistency"
    ],
    builderTargets: [
      "record store",
      "workflow runtime",
      "policy layer",
      "table and dashboard views"
    ],
    recommendedSurfaces: ["web", "api"],
    recommendedLanguages: ["TypeScript", "Elixir", "Ruby"],
    interviewQuestions: [
      {
        id: "operational-queues-and-reports",
        category: "interface",
        priority: "medium",
        blocking: false,
        prompt: "Which queues, dashboards, or reporting surfaces must the first operator version expose?",
        rationale: "Ops-heavy software is only useful when the right derived views exist."
      },
      {
        id: "exceptions-and-manual-overrides",
        category: "policy",
        priority: "medium",
        blocking: false,
        prompt: "Which workflow exceptions or manual override paths must exist from day one?",
        rationale: "Exception handling changes the shape of states, actions, and proof obligations."
      }
    ]
  },
  {
    category: "knowledge-system",
    keywords: [
      "knowledge",
      "wiki",
      "document",
      "workspace",
      "notion",
      "notes",
      "cms",
      "blocks",
      "content"
    ],
    executionMode: "interactive-runtime",
    semanticAxes: [
      "content graph",
      "composition and nesting",
      "publishing states",
      "collaboration"
    ],
    systemConcerns: [
      "content structure durability",
      "sharing boundaries",
      "versioned edits"
    ],
    proofRegime: [
      "content lifecycle invariants",
      "view consistency",
      "sharing policy checks"
    ],
    builderTargets: [
      "document and collection store",
      "workspace views",
      "publishing workflow",
      "sharing layer"
    ],
    recommendedSurfaces: ["web", "desktop"],
    recommendedLanguages: ["TypeScript", "Elixir", "Ruby"],
    interviewQuestions: [
      {
        id: "content-structure-and-composition",
        category: "data",
        priority: "high",
        blocking: true,
        prompt: "What are the core content primitives, and how do they compose or nest?",
        rationale: "Knowledge systems stand or fall on durable content structure."
      },
      {
        id: "collaboration-and-publishing",
        category: "workflow",
        priority: "medium",
        blocking: false,
        prompt: "What collaboration, publishing, or review flow must the content support?",
        rationale: "Publishing and collaboration rules determine states, permissions, and views."
      }
    ]
  },
  {
    category: "vision-commerce",
    keywords: [
      "computer vision",
      "scan",
      "scanner",
      "barcode",
      "ingredient",
      "ingredients",
      "nutrition",
      "healthier",
      "alternative",
      "alternatives",
      "price match",
      "shopping",
      "shopper",
      "retailer"
    ],
    executionMode: "semantic-runtime-plan",
    semanticAxes: [
      "capture and extraction pipeline",
      "ingredient and product normalization",
      "nutrition and health scoring",
      "alternative ranking",
      "retailer offer comparison"
    ],
    systemConcerns: [
      "extraction confidence and provenance",
      "canonical product and ingredient identity",
      "explainable recommendations",
      "price freshness and retailer coverage"
    ],
    proofRegime: [
      "extraction confidence checks",
      "product match consistency",
      "recommendation rationale checks",
      "price freshness validation"
    ],
    builderTargets: [
      "scan ingestion pipeline",
      "product and ingredient ontology",
      "recommendation engine",
      "comparison and offer views"
    ],
    recommendedSurfaces: ["mobile", "web", "api"],
    recommendedLanguages: ["Python", "TypeScript"],
    interviewQuestions: [
      {
        id: "capture-extraction-and-provenance",
        category: "runtime",
        priority: "high",
        blocking: true,
        prompt: "What capture inputs are supported first, how are ingredients extracted, and how should confidence and provenance be stored?",
        rationale: "Vision-assisted commerce depends on trustworthy extraction, not just downstream UX."
      },
      {
        id: "alternative-ranking-and-price-comparison",
        category: "proof",
        priority: "high",
        blocking: true,
        prompt: "What makes an alternative better: health score, allergen avoidance, ingredient quality, price delta, retailer availability, or some weighted mix?",
        rationale: "Recommendation and price-comparison logic are the semantic center of this product."
      }
    ]
  },
  {
    category: "developer-tooling",
    keywords: [
      "developer",
      "tooling",
      "cli",
      "plugin",
      "sdk",
      "lint",
      "formatter",
      "editor",
      "codemod"
    ],
    executionMode: "semantic-runtime-plan",
    semanticAxes: [
      "host environment",
      "developer loop",
      "artifact contracts",
      "extension points"
    ],
    systemConcerns: [
      "fast feedback",
      "composability with other tools",
      "repeatable outputs"
    ],
    proofRegime: [
      "fixture-based output checks",
      "developer loop replay",
      "compatibility contracts"
    ],
    builderTargets: [
      "CLI surfaces",
      "host integrations",
      "artifact generators",
      "test harnesses"
    ],
    recommendedSurfaces: ["cli", "api", "desktop"],
    recommendedLanguages: ["TypeScript", "Python", "Rust"],
    interviewQuestions: [
      {
        id: "developer-loop-and-host-environment",
        category: "interface",
        priority: "high",
        blocking: true,
        prompt: "Where does this tool live in the developer loop: CLI, editor, CI, daemon, or a mix?",
        rationale: "Host environment determines interaction boundaries and packaging."
      },
      {
        id: "artifact-contracts-and-extension-points",
        category: "implementation",
        priority: "medium",
        blocking: false,
        prompt: "What artifacts does the tool read or write, and where do users need extension points?",
        rationale: "Developer tools are defined by the contracts they uphold around inputs and outputs."
      }
    ]
  },
  {
    category: "api-service",
    keywords: [
      "api",
      "service",
      "endpoint",
      "graphql",
      "rest",
      "rpc",
      "webhook",
      "backend"
    ],
    executionMode: "semantic-runtime-plan",
    semanticAxes: [
      "resource model",
      "contracts and schemas",
      "tenancy and auth",
      "consistency semantics"
    ],
    systemConcerns: [
      "contract stability",
      "auth boundaries",
      "latency and retry behavior"
    ],
    proofRegime: [
      "schema compatibility",
      "policy checks",
      "API contract replay"
    ],
    builderTargets: [
      "resource layer",
      "policy enforcement",
      "request handlers",
      "integration contracts"
    ],
    recommendedSurfaces: ["api", "worker", "web"],
    recommendedLanguages: ["TypeScript", "Elixir", "Rust"],
    interviewQuestions: [
      {
        id: "api-contract-and-tenancy",
        category: "policy",
        priority: "high",
        blocking: true,
        prompt: "What contract, tenancy model, and authentication boundary must the API enforce?",
        rationale: "API services need explicit resource and tenant boundaries before implementation."
      },
      {
        id: "consistency-and-latency-budget",
        category: "performance",
        priority: "medium",
        blocking: false,
        prompt: "What consistency, retry, and latency guarantees matter to the first version?",
        rationale: "Service semantics are shaped by time, not only by data shape."
      }
    ]
  },
  {
    category: "agent-system",
    keywords: [
      "agent",
      "assistant",
      "tool call",
      "tool use",
      "planner",
      "swarm",
      "mcp",
      "autonomous"
    ],
    executionMode: "semantic-runtime-plan",
    semanticAxes: [
      "tool contracts",
      "autonomy boundaries",
      "memory and context policy",
      "evaluation loop"
    ],
    systemConcerns: [
      "bounded autonomy",
      "rollback and recovery",
      "traceability"
    ],
    proofRegime: [
      "tool contract tests",
      "rollback and repair tests",
      "trace replay"
    ],
    builderTargets: [
      "tool registry",
      "planner contracts",
      "memory policies",
      "evaluation harness"
    ],
    recommendedSurfaces: ["cli", "api", "web"],
    recommendedLanguages: ["TypeScript", "Python", "Elixir"],
    interviewQuestions: [
      {
        id: "tool-contracts-and-autonomy-boundary",
        category: "policy",
        priority: "high",
        blocking: true,
        prompt: "Which tools may the agent call, and where must autonomy stop pending human approval?",
        rationale: "Agent systems fail when action boundaries remain implicit."
      },
      {
        id: "evaluation-and-rollback-regime",
        category: "proof",
        priority: "high",
        blocking: true,
        prompt: "How will the system judge success, detect drift, and roll back unsafe behavior?",
        rationale: "Agent loops need explicit evaluation and repair semantics."
      }
    ]
  },
  {
    category: "data-pipeline",
    keywords: [
      "pipeline",
      "etl",
      "ingest",
      "warehouse",
      "transform",
      "stream",
      "batch",
      "analytics",
      "lineage"
    ],
    executionMode: "semantic-runtime-plan",
    semanticAxes: [
      "sources and sinks",
      "transform graph",
      "latency model",
      "lineage"
    ],
    systemConcerns: [
      "backfills and recovery",
      "data freshness",
      "operator observability"
    ],
    proofRegime: [
      "lineage checks",
      "backfill replay",
      "source-to-sink fixture validation"
    ],
    builderTargets: [
      "source adapters",
      "transform planner",
      "lineage and observability views",
      "batch and stream runners"
    ],
    recommendedSurfaces: ["worker", "api", "cli"],
    recommendedLanguages: ["Python", "TypeScript", "Rust"],
    interviewQuestions: [
      {
        id: "sources-sinks-and-latency",
        category: "integration",
        priority: "high",
        blocking: true,
        prompt: "What are the sources, sinks, and freshness or latency expectations for the pipeline?",
        rationale: "Pipeline semantics come from source and sink contracts plus time."
      },
      {
        id: "lineage-backfill-and-recovery",
        category: "proof",
        priority: "high",
        blocking: true,
        prompt: "What lineage, backfill, and recovery guarantees must the system preserve?",
        rationale: "Pipelines need proof around historical correctness, not only forward execution."
      }
    ]
  },
  {
    category: "graphics-rendering",
    keywords: [
      "render",
      "renderer",
      "graphics",
      "shader",
      "gpu",
      "webgpu",
      "canvas",
      "compositor",
      "scene"
    ],
    executionMode: "architecture-spec",
    semanticAxes: [
      "frame pipeline",
      "resource lifetime",
      "render graph",
      "synchronization"
    ],
    systemConcerns: [
      "frame budget",
      "resource ownership",
      "scheduling across CPU and GPU"
    ],
    proofRegime: [
      "frame pipeline invariants",
      "resource lifetime checks",
      "performance budgets"
    ],
    builderTargets: [
      "scene graph",
      "render graph",
      "resource manager",
      "frame scheduler"
    ],
    recommendedSurfaces: ["desktop", "web"],
    recommendedLanguages: ["Rust", "Zig", "C++"],
    interviewQuestions: [
      {
        id: "frame-pipeline-and-resources",
        category: "runtime",
        priority: "high",
        blocking: true,
        prompt: "What frame pipeline stages and resource lifetime rules must the renderer enforce?",
        rationale: "Rendering systems need explicit pipeline and ownership semantics."
      },
      {
        id: "frame-budget-and-quality-bar",
        category: "performance",
        priority: "high",
        blocking: true,
        prompt: "What frame budget, target hardware, and visual quality bar define success?",
        rationale: "Without a performance envelope, rendering architecture stays underspecified."
      }
    ]
  },
  {
    category: "game-system",
    keywords: [
      "game",
      "gameplay",
      "level",
      "quest",
      "physics",
      "ecs",
      "multiplayer",
      "simulation"
    ],
    executionMode: "architecture-spec",
    semanticAxes: [
      "simulation loop",
      "authority and sync",
      "entity model",
      "player feedback"
    ],
    systemConcerns: [
      "frame-time stability",
      "authoritative state",
      "save and sync boundaries"
    ],
    proofRegime: [
      "simulation replay",
      "authority invariants",
      "latency and persistence checks"
    ],
    builderTargets: [
      "simulation loop",
      "state sync",
      "entity and component model",
      "persistence layer"
    ],
    recommendedSurfaces: ["desktop", "mobile", "web"],
    recommendedLanguages: ["Rust", "C++", "Zig"],
    interviewQuestions: [
      {
        id: "simulation-loop-and-entities",
        category: "runtime",
        priority: "high",
        blocking: true,
        prompt: "What simulation loop, entity model, and authoritative state rules define the game?",
        rationale: "Games are shaped by simulation semantics more than by CRUD."
      },
      {
        id: "multiplayer-and-persistence-boundaries",
        category: "resource",
        priority: "medium",
        blocking: false,
        prompt: "Is the system single-player, peer-to-peer, or server authoritative, and what state must persist?",
        rationale: "Sync and persistence assumptions radically change the architecture."
      }
    ]
  },
  {
    category: "compiler-toolchain",
    keywords: [
      "compiler",
      "parser",
      "lexer",
      "ast",
      "intermediate representation",
      "bytecode",
      "transpile",
      "codegen",
      "wasm",
      "webassembly"
    ],
    executionMode: "architecture-spec",
    semanticAxes: [
      "source language",
      "intermediate representation",
      "target code generation",
      "optimization and diagnostics"
    ],
    systemConcerns: [
      "correctness over cleverness",
      "diagnostics quality",
      "phase isolation"
    ],
    proofRegime: [
      "golden fixture compilation",
      "round-trip or lowering invariants",
      "optimization correctness tests"
    ],
    builderTargets: [
      "parser and AST",
      "typed IR",
      "lowering passes",
      "diagnostics"
    ],
    recommendedSurfaces: ["cli", "api"],
    recommendedLanguages: ["Rust", "Common Lisp", "Zig"],
    interviewQuestions: [
      {
        id: "source-language-and-target",
        category: "runtime",
        priority: "high",
        blocking: true,
        prompt: "What is the source language or input shape, which IRs are required, and what target output must the toolchain emit?",
        rationale: "Compilers need their source, IR, and target boundaries fixed early."
      },
      {
        id: "correctness-and-optimization-regime",
        category: "proof",
        priority: "high",
        blocking: true,
        prompt: "What correctness bar, diagnostics quality, and optimization strategy matter in the first version?",
        rationale: "Compiler architecture depends on proof and diagnostics strategy as much as syntax."
      }
    ]
  },
  {
    category: "browser-engine",
    keywords: [
      "browser",
      "layout",
      "dom",
      "css",
      "html parser",
      "render tree",
      "paint",
      "web engine",
      "style engine"
    ],
    executionMode: "architecture-spec",
    semanticAxes: [
      "parsing and DOM",
      "style and layout",
      "paint and compositing",
      "events and script integration"
    ],
    systemConcerns: [
      "standards compliance",
      "invalidation and scheduling",
      "process or capability isolation"
    ],
    proofRegime: [
      "spec conformance suites",
      "render tree invariants",
      "event and layout regression replay"
    ],
    builderTargets: [
      "parser pipeline",
      "DOM and style system",
      "layout engine",
      "paint and compositor"
    ],
    recommendedSurfaces: ["desktop", "cli"],
    recommendedLanguages: ["Rust", "C++", "Zig"],
    interviewQuestions: [
      {
        id: "pipeline-invalidation-and-scheduling",
        category: "runtime",
        priority: "high",
        blocking: true,
        prompt: "Which engine stages must exist, and how should invalidation, scheduling, and event dispatch work across them?",
        rationale: "Rendering engines are organized around pipelines and invalidation boundaries."
      },
      {
        id: "standards-compliance-and-sandboxing",
        category: "proof",
        priority: "high",
        blocking: true,
        prompt: "Which standards or compatibility targets matter, and what isolation model should protect the runtime?",
        rationale: "Browser engines need explicit correctness and sandbox boundaries."
      }
    ]
  },
  {
    category: "system-kernel",
    keywords: [
      "kernel",
      "syscall",
      "scheduler",
      "virtual memory",
      "filesystem",
      "process",
      "interrupt",
      "os"
    ],
    executionMode: "architecture-spec",
    semanticAxes: [
      "capability boundaries",
      "process and memory model",
      "scheduler",
      "device and filesystem interfaces"
    ],
    systemConcerns: [
      "privilege separation",
      "fault isolation",
      "resource ownership"
    ],
    proofRegime: [
      "capability and isolation checks",
      "scheduler and memory invariants",
      "crash and recovery scenarios"
    ],
    builderTargets: [
      "capability model",
      "process and memory subsystems",
      "scheduler",
      "device interface layer"
    ],
    recommendedSurfaces: ["cli", "embedded"],
    recommendedLanguages: ["Zig", "Rust", "C"],
    interviewQuestions: [
      {
        id: "capability-and-privilege-boundaries",
        category: "policy",
        priority: "high",
        blocking: true,
        prompt: "What privilege levels, capability boundaries, and fault isolation domains must exist?",
        rationale: "Kernel design begins with privilege and capability boundaries."
      },
      {
        id: "resource-model-and-scheduling",
        category: "resource",
        priority: "high",
        blocking: true,
        prompt: "What scheduling, memory, and device-resource model defines the first viable kernel?",
        rationale: "Execution and ownership semantics are the kernel."
      }
    ]
  },
  {
    category: "protocol-embedded",
    keywords: [
      "embedded",
      "firmware",
      "protocol",
      "uart",
      "spi",
      "i2c",
      "microcontroller",
      "modem",
      "rtos"
    ],
    executionMode: "architecture-spec",
    semanticAxes: [
      "hardware model",
      "protocol state machines",
      "interrupts and timing",
      "observability"
    ],
    systemConcerns: [
      "timing determinism",
      "buffer ownership",
      "recovery from line noise and partial failure"
    ],
    proofRegime: [
      "state-machine replay",
      "timing budget checks",
      "fault-injection scenarios"
    ],
    builderTargets: [
      "protocol state machines",
      "interrupt handlers",
      "buffer management",
      "device observability"
    ],
    recommendedSurfaces: ["embedded", "cli"],
    recommendedLanguages: ["C", "Rust", "Zig"],
    interviewQuestions: [
      {
        id: "hardware-and-timing-model",
        category: "resource",
        priority: "high",
        blocking: true,
        prompt: "What hardware, timing, and interrupt model define the first supported platform?",
        rationale: "Embedded systems are anchored in physical timing and device constraints."
      },
      {
        id: "protocol-state-machine-and-recovery",
        category: "workflow",
        priority: "high",
        blocking: true,
        prompt: "What protocol state machine and recovery behavior must hold under partial failure?",
        rationale: "The protocol state machine is the semantic kernel for this class of system."
      }
    ]
  },
  {
    category: "scientific-compute",
    keywords: [
      "scientific",
      "numerical",
      "optimization",
      "simulation",
      "matrix",
      "statistics",
      "monte carlo",
      "signal processing"
    ],
    executionMode: "architecture-spec",
    semanticAxes: [
      "numerical model",
      "accuracy envelope",
      "compute graph",
      "evidence and reproducibility"
    ],
    systemConcerns: [
      "numerical stability",
      "hardware acceleration",
      "reproducibility"
    ],
    proofRegime: [
      "reference dataset checks",
      "error-bound validation",
      "performance and reproducibility budgets"
    ],
    builderTargets: [
      "compute graph",
      "dataset fixtures",
      "evidence reports",
      "accelerated kernels"
    ],
    recommendedSurfaces: ["cli", "api", "desktop"],
    recommendedLanguages: ["Python", "Julia", "Rust"],
    interviewQuestions: [
      {
        id: "numerical-model-and-accuracy",
        category: "proof",
        priority: "high",
        blocking: true,
        prompt: "What numerical model, error bounds, or statistical accuracy requirements define success?",
        rationale: "Scientific systems are judged by evidence, not only by shape."
      },
      {
        id: "compute-environment-and-scale",
        category: "performance",
        priority: "medium",
        blocking: false,
        prompt: "What compute environment, data scale, and acceleration path must the first version support?",
        rationale: "Performance and hardware shape the design space early."
      }
    ]
  },
  {
    category: "general-product",
    keywords: [],
    executionMode: "semantic-runtime-plan",
    semanticAxes: [
      "user outcome",
      "core objects",
      "execution loop",
      "interface surface"
    ],
    systemConcerns: [
      "clarifying the real operator",
      "reducing ambiguity",
      "finding the first proofable wedge"
    ],
    proofRegime: [
      "semantic consistency",
      "benchmark comparison",
      "operator review"
    ],
    builderTargets: [
      "semantic draft",
      "proof report",
      "architecture outline"
    ],
    recommendedSurfaces: ["web", "cli"],
    recommendedLanguages: ["TypeScript", "Python"],
    interviewQuestions: [
      {
        id: "first-proofable-wedge",
        category: "domain",
        priority: "high",
        blocking: true,
        prompt: "What is the first narrow slice we can prove valuable before broadening the system?",
        rationale: "Ambitious product ideas still need a sharp first wedge."
      }
    ]
  }
] as const;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function collectPromptText(context: RalphIdeationContext): string {
  const model = context.worldModel;
  return normalizeText(
    [
      context.prompt,
      context.benchmarkName ?? "",
      model?.domain ?? "",
      ...(model?.entities.map((entity) => entity.name) ?? []),
      ...(model?.views.map((view) => view.name) ?? []),
      ...(model?.actions.map((action) => action.name) ?? []),
      ...(model?.effects.map((effect) => effect.name) ?? [])
    ].join(" ")
  );
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordMatches(text: string, keyword: string): boolean {
  const normalizedKeyword = normalizeText(keyword);

  if (normalizedKeyword.includes(" ")) {
    return text.includes(normalizedKeyword);
  }

  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}($|[^a-z0-9])`, "i");
  return pattern.test(text);
}

function inferWorldModelScore(
  category: RalphSoftwareCategory,
  model: SemanticWorldModel | undefined
): number {
  if (!model) {
    return 0;
  }

  switch (category) {
    case "workflow-app":
      return model.actions.length > 0 || model.policies.length > 0 ? 3 : 0;
    case "knowledge-system":
      return ["knowledge-and-structure", "workspace", "document"].some((token) =>
        normalizeText([model.domain, ...model.entities.map((entity) => entity.name)].join(" ")).includes(
          token
        )
      )
        ? 3
        : 0;
    case "api-service":
      return model.effects.some((effect) =>
        normalizeText(effect.name).includes("webhook") ||
        normalizeText(effect.name).includes("api")
      )
        ? 2
        : 0;
    case "agent-system":
      return model.effects.some((effect) =>
        normalizeText([effect.name, effect.description ?? ""].join(" ")).includes("agent")
      )
        ? 2
        : 0;
    default:
      return 0;
  }
}

function scoreCategory(
  context: RalphIdeationContext,
  definition: CategoryDefinition
): { score: number; matches: string[] } {
  const promptText = collectPromptText(context);
  const matches = definition.keywords.filter((keyword) => keywordMatches(promptText, keyword));
  const worldModelScore = inferWorldModelScore(definition.category, context.worldModel);
  const fallbackScore = definition.category === "general-product" ? 1 : 0;

  return {
    score: matches.length * 3 + worldModelScore + fallbackScore,
    matches
  };
}

function computeConfidence(primaryScore: number, secondaryScore: number): number {
  if (primaryScore <= 1) {
    return 0.46;
  }

  const confidence = 0.5 + primaryScore * 0.05 + Math.max(primaryScore - secondaryScore, 0) * 0.03;
  return Number(Math.min(0.95, confidence).toFixed(2));
}

function describeExecutionMode(executionMode: RalphExecutionMode): string {
  switch (executionMode) {
    case "interactive-runtime":
      return "Current Ralph substrate can materialize an interactive local runtime for this category.";
    case "semantic-runtime-plan":
      return "Ralph can shape the system semantically now, but execution should remain plan-first on the current substrate.";
    case "architecture-spec":
      return "Ralph should treat this as a serious architecture and proof problem today, not as a current deployable runtime target.";
  }
}

function buildSuggestedCommands(
  prompt: string,
  executionMode: RalphExecutionMode
): string[] {
  const escapedPrompt = prompt.replaceAll('"', '\\"');
  const commands = [
    `pnpm ralph:ideate "${escapedPrompt}"`,
    `pnpm ralph:interview "${escapedPrompt}"`,
    "pnpm ralph:draft <interview-dir-or-answer-file>"
  ];

  if (executionMode === "interactive-runtime") {
    commands.push("pnpm ralph:artifact <model-or-job-or-draft>");
    commands.push("pnpm ralph:loop <generated-job-file>");
  }

  return commands;
}

function buildImprovementOpportunities(
  primaryCategory: RalphSoftwareCategory,
  secondaryCategories: RalphSoftwareCategory[]
): string[] {
  const byCategory: Record<RalphSoftwareCategory, string[]> = {
    "workflow-app": [
      "Add explicit exception queues and manual override paths so the first workflow does not collapse on edge cases.",
      "Add SLA, escalation, and audit views early so operational value is visible before deeper automation."
    ],
    "knowledge-system": [
      "Add semantic backlinks, reusable templates, and change history so the workspace gets smarter over time instead of becoming another flat document pile.",
      "Add publishing and review states early so collaboration rules stay inside the model instead of leaking into ad hoc UI logic."
    ],
    "vision-commerce": [
      "Add explainable recommendation reasons so healthier or cheaper alternatives are justified by structured evidence instead of opaque ranking.",
      "Add retailer-offer freshness and correction loops so scans, prices, and substitutions stay trustworthy in the real world."
    ],
    "developer-tooling": [
      "Add golden fixtures, watch-mode feedback, and extension points so the tool becomes useful inside a real developer loop rather than only in demos.",
      "Add an artifact inspector so users can see exactly what changed when the tool rewrites or generates output."
    ],
    "api-service": [
      "Add contract versioning and sandbox environments early so integrations do not hard-fork the API the first time requirements change.",
      "Add retry, idempotency, and webhook replay semantics before scaling traffic so failure behavior stays explicit."
    ],
    "agent-system": [
      "Add trace replay and human approval checkpoints so the agent can be tuned safely instead of only judged by anecdotes.",
      "Add memory boundaries and tool call budgets so autonomy stays legible under load."
    ],
    "data-pipeline": [
      "Add lineage, freshness alerts, and backfill controls early so operators can trust the data when something goes wrong.",
      "Add source quality scoring so unreliable upstream systems become visible before they poison downstream outputs."
    ],
    "graphics-rendering": [
      "Add frame capture, resource inspection, and hot-reloadable scenes so the rendering architecture stays debuggable under performance pressure.",
      "Add explicit frame-budget and resource-lifetime tracking before chasing visual breadth."
    ],
    "game-system": [
      "Add replay capture, authoritative-state inspection, and save-state tooling so gameplay iteration does not outrun debuggability.",
      "Add player-feedback and progression telemetry early so design changes can be measured instead of guessed."
    ],
    "compiler-toolchain": [
      "Add IR inspection, golden fixture tests, and diagnostic reporting early so optimization work does not outrun correctness visibility.",
      "Add source-map and error-reporting quality as a first-class goal instead of treating the compiler as only a codegen problem."
    ],
    "browser-engine": [
      "Add subsystem traces and standards-test checkpoints early so layout, script, and rendering behavior can be isolated when invariants break.",
      "Add a minimal inspector surface so engine decisions are observable instead of buried in internal state."
    ],
    "system-kernel": [
      "Add syscall tracing, capability inspection, and deterministic boot scenarios so systems debugging is part of the design from the start.",
      "Add a simulator or QEMU-first harness before broad device ambition so proof pressure stays tractable."
    ],
    "protocol-embedded": [
      "Add simulated devices, packet traces, and timing-budget checks early so protocol and hardware assumptions stay testable.",
      "Add fault injection around retries, drops, and clock drift before hardware integration becomes the only truth source."
    ],
    "scientific-compute": [
      "Add reproducible datasets, sensitivity analysis, and numeric verification before building a large interface around unstable math.",
      "Add provenance for every derived result so evidence survives model iteration."
    ],
    "general-product": [
      "Add a narrower first wedge, operator persona, and measurable success loop before broadening feature scope.",
      "Add saved histories and feedback capture so the product can learn which functionality users actually keep."
    ]
  };

  return uniqueStrings([
    ...byCategory[primaryCategory],
    ...secondaryCategories.flatMap((category) => byCategory[category] ?? [])
  ]).slice(0, 4);
}

function findDefinition(category: RalphSoftwareCategory): CategoryDefinition {
  const definition = CATEGORY_DEFINITIONS.find((candidate) => candidate.category === category);

  if (!definition) {
    throw new Error(`Unknown Ralph software category: ${category}`);
  }

  return definition;
}

export function buildIdeationBrief(context: RalphIdeationContext): RalphIdeationBrief {
  const scoredDefinitions = CATEGORY_DEFINITIONS.map((definition) => ({
    definition,
    ...scoreCategory(context, definition)
  })).sort((left, right) => right.score - left.score);

  const primary = scoredDefinitions[0] ?? {
    definition: findDefinition("general-product"),
    score: 1,
    matches: []
  };
  const secondaryDefinitions = scoredDefinitions
    .filter(
      (candidate) =>
        candidate.definition.category !== primary.definition.category &&
        candidate.score > 0 &&
        (candidate.definition.category !== "general-product" ||
          primary.definition.category === "general-product")
    )
    .slice(0, 2);
  const confidence = computeConfidence(primary.score, secondaryDefinitions[0]?.score ?? 0);
  const recommendedSurfaces = uniqueStrings(
    context.implementationPreferences?.targetSurfaces?.length
      ? context.implementationPreferences.targetSurfaces
      : primary.definition.recommendedSurfaces
  );
  const recommendedLanguages = uniqueStrings(
    context.implementationPreferences?.preferredLanguages?.length
      ? context.implementationPreferences.preferredLanguages
      : primary.definition.recommendedLanguages
  );
  const semanticAxes = uniqueStrings([
    ...primary.definition.semanticAxes,
    ...secondaryDefinitions.flatMap((candidate) => candidate.definition.semanticAxes)
  ]).slice(0, 6);
  const systemConcerns = uniqueStrings([
    ...primary.definition.systemConcerns,
    ...secondaryDefinitions.flatMap((candidate) => candidate.definition.systemConcerns)
  ]).slice(0, 6);
  const proofRegime = uniqueStrings([
    ...primary.definition.proofRegime,
    ...secondaryDefinitions.flatMap((candidate) => candidate.definition.proofRegime)
  ]).slice(0, 6);
  const builderTargets = uniqueStrings([
    ...primary.definition.builderTargets,
    ...secondaryDefinitions.flatMap((candidate) => candidate.definition.builderTargets)
  ]).slice(0, 6);
  const correctionMemoryMatches = matchCorrectionMemories(
    context.correctionMemories ?? [],
    {
      prompt: context.prompt,
      categories: [
        primary.definition.category,
        ...secondaryDefinitions.map((candidate) => candidate.definition.category)
      ],
      ...(context.worldModel?.domain ? { domain: context.worldModel.domain } : {}),
      ...(context.worldModel
        ? { entityNames: context.worldModel.entities.map((entity) => entity.name) }
        : {})
    }
  );
  const improvementOpportunities = uniqueStrings([
    ...buildImprovementOpportunities(
      primary.definition.category,
      secondaryDefinitions.map((candidate) => candidate.definition.category)
    ),
    ...correctionMemoryMatches.map((match) => match.memory.recommendation)
  ]).slice(0, 6);
  const interviewFocusIds = uniqueStrings([
    ...primary.definition.interviewQuestions.map((question) => question.id),
    ...secondaryDefinitions.flatMap((candidate) =>
      candidate.definition.interviewQuestions.map((question) => question.id)
    )
  ]);
  const rationale = [
    primary.matches.length > 0
      ? `Matched category signals: ${primary.matches.join(", ")}.`
      : "No strong category keyword signals were present, so Ralph fell back to a general-product intake."
  ];

  if (secondaryDefinitions.length > 0) {
    rationale.push(
      `Secondary signals: ${secondaryDefinitions
        .map((candidate) => candidate.definition.category)
        .join(", ")}.`
    );
  }

  rationale.push(describeExecutionMode(primary.definition.executionMode));

  return {
    prompt: context.prompt,
    primaryCategory: primary.definition.category,
    secondaryCategories: secondaryDefinitions.map((candidate) => candidate.definition.category),
    executionMode: primary.definition.executionMode,
    confidence,
    rationale,
    semanticAxes,
    systemConcerns,
    proofRegime,
    builderTargets,
    recommendedSurfaces,
    recommendedLanguages,
    correctionMemoryMatches,
    improvementOpportunities,
    suggestedCommands: buildSuggestedCommands(context.prompt, primary.definition.executionMode),
    interviewFocusIds
  };
}

export function buildCategoryInterviewQuestions(
  brief: RalphIdeationBrief
): RalphIdeationQuestionBlueprint[] {
  const categories = [brief.primaryCategory, ...brief.secondaryCategories];

  return uniqueStrings(categories).flatMap((category) =>
    findDefinition(category).interviewQuestions
  );
}

function humanizeCategory(category: RalphSoftwareCategory): string {
  return category.replaceAll("-", " ");
}

function humanizeExecutionMode(executionMode: RalphExecutionMode): string {
  return executionMode.replaceAll("-", " ");
}

export function formatIdeationBrief(brief: RalphIdeationBrief): string {
  const lines = [
    "# Ralph Ideation Brief",
    "",
    `Prompt: ${brief.prompt}`,
    `Primary category: ${humanizeCategory(brief.primaryCategory)}`,
    `Execution mode: ${humanizeExecutionMode(brief.executionMode)}`,
    `Confidence: ${(brief.confidence * 100).toFixed(0)}%`,
    ""
  ];

  if (brief.secondaryCategories.length > 0) {
    lines.push(`Secondary categories: ${brief.secondaryCategories.map(humanizeCategory).join(", ")}`);
    lines.push("");
  }

  lines.push("## Why Ralph Chose This Path");
  lines.push("");
  for (const item of brief.rationale) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Semantic Axes");
  lines.push("");
  for (const item of brief.semanticAxes) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## System Concerns");
  lines.push("");
  for (const item of brief.systemConcerns) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Proof Regime");
  lines.push("");
  for (const item of brief.proofRegime) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Builder Targets");
  lines.push("");
  for (const item of brief.builderTargets) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Recommended Surfaces");
  lines.push("");
  for (const item of brief.recommendedSurfaces) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Recommended Languages");
  lines.push("");
  for (const item of brief.recommendedLanguages) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Idea Improvement Opportunities");
  lines.push("");
  for (const item of brief.improvementOpportunities) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  if (brief.correctionMemoryMatches.length > 0) {
    lines.push("## Correction Memory");
    lines.push("");
    for (const match of brief.correctionMemoryMatches) {
      lines.push(`- ${match.memory.title}: ${match.memory.recommendation}`);
      for (const reason of match.reasons) {
        lines.push(`  reason: ${reason}`);
      }
    }
    lines.push("");
  }

  lines.push("## Suggested Commands");
  lines.push("");
  for (const item of brief.suggestedCommands) {
    lines.push(`- \`${item}\``);
  }
  lines.push("");

  lines.push("## Interview Focus");
  lines.push("");
  for (const item of brief.interviewFocusIds) {
    lines.push(`- ${item}`);
  }

  return lines.join("\n");
}

export function formatArchitectureOutline(
  brief: RalphIdeationBrief,
  questions: RalphIdeationQuestionBlueprint[]
): string {
  const lines = [
    "# Ralph Architecture Outline",
    "",
    `Prompt: ${brief.prompt}`,
    `Primary category: ${humanizeCategory(brief.primaryCategory)}`,
    `Execution mode: ${humanizeExecutionMode(brief.executionMode)}`,
    ""
  ];

  lines.push("## First Viable Shape");
  lines.push("");
  switch (brief.executionMode) {
    case "interactive-runtime":
      lines.push(
        "- Drive the idea toward a proof-clean semantic draft, then materialize the first interactive local runtime package."
      );
      break;
    case "semantic-runtime-plan":
      lines.push(
        "- Drive the idea toward a semantic draft and a builder/runtime plan before promising execution on the current substrate."
      );
      break;
    case "architecture-spec":
      lines.push(
        "- Treat this as architecture-first work: define subsystem boundaries, proof fixtures, and the first narrow implementation wedge before runtime claims."
      );
      break;
  }
  lines.push("");

  lines.push("## Core Subsystems");
  lines.push("");
  for (const item of brief.builderTargets) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Semantic Axes");
  lines.push("");
  for (const item of brief.semanticAxes) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Proof Strategy");
  lines.push("");
  for (const item of brief.proofRegime) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## System Concerns");
  lines.push("");
  for (const item of brief.systemConcerns) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Recommended Surfaces");
  lines.push("");
  for (const item of brief.recommendedSurfaces) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Recommended Languages");
  lines.push("");
  for (const item of brief.recommendedLanguages) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Open Questions");
  lines.push("");
  for (const question of questions) {
    lines.push(`- ${question.prompt}`);
  }

  return lines.join("\n");
}
