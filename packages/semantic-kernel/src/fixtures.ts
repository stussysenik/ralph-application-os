import type { SemanticWorldModel } from "./types.js";

function benchmarkProvenance(sourceRef: string) {
  return [
    {
      sourceType: "benchmark" as const,
      sourceRef,
      confidence: 1
    }
  ];
}

/**
 * These fixtures define the first application families the platform must
 * understand. They serve three roles at once: examples, tests, and the
 * first visible product demo.
 */
export const rampLikeSpendModel: SemanticWorldModel = {
  name: "ramp-like-spend-controls",
  version: "0.1.0",
  domain: "approvals-and-payments",
  concepts: [
    {
      name: "approval-threshold",
      description: "Approval routing changes based on invoice amount.",
      aliases: ["spend-control", "threshold-policy"],
      provenance: benchmarkProvenance("ramp-benchmark")
    },
    {
      name: "vendor-ledger",
      description: "Operators need a view of invoices and payments by vendor.",
      aliases: ["payables-ledger"],
      provenance: benchmarkProvenance("ramp-benchmark")
    }
  ],
  entities: [
    {
      name: "Approval",
      description: "Captures approver decisions on invoices.",
      attributes: [
        { name: "actorRole", type: "string", required: true },
        { name: "decision", type: "string", required: true },
        { name: "decidedAt", type: "datetime", required: false }
      ]
    },
    {
      name: "Invoice",
      description: "Invoice submitted by a vendor.",
      attributes: [
        { name: "amount", type: "number", required: true },
        { name: "currency", type: "string", required: true },
        { name: "invoiceNumber", type: "string", required: true },
        { name: "status", type: "string", required: true },
        { name: "submittedAt", type: "datetime", required: false }
      ]
    },
    {
      name: "Organization",
      description: "Operating company that owns the invoice workflow.",
      attributes: [{ name: "name", type: "string", required: true }]
    },
    {
      name: "Payment",
      description: "Scheduled or executed payment against an invoice.",
      attributes: [
        { name: "scheduledFor", type: "date", required: false },
        { name: "status", type: "string", required: true }
      ]
    },
    {
      name: "Vendor",
      description: "External payee submitting invoices.",
      attributes: [
        { name: "name", type: "string", required: true },
        { name: "riskTier", type: "string", required: false }
      ]
    }
  ],
  relations: [
    {
      name: "belongsTo",
      from: "Invoice",
      to: "Vendor",
      cardinality: "one-to-many",
      description: "Each invoice belongs to a vendor."
    },
    {
      name: "belongsTo",
      from: "Vendor",
      to: "Organization",
      cardinality: "one-to-many",
      description: "Vendors are tracked within an organization."
    },
    {
      name: "decides",
      from: "Approval",
      to: "Invoice",
      cardinality: "one-to-many",
      description: "Approvals attach to a single invoice."
    },
    {
      name: "settles",
      from: "Payment",
      to: "Invoice",
      cardinality: "one-to-one",
      description: "A payment settles one invoice."
    }
  ],
  states: [
    { name: "draft", entity: "Invoice", initial: true },
    { name: "submitted", entity: "Invoice" },
    { name: "manager-approved", entity: "Invoice" },
    { name: "finance-approved", entity: "Invoice" },
    { name: "scheduled", entity: "Invoice" },
    { name: "paid", entity: "Invoice", terminal: true },
    { name: "rejected", entity: "Invoice", terminal: true }
  ],
  actions: [
    {
      name: "submitInvoice",
      entity: "Invoice",
      from: "draft",
      to: "submitted",
      actors: ["submitter"]
    },
    {
      name: "managerApprove",
      entity: "Invoice",
      from: "submitted",
      to: "manager-approved",
      actors: ["manager-approver"]
    },
    {
      name: "financeApprove",
      entity: "Invoice",
      from: "manager-approved",
      to: "finance-approved",
      actors: ["finance-approver"]
    },
    {
      name: "rejectInvoice",
      entity: "Invoice",
      from: "submitted",
      to: "rejected",
      actors: ["manager-approver", "finance-approver"]
    },
    {
      name: "schedulePayment",
      entity: "Invoice",
      from: "finance-approved",
      to: "scheduled",
      actors: ["finance-operator"]
    },
    {
      name: "markPaid",
      entity: "Invoice",
      from: "scheduled",
      to: "paid",
      actors: ["finance-operator"]
    }
  ],
  policies: [
    {
      name: "manager-threshold",
      appliesTo: "Invoice",
      effect: "require-approval",
      actors: ["manager-approver"],
      rules: [{ field: "amount", operator: "lte", value: 5000 }],
      description: "Managers can approve lower-value invoices."
    },
    {
      name: "finance-threshold",
      appliesTo: "Invoice",
      effect: "require-approval",
      actors: ["finance-approver"],
      rules: [{ field: "amount", operator: "gte", value: 5000 }],
      description: "Finance must approve larger invoices."
    }
  ],
  views: [
    {
      name: "approvalQueue",
      entity: "Invoice",
      kind: "table",
      columns: ["amount", "currency", "invoiceNumber", "status"]
    },
    {
      name: "vendorLedger",
      entity: "Invoice",
      kind: "dashboard",
      columns: ["amount", "invoiceNumber", "status", "submittedAt"]
    },
    {
      name: "paymentSchedule",
      entity: "Payment",
      kind: "table",
      columns: ["scheduledFor", "status"]
    }
  ],
  effects: [
    {
      name: "notifyApprovers",
      kind: "notification",
      trigger: "submitInvoice",
      description: "Notify the next approval stage when an invoice is submitted."
    }
  ],
  invariants: [
    {
      name: "paid-requires-scheduled",
      kind: "action-state-chain",
      action: "markPaid",
      requiredFrom: "scheduled",
      requiredTo: "paid",
      description: "Invoices must be scheduled before they are paid."
    },
    {
      name: "finance-threshold-present",
      kind: "policy-threshold",
      policy: "finance-threshold",
      field: "amount",
      operator: "gte",
      value: 5000,
      requiredActor: "finance-approver",
      description: "Large invoices must route through finance."
    }
  ],
  openQuestions: [],
  provenance: benchmarkProvenance("ramp-benchmark")
};

export const linearLikeIssueModel: SemanticWorldModel = {
  name: "linear-like-issue-tracker",
  version: "0.1.0",
  domain: "issue-tracking",
  concepts: [
    {
      name: "cycle-planning",
      description: "Issues are grouped into time-boxed cycles.",
      aliases: ["iteration", "sprint"],
      provenance: benchmarkProvenance("linear-benchmark")
    }
  ],
  entities: [
    {
      name: "Cycle",
      description: "Time box for planned work.",
      attributes: [
        { name: "name", type: "string", required: true },
        { name: "startsAt", type: "date", required: true }
      ]
    },
    {
      name: "Issue",
      description: "A tracked unit of work.",
      attributes: [
        { name: "identifier", type: "string", required: true },
        { name: "priority", type: "string", required: true },
        { name: "status", type: "string", required: true },
        { name: "title", type: "string", required: true }
      ]
    },
    {
      name: "Project",
      description: "Container for issues.",
      attributes: [{ name: "name", type: "string", required: true }]
    },
    {
      name: "Team",
      description: "Operational owner of projects and issues.",
      attributes: [{ name: "name", type: "string", required: true }]
    }
  ],
  relations: [
    { name: "belongsTo", from: "Issue", to: "Project", cardinality: "one-to-many" },
    { name: "belongsTo", from: "Project", to: "Team", cardinality: "one-to-many" },
    { name: "plannedIn", from: "Issue", to: "Cycle", cardinality: "one-to-many" }
  ],
  states: [
    { name: "backlog", entity: "Issue", initial: true },
    { name: "todo", entity: "Issue" },
    { name: "in-progress", entity: "Issue" },
    { name: "done", entity: "Issue", terminal: true },
    { name: "canceled", entity: "Issue", terminal: true }
  ],
  actions: [
    { name: "triageIssue", entity: "Issue", from: "backlog", to: "todo", actors: ["triage-manager"] },
    { name: "startIssue", entity: "Issue", from: "todo", to: "in-progress", actors: ["engineer"] },
    { name: "completeIssue", entity: "Issue", from: "in-progress", to: "done", actors: ["engineer"] }
  ],
  policies: [
    {
      name: "triage-ownership",
      appliesTo: "Issue",
      effect: "allow",
      actors: ["triage-manager"],
      rules: [{ field: "status", operator: "eq", value: "backlog" }]
    }
  ],
  views: [
    {
      name: "issueBoard",
      entity: "Issue",
      kind: "board",
      columns: ["identifier", "priority", "status", "title"]
    },
    {
      name: "cycleOverview",
      entity: "Issue",
      kind: "table",
      columns: ["identifier", "status", "title"]
    }
  ],
  effects: [
    {
      name: "notifyCycleOwners",
      kind: "notification",
      trigger: "completeIssue"
    }
  ],
  invariants: [
    {
      name: "completion-requires-progress",
      kind: "action-state-chain",
      action: "completeIssue",
      requiredFrom: "in-progress",
      requiredTo: "done"
    }
  ],
  openQuestions: [],
  provenance: benchmarkProvenance("linear-benchmark")
};

export const notionLikeWorkspaceModel: SemanticWorldModel = {
  name: "notion-like-workspace",
  version: "0.1.0",
  domain: "knowledge-and-structure",
  concepts: [
    {
      name: "structured-content",
      description: "Documents and collections share a composable data substrate.",
      aliases: ["blocks", "workspace-graph"],
      provenance: benchmarkProvenance("notion-benchmark")
    }
  ],
  entities: [
    {
      name: "Collection",
      description: "Structured table-like container.",
      attributes: [
        { name: "name", type: "string", required: true },
        { name: "status", type: "string", required: true }
      ]
    },
    {
      name: "Document",
      description: "A rich page inside the workspace.",
      attributes: [
        { name: "slug", type: "string", required: true },
        { name: "status", type: "string", required: true },
        { name: "title", type: "string", required: true }
      ]
    },
    {
      name: "Member",
      description: "Workspace participant.",
      attributes: [
        { name: "displayName", type: "string", required: true },
        { name: "role", type: "string", required: true }
      ]
    },
    {
      name: "Workspace",
      description: "Top-level space for documents and collections.",
      attributes: [{ name: "name", type: "string", required: true }]
    }
  ],
  relations: [
    { name: "contains", from: "Workspace", to: "Document", cardinality: "one-to-many" },
    { name: "contains", from: "Workspace", to: "Collection", cardinality: "one-to-many" },
    { name: "memberOf", from: "Member", to: "Workspace", cardinality: "one-to-many" }
  ],
  states: [
    { name: "draft", entity: "Document", initial: true },
    { name: "published", entity: "Document" },
    { name: "archived", entity: "Document", terminal: true }
  ],
  actions: [
    { name: "publishDocument", entity: "Document", from: "draft", to: "published", actors: ["editor"] },
    { name: "archiveDocument", entity: "Document", from: "published", to: "archived", actors: ["editor"] }
  ],
  policies: [
    {
      name: "workspace-editor",
      appliesTo: "Document",
      effect: "allow",
      actors: ["editor"],
      rules: [{ field: "status", operator: "in", value: "draft,published" }]
    }
  ],
  views: [
    {
      name: "workspaceHome",
      entity: "Document",
      kind: "dashboard",
      columns: ["slug", "status", "title"]
    },
    {
      name: "collectionTable",
      entity: "Collection",
      kind: "table",
      columns: ["name", "status"]
    }
  ],
  effects: [
    {
      name: "indexPublishedDocument",
      kind: "calculation",
      trigger: "publishDocument"
    }
  ],
  invariants: [
    {
      name: "archive-requires-publish",
      kind: "action-state-chain",
      action: "archiveDocument",
      requiredFrom: "published",
      requiredTo: "archived"
    }
  ],
  openQuestions: [],
  provenance: benchmarkProvenance("notion-benchmark")
};

export const screenshotStudioModel: SemanticWorldModel = {
  name: "screenshot-studio",
  version: "0.1.0",
  domain: "capture-annotation-and-sharing",
  concepts: [
    {
      name: "annotated-capture",
      description:
        "A screenshot can move from raw capture to annotated asset and then to shareable output.",
      aliases: ["edited-capture", "marked-up-shot"],
      provenance: benchmarkProvenance("screenshot-studio-benchmark")
    }
  ],
  entities: [
    {
      name: "Workspace",
      description: "Top-level owner of captures and collections.",
      attributes: [{ name: "name", type: "string", required: true }]
    },
    {
      name: "Capture",
      description: "A screenshot or recording frame asset.",
      attributes: [
        { name: "assetUrl", type: "string", required: true },
        { name: "capturedAt", type: "datetime", required: true },
        { name: "status", type: "string", required: true },
        { name: "title", type: "string", required: true }
      ]
    },
    {
      name: "Annotation",
      description: "Markup region applied to a capture.",
      attributes: [
        { name: "kind", type: "string", required: true },
        { name: "payload", type: "json", required: true }
      ]
    },
    {
      name: "Collection",
      description: "A named set of captures.",
      attributes: [
        { name: "name", type: "string", required: true },
        { name: "status", type: "string", required: true }
      ]
    },
    {
      name: "ShareLink",
      description: "Public or private shareable link for a capture.",
      attributes: [
        { name: "slug", type: "string", required: true },
        { name: "status", type: "string", required: true }
      ]
    }
  ],
  relations: [
    { name: "contains", from: "Workspace", to: "Capture", cardinality: "one-to-many" },
    { name: "groups", from: "Collection", to: "Capture", cardinality: "one-to-many" },
    { name: "marksUp", from: "Annotation", to: "Capture", cardinality: "one-to-many" },
    { name: "publishes", from: "ShareLink", to: "Capture", cardinality: "one-to-one" }
  ],
  states: [
    { name: "raw", entity: "Capture", initial: true },
    { name: "annotated", entity: "Capture" },
    { name: "share-ready", entity: "Capture" },
    { name: "archived", entity: "Capture", terminal: true }
  ],
  actions: [
    {
      name: "annotateCapture",
      entity: "Capture",
      from: "raw",
      to: "annotated",
      actors: ["editor"]
    },
    {
      name: "prepareShare",
      entity: "Capture",
      from: "annotated",
      to: "share-ready",
      actors: ["editor"]
    },
    {
      name: "archiveCapture",
      entity: "Capture",
      from: "share-ready",
      to: "archived",
      actors: ["editor"]
    }
  ],
  policies: [
    {
      name: "editor-can-publish",
      appliesTo: "Capture",
      effect: "allow",
      actors: ["editor"],
      rules: [{ field: "status", operator: "eq", value: "share-ready" }]
    }
  ],
  views: [
    {
      name: "captureLibrary",
      entity: "Capture",
      kind: "table",
      columns: ["assetUrl", "capturedAt", "status", "title"]
    },
    {
      name: "collectionBoard",
      entity: "Collection",
      kind: "board",
      columns: ["name", "status"]
    },
    {
      name: "shareDashboard",
      entity: "ShareLink",
      kind: "table",
      columns: ["slug", "status"]
    }
  ],
  effects: [
    {
      name: "generateSharePreview",
      kind: "calculation",
      trigger: "prepareShare"
    }
  ],
  invariants: [
    {
      name: "sharing-requires-annotation",
      kind: "action-state-chain",
      action: "prepareShare",
      requiredFrom: "annotated",
      requiredTo: "share-ready"
    },
    {
      name: "publish-policy-exists",
      kind: "policy-threshold",
      policy: "editor-can-publish",
      field: "status",
      operator: "eq",
      value: "share-ready",
      requiredActor: "editor"
    }
  ],
  openQuestions: [
    {
      id: "sq-1",
      prompt:
        "Should video snippets and still screenshots share the same Capture entity or split later?",
      status: "open"
    }
  ],
  provenance: benchmarkProvenance("screenshot-studio-benchmark")
};

export const benchmarkModels = [
  rampLikeSpendModel,
  linearLikeIssueModel,
  notionLikeWorkspaceModel,
  screenshotStudioModel
];
