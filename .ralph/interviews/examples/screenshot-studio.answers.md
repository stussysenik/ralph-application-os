# Ralph Interview Answers

Prompt: Build a screenshot studio for marketers to capture pages, annotate them, and share results.

## primary-user-and-outcome
Category: domain
Priority: high (blocking)
Question: Who is the primary user, and what is the one outcome they must achieve reliably?
Why: The product needs a concrete operator and success condition before modeling.
Answer:
- Marketing operators publish polished annotated screenshots quickly.

## core-records
Category: data
Priority: high (blocking)
Question: What are the 3-7 core records or entities this system must track?
Why: The data model is the enabling core value, so the first records must be explicit.
Answer:
- Workspace: name
- Capture: title, assetUrl, status, capturedAt
- Annotation: kind, payload
- Collection: name, status
- ShareLink: slug, status

## core-workflow
Category: workflow
Priority: high (blocking)
Question: What is the critical lifecycle or workflow from start to finish?
Why: The platform needs the main state transitions before it can build or prove behavior.
Answer:
- Capture: raw -> annotated -> share-ready -> archived
- ShareLink: draft -> live -> expired

## permissions-and-audit
Category: policy
Priority: high (blocking)
Question: What permissions, approvals, or audit requirements are non-negotiable?
Why: Policies and accountability often change the semantic shape of the system.
Answer:
- Editor can annotate and prepare captures for sharing.
- Admin can manage share links and archive captures.
- All share events need an audit trail.

## target-surface
Category: interface
Priority: high (blocking)
Question: What should the first implementation target: web app, CLI, API, worker, mobile, desktop, or a mix?
Why: Target surface affects builders, runtime assumptions, and proof flows.
Answer:
- web

## external-integrations
Category: integration
Priority: medium
Question: Which external systems, data sources, or export paths does the first version need?
Why: Effects and integrations shape builders and proof obligations.
Answer:
- Browser extension import
- Slack export

## language-constraints
Category: implementation
Priority: medium
Question: Do you have hard language, framework, or runtime constraints, or should the platform choose?
Why: Language choices are optional implementation constraints, not semantic source of truth.
Answer:
- Platform chooses.
