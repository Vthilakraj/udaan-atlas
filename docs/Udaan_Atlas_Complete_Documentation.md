# Udaan Atlas Project Documentation

Technical report developer guide and user manual

Version 1.0 | 14 November 2026 | Project owner Vthilakraj

Repository: https://github.com/Vthilakraj/udaan-atlas

Problem statement: SIH26135 from the Government of Maharashtra

This document describes the implemented Udaan Atlas prototype for tracking skill-training outcomes over time. It is written for student reviewers, programme teams, developers, and deployment operators. It explains the product, requirements, user journeys, architecture, database, rules, API, installation, testing, security boundaries, deployment, and future work. The public browser demonstration and the private server are distinct operating modes. The project is an independent prototype, not an official government service.

## 1 Project overview

### Abstract

Udaan Atlas connects training completion with a learner's later employment, self-employment, income, skill needs, and support. Its central record is an Outcome Passport: a chronological account of training, reported outcomes, claim-specific evidence, and follow-up activity. A programme team can identify people needing a check-in and inspect the reasons for that priority. An employer can review outcomes linked to its own organization, and a learner can submit an optional update.

The implementation includes a colorful React and TypeScript interface, shared validation and business rules, an interactive browser demonstration, and a private Express and SQLite backend. The demonstration uses fictional records and browser storage. The private server uses authenticated accounts, scoped reads, action permissions, transaction-backed persistence, and revision checks. It does not assume access to employment databases or messaging providers.

### Problem background

SIH26135 concerns incomplete information about employment outcomes, skill gaps, and the effects of skilling initiatives. Training records can show enrollment, attendance, assessment, and certification while later livelihood information remains fragmented. People may change contact details, employers may report inconsistently, and programmes may use different identifiers or definitions. Programme decisions then lack a reliable picture of what happened after training.

Udaan Atlas responds with a continuing, consent-led record. It separates missing updates from unemployment and separates reported employment from employer confirmation. It also makes a practical connection between a recorded skill gap and a support task. These distinctions help a reviewer understand the quality and limits of the available evidence.

### Objectives

The objectives are to maintain consent-based learner records, follow outcomes across scheduled milestones, preserve the source of employment evidence, explain support priorities, compare recorded skills with employer requirements, and provide contextual programme analytics. The application should remain usable on desktop and phone layouts and should be reproducible from the source repository without a paid API.

## 2 Scope and requirement mapping

### Implemented capabilities

| ID | Requirement | Working implementation |
| --- | --- | --- |
| FR01 | Consent-based learner records | Enrollment requires consent and creates a dated passport. |
| FR02 | Continuing outcome tracking | Dated employment, livelihood, income, role, notes, and skill needs. |
| FR03 | Scheduled follow-up | Automatic 30, 90, 180, and 365 day milestones plus support tasks. |
| FR04 | Assisted collection | Copyable optional check-in drafts and assisted update forms. |
| FR05 | Evidence provenance | Employer confirmation, team review, and mismatch history for an exact outcome. |
| FR06 | Skill-gap support | Case-insensitive skill comparison and visible missing requirements. |
| FR07 | Programme analytics | Course and district filters; provider, cohort, and demographic summaries. |
| FR08 | Learner participation | Learner view for updates, skills, opportunities, and consent controls. |
| FR09 | Employer participation | Bound employer accounts and employer-entered opportunities. |
| FR10 | Data portability | Impact CSV, workspace JSON, and validated browser-demo restore. |
| FR11 | Private access | Server sessions and programme-team, employer, and learner permissions. |
| FR12 | Safe concurrent changes | Workspace revision check and a conflict response before overwriting. |

### Current boundaries

Automatic milestone creation is implemented. Unattended external messaging is not. Copying a check-in prepares text for staff; it does not send an SMS, email, or message. Employer confirmation records evidence from a linked account; institutional identity has not been independently validated by a government service.

The current private backend is one programme workspace, not a multi-tenant government platform. It uses a revisioned JSON state row in SQLite for an inspectable prototype. Account recovery, password rotation, account deletion, normalized large-scale storage, delivery queues, and government integrations remain future work.

## 3 Operating modes and users

### Browser demonstration

The browser demo begins with 48 fictional learners and illustrative courses, providers, employers, and opportunities. It stores edits under udaan-atlas:v1 in local storage. The View as control simulates programme-team, employer, and learner experiences. This switch is a demonstration tool, not authentication. A person with access to the browser can inspect the demo's stored data.

The demo is suitable for a public portfolio, a hackathon presentation, or interface evaluation with fictional records. Real personal information should not be entered there. Changing origin, browser profile, or device gives a separate local workspace. Export before clearing data if the edits should be kept.

### Private account roles

| Capability | Programme team | Employer | Learner |
| --- | --- | --- | --- |
| Read learner records | All workspace records | Consenting learners with linked outcomes | Own consenting record |
| Enroll a learner | Yes | No | No |
| Record an outcome | Yes | No | Own record |
| Record a review | Team review | Linked employer outcomes | No |
| Schedule support | Yes | No | No |
| Withdraw consent | Yes | No | Own record |
| Add employer organization | Yes | No | No |
| Add opportunity | Any existing employer | Own employer | No |
| Provision accounts | Yes | No | No |

An employer response excludes learner email addresses and baseline income, excludes follow-up tasks, and includes only outcomes linked to that employer. Other role-scoped records are filtered to permitted learner IDs. Shared catalog information, such as courses, providers, jobs, and employers, is still part of the workspace. The server, rather than a client-selected role, determines the authenticated actor.

## 4 Product modules and user journeys

### The big picture

The overview shows consenting learners, the share currently in work, employer-confirmed work outcomes, and due follow-up milestones. Course charts compare training completion counts with current work outcomes. The journey chart keeps each outcome stage visible, including No update. A support panel lists high-priority learners with reasons; the skill bridge panel surfaces reported gaps.

District and course controls define the selected analytical view. The Impact report adds metric explanations and provider, training-cohort, and demographic summaries. Counts are descriptive and depend on what has been reported. They are not a causal evaluation of the training programme.

### Learner passports

Open Learner passports to search by name, passport ID, district, or course and filter by latest status. Rows show training context, latest outcome, evidence, income, and update date. The table paginates eight records at a time. A job-match filter can narrow the view to people with at least a 50 percent skills match for a selected listed role.

Opening a passport shows training, outcome history, evidence labels, strengths, a best-matching opportunity, and an explainable support score. Programme staff can record an update or schedule support. Learners can update their own record or withdraw consent. Employer actions are confined to the linked evidence workflow.

### Follow up studio

The studio separates due, upcoming, and completed milestones. Due includes incomplete milestones with a due date on or before today. The queue is sorted by earlier due dates and displays at most the earliest 18 matching milestones. Each card shows the learner, milestone, date, priority score, and reasons.

Record check-in opens an outcome form linked to that milestone. Saving a valid outcome completes the specifically selected follow-up. An ordinary passport update without a follow-up ID does not silently complete every overdue milestone. Staff can copy an optional check-in draft or add a dated support task. No provider delivery occurs in the current application.

### Evidence desk

The evidence desk displays latest employer-linked outcomes. Filters show records needing attention, employer-confirmed records, or all relevant records. A reviewer sees the reported role, monthly income, date, notes, and available history before recording a verdict and evidence note.

Programme-team actions are labeled Programme review and displayed as Team reviewed when confirmed. Employer actions are labeled Employer and can yield Employer confirmed. A mismatch is shown as Needs review. A later review event determines the current label for that same claim; older events remain in the evidence history.

### Skill radar and learner view

Skill radar compares each learner's recorded skills with requirements in employer-entered opportunities. It lists exact missing skills, indicative pay ranges, and the number of learners meeting the selected match threshold. Programme staff and employers can add opportunities within their permissions. A match is a checklist result and does not predict hiring success.

My next chapter shows the selected learner's passport summary, reported status, evidence, income, strengths, and a possible skill bridge. A learner can submit an optional update. Programme-team previewing of a learner remains a staff action; using the preview does not turn staff into an authenticated learner.

## 5 Technology and architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Interface | React 19 and TypeScript | Views, dialogs, forms, and application state. |
| Charts and design | Recharts, CSS, Lucide, original SVG | Charts, responsive layouts, icons, and artwork. |
| Validation | Zod 4 | Record shapes and action payload contracts. |
| Shared domain | TypeScript helpers | Permissions, state transitions, scoring, and metrics. |
| Private API | Express 5 on Node 24 | Sessions, scoped requests, and persistence operations. |
| Database | Built-in Node SQLite support | Workspace, users, and session records. |
| Build and execution | Vite 7 and tsx | Frontend bundles and server TypeScript execution. |
| Verification | Vitest, Supertest, Playwright | Domain, API, and Chromium workflow tests. |

Node 24 or later is required by the repository. The lockfile records resolved dependency versions. npm ci reproduces those resolutions; package.json alone contains version ranges rather than the complete installation state.

```text
React views and dialogs
          |
Workspace adapter in src/store.ts
          |
          +-- Demo mode -- shared rules -- browser local storage
          |
          +-- API mode -- same origin HTTP -- Express
                                             |
                                      session and role checks
                                             |
                                      shared domain rules
                                             |
                                      SQLite transaction
```

The main interface obtains data through the workspace adapter. Demo actions run the shared transition function locally. API actions send the action and expected workspace revision to the server. The server derives the actor from its session, applies the same domain rules, persists the result, and returns only the actor's permitted state.

Source responsibilities are separated into src for the interface and adapter, shared for types and rules, server for private operations, tests for verification, and docs for the SIH design note. Vite selects the data mode at build time. API mode calls /api on the same origin rather than embedding a secret or arbitrary third-party backend URL in the client.

## 6 Domain data design

### Workspace collections

| Collection | Important fields | Purpose |
| --- | --- | --- |
| learners | identity, training, consent, skills, outcomes | A learner's programme record and timeline. |
| followups | learnerId, due, milestone, completed, note | Scheduled and assisted contact tasks. |
| evidence | learnerId, outcomeId, source, verdict, actor, at | Claim-specific review history. |
| courses | id, title, sector, skills, color | Training catalog. |
| employers | id, name, color | Organizations available for links and accounts. |
| jobs | employerId, title, district, skills, minPay, maxPay | Employer-entered role requirements. |
| providers | id, name | Training provider catalog. |
| audit | id, at, actor, action, learnerId | Operational transition trail. |

The root state also contains version fixed to 1 and a nonnegative integer revision. Each successful domain action increments revision. IDs are strings, generally limited to 100 characters by shared validation. New records use generated identifiers.

### Learner record

| Field group | Fields | Meaning |
| --- | --- | --- |
| Identification | id, name, email | Programme identity and contact information. |
| Training context | district, courseId, providerId, trainedOn | Location and completed training. |
| Descriptive grouping | gender | Woman, Man, Non-binary, or Prefer not to say. |
| Financial baseline | baselineIncome | Monthly pre-training income or null when unknown. |
| Consent and strengths | consent, skills | Permission to track outcomes and recorded skills. |
| Timeline and presentation | outcomes, color | Dated outcome array and avatar display color. |

An outcome contains id, date, status, income, employerId, role, note, skillsNeeded, and source. Status is Employed, Self-employed, Apprenticeship, Seeking work, Left job, or Further study. Source is Learner or Programme team. Notes are limited to 2,000 characters. Income is a bounded nonnegative number; non-working outcomes must use zero. The date must fall between training completion and today when an outcome is recorded.

### Follow up and evidence records

A follow-up contains id, learnerId, due, milestone, completed, and note. Enrollment creates four milestones from the training completion date. Staff can add a Support check-in. A selected follow-up can only be completed through an outcome action for the same learner.

Evidence contains id, learnerId, outcomeId, verdict, note, at, actor, and source. Verdict is Confirmed or Mismatch. Source is Employer or Programme review. A learner cannot review their own claim, and an employer cannot review an outcome for another employer. Notes must contain at least five characters for a review action.

### Backup validation

The demo validates the root format, record fields, supported version, and configured collection limits. It rejects duplicate learner IDs, follow-ups without a matching learner, and evidence without a matching learner outcome. The parser limits raw backup text to 15,000,000 characters, while the upload handler also checks file byte size. This is structural validation, not an exhaustive integrity or authenticity proof for every possible relationship.

| Collection | Maximum accepted by the state schema |
| --- | --- |
| Learners | 10,000 |
| Follow-ups | 50,000 |
| Evidence events | 50,000 |
| Courses | 200 |
| Employers | 1,000 |
| Opportunities | 5,000 |
| Providers | 1,000 |
| Audit events | 10,000 |

These are validation ceilings, not measured performance guarantees. The current interface and JSON-row server should be benchmarked and redesigned before assuming operation near those limits.

## 7 Private database design

The private backend initializes three SQLite tables. Foreign keys are enabled and write-ahead logging is requested. The workspace table holds one JSON document for the whole programme state. Domain entities are logical records inside that document rather than separate SQL tables.

| Table | Columns | Relationship |
| --- | --- | --- |
| workspace | id primary key constrained to 1, payload text | Single revisioned programme document. |
| users | id, unique email, name, role, binding, hash, salt | Role and optional employer or learner binding. |
| sessions | token_hash, user_id, expires | user_id references users with delete cascade. |

The actor's binding maps an employer account to an employer ID or a learner account to a learner ID. Programme-team accounts have role admin. Password hashes and session-token hashes belong to the private database and are never part of a workspace JSON export.

```text
users.id  -------- one to many -------- sessions.user_id
   |
   +-- learner binding -------- learner ID inside workspace.payload
   +-- employer binding ------- employer ID inside workspace.payload

workspace.payload contains learners, outcomes, followups, and evidence
evidence.outcomeId refers to one outcome in one learner timeline
```

For an action, the server starts BEGIN IMMEDIATE, reads the workspace, checks expectedRevision, applies a permitted transition, updates the JSON row, and commits. A revision mismatch rolls back and returns 409 with the latest permitted state. This avoids a silent stale overwrite; it does not merge concurrent edits automatically. Errors roll back the active transaction.

## 8 Business rules and algorithms

### Outcome and evidence selection

latestOutcome selects the latest dated outcome on or before the chosen as-of day. If dates are equal, the later array entry wins. latestEvidence uses the last appended evidence event for that outcome ID. A new outcome ID has no evidence unless a reviewer records a new event for it.

The evidence label is No update when there is no outcome, Self-reported when no evidence event exists, Needs review for a latest mismatch, Employer confirmed for a confirmed employer event, and Team reviewed for a confirmed programme event. A programme review can supersede the displayed label of an older employer event while preserving that event in the history.

### Support priority

| Signal | Score contribution |
| --- | --- |
| No recorded outcome | 35 |
| Latest outcome is Left job | 40 |
| Latest outcome is Seeking work | 22 |
| Incomplete milestone due today or earlier | 15 plus one per five days overdue, capped at 35 |
| Latest update older than 90 days | 20 |
| Reported missing skills | Five per skill, capped at 15 |
| Current evidence has a mismatch | 20 |

The score is capped at 100. Act now starts at 65, Check in covers 30 to 64, and lower scores are On track. Withdrawn consent produces a paused result. When more than one milestone is due, the overdue contribution uses the greatest number of days overdue. The reasons are shown alongside the score.

These are prototype rules, not a statistically validated prediction. Gender, district, and baseline income do not affect the score. It is intended to help staff choose a supportive conversation, not determine eligibility, rank personal worth, or automate an adverse decision.

### Skill matching

For each role, required skills are compared with the learner's skills using case-insensitive exact text matching. Missing skills are listed explicitly. The match percentage is the rounded proportion of required skills present. A role with no required skills yields 100 percent under the helper's current definition, so operators should enter meaningful requirements. Opportunities are sorted by match percentage; different wording for the same skill is not automatically normalized.

### Analytical definitions

| Metric | Definition and denominator |
| --- | --- |
| Consenting learners | Records with active consent in the chosen view. |
| Currently in work | Latest status is Employed, Self-employed, or Apprenticeship. |
| In-work percentage | Current in-work count divided by consenting learners, rounded. |
| No update | Consenting learners with no eligible outcome. |
| Employer-confirmed work | Current work outcomes whose latest evidence is Employer confirmed. |
| Recent coverage | Learners whose latest outcome is at most 90 days old divided by consenting learners. |
| Median income gain | Median positive current monthly income minus known baseline, among people in work. |
| 90 day work continuity | Current work among learners with a recorded work outcome at least 90 days ago. |
| Due conversations | Incomplete milestones due today or earlier, not unique people. |

Zero baseline income is valid for the paired income calculation; unknown baseline is excluded. The report shows the number of paired records. Work continuity does not prove uninterrupted employment or retention at the same employer. Descriptive change does not establish that the training caused the change. Empty groups must be interpreted with their displayed denominator, not as evidence of programme success or failure.

## 9 Private API reference

All application endpoints use the /api prefix. Authenticated endpoints use the atlas_session cookie. JSON action responses return a state already scoped to the authenticated actor. Mutating requests must have an Origin header equal to the configured public origin; the backend is intended for same-origin use.

| Method and path | Access | Result |
| --- | --- | --- |
| GET /api/health | Public | Basic status response. |
| POST /api/login | Valid email and password | Starts a session and returns the actor. |
| POST /api/logout | Authenticated | Deletes the session and clears its cookie. |
| GET /api/state | Authenticated | Actor and permitted workspace state. |
| POST /api/actions | Authenticated and action-authorized | Applies a domain transition with revision checking. |
| POST /api/users | Programme team | Creates an account with a valid role binding. |

A login body contains email and password. Account creation contains name, email, password, role, and an optional binding. A learner binding must identify a consenting learner; an employer binding must identify an existing employer. Passwords for newly created accounts must be at least 12 characters.

### Action envelope

```json
{
  "expectedRevision": 4,
  "action": {
    "type": "schedule",
    "learnerId": "UA-1001",
    "due": "2026-12-01",
    "note": "Discuss inverter diagnostics training"
  }
}
```

The revision, learner ID, and date above are illustrative. Use the revision and identifiers returned by the current workspace, and choose a valid date when making a real request.

| Action type | Important payload fields | Permission rule |
| --- | --- | --- |
| addLearner | learner record without generated fields | Programme team; consent required. |
| recordOutcome | learnerId, outcome, optional followupId | Programme team or the same learner. |
| verify | learnerId, outcomeId, verdict, note | Programme team or linked employer. |
| schedule | learnerId, due, note | Programme team. |
| withdraw | learnerId | Programme team or the same learner. |
| addJob | opportunity fields without generated ID | Programme team or that employer. |
| addEmployer | organization name | Programme team. |

Dates are validated as calendar keys. Outcome dates cannot precede training or be in the future. A support task cannot be scheduled before today. Employed and apprentice outcomes require an existing employer. Roles and provenance are derived from the actor rather than trusted from arbitrary client fields.

### Errors and limits

| Status | Meaning in this implementation |
| --- | --- |
| 400 | Invalid request, JSON, required fields, or rejected request processing. |
| 401 | Missing, invalid, or expired login session. |
| 403 | Origin mismatch, role restriction, or disallowed domain transition. |
| 404 | Unknown API route. |
| 409 | Stale workspace revision or an existing account email. |
| 429 | Login attempt rate limit reached. |

The JSON middleware limits request bodies to 512 KB. The generic error handler returns a request error rather than a stack trace. There is no public endpoint that restores an arbitrary browser JSON backup into the private database.

## 10 Installation and configuration

### Local browser demonstration

Install Node 24 and Git, then use the repository lockfile:

```bash
git clone https://github.com/Vthilakraj/udaan-atlas.git
cd udaan-atlas
npm ci
npm run dev
```

Open the Vite URL, normally http://localhost:5173. No login or environment secret is needed for the browser demonstration. Its records are fictional and editable. Use the View as selector to explore the other roles, then reset the sample cohort from Workspace and data if a fresh demonstration is needed.

### Local private server

```bash
cp .env.example .env
npm run dev:full
```

Edit .env before starting. Set a real bootstrap administrator email and a unique password of at least 12 characters. The server rejects the example placeholder. In local development, PUBLIC_ORIGIN should be http://localhost:5173 without a trailing slash. The command starts the API on 4100 and the Vite interface, which proxies /api to that backend.

| Variable | Example or default | Purpose |
| --- | --- | --- |
| PORT | 4100 | Private HTTP server port. |
| PUBLIC_ORIGIN | http://localhost:5173 for local development | Exact allowed browser origin for writes. |
| DATABASE_PATH | ./data/atlas.sqlite | Writable persistent database location. |
| ADMIN_EMAIL | Operator selected | First administrator account if none exists. |
| ADMIN_PASSWORD | Private unique value | Bootstrap credential, never a committed secret. |
| SEED_SAMPLE_DATA | true or false | Fictional learners for a private demo or an empty learner workspace. |
| NODE_ENV | production on an operational host | Requires an HTTPS public origin. |

With sample seeding disabled, the launcher creates no learners, employer organizations, or opportunities. It retains an illustrative course and provider catalog from shared/seed.ts. Replace that catalog with authorized programme values before real data collection. Add employers through Workspace and data, enroll learners, and provision bound accounts there.

The administrator variables bootstrap an account only when the database has no administrator. Changing those variables later does not rotate the stored password. Password recovery and rotation interfaces are not implemented.

## 11 User manual

### Programme team workflow

Start with Add learner. Enter the person's name, email, district, course, provider, training date, baseline income if known, skills, and consent. The saved passport and four follow-up milestones become available immediately. Use the main filters and passport search to find the record.

For a conversation, open a due follow-up and select Record check-in. Choose the current situation, date, and any relevant income, role, employer, missing skills, and notes. Save to append a new outcome and complete that selected milestone. Schedule an additional support check-in when a practical next step is needed.

Open Evidence desk to inspect linked work claims. Staff reviews remain visibly distinct from employer confirmation. For an actual employer confirmation in private mode, create a bound employer account and have its owner sign in. In demo mode, the role selector demonstrates this process on fictional records.

Create an opportunity from Skill radar with role title, district, employer, required skills, and pay range. Explore the missing skills and matching learner view. Open Impact report to inspect definitions and group counts, then download the selected view as CSV.

### Employer and learner workflows

An employer signs in to its own private account and sees only permitted linked learner outcomes. Open a claim, check the reported details against available organizational evidence, choose a verdict, and write a specific note. The application records the account source and timestamp; it does not independently prove the institution's identity.

A learner signs in to their bound account, reviews My next chapter, and optionally shares an update. The learner can inspect strengths, missing role requirements, and current evidence. Withdrawal removes the programme's identifying outcome records and future follow-ups. A login account and a limited training record remain separate; withdrawal is not a complete account-deletion operation.

### Backup and restore

Workspace and data offers JSON export. In demo mode, restore validates the file and asks before replacing the browser workspace. It does not merge versions. The demo's reset action replaces current edits with a fresh fictional cohort after confirmation.

In private mode, workspace export contains only the signed-in actor's permitted programme state. It is not a full database backup and does not include users, password hashes, or sessions. Use an operator-managed SQLite backup for full disaster recovery. CSV exports may contain individual-level information and must be shared only with authorized recipients.

## 12 Testing and verification

The implemented test suite contains eight domain tests, five API integration tests, and four Chromium tests. Both frontend build modes and all 17 tests passed during project verification. GitHub CI completed successfully for the project baseline. These results establish the tested behaviors; they do not constitute a performance benchmark, comprehensive security audit, or certification for operational government use.

| Suite | Coverage |
| --- | --- |
| Domain tests | Outcome counts, claim-specific evidence, permissions, consent withdrawal, milestones, scoring inputs, scoping, and backup rejection. |
| API tests | Login, origin checks, authentication, scoped access, disallowed writes, revision conflicts, employer reviews, logout, and account provisioning. |
| Browser workflow tests | Enrollment, outcome changes, persistence, employer review, learner update, responsive navigation, and viewport bounds. |
| Visual capture test | Desktop and phone screenshots of the main workspace and passport table. |

```bash
npm test
npm run build
npm run build:api
npm run test:ui
```

The browser suite starts and stops a Vite server on port 5178. It uses an installed Chromium executable, defaulting to /usr/bin/chromium. CHROMIUM_PATH can select another compatible executable. The CI configuration selects the Chrome path on its Ubuntu runner. Failure details and screenshots are written to the ignored test-results directory.

Before an operational rollout, add tests for schema migrations, larger cohorts, sustained concurrent writes, rate-limit behavior across infrastructure, account lifecycle operations, proxy configuration, and a tested database restore. These are recommended checks rather than completed claims.

## 13 Deployment

### Static browser demonstration

GitHub Pages, Vercel, and Netlify can serve the browser demonstration. The static build command is npm run build and the output is dist. Relative asset paths support a repository URL such as /udaan-atlas/. Internal views do not require server route rewriting.

For GitHub Pages, set Settings, Pages, Build and deployment, Source to GitHub Actions. Run Publish Udaan Atlas from Actions on main and wait for the deployment jobs to succeed. The address after a successful deployment is https://vthilakraj.github.io/udaan-atlas/. At the documentation check on 14 November 2026, Pages was not enabled, so that address was not presented as a verified live deployment.

The Pages workflow is manual. The CI workflow runs separately on pushes and pull requests. Configuration files for Vercel and Netlify use the same static output; neither runs this project's private backend automatically.

### Private server deployment

```bash
npm ci
npm run build:api
npm start
```

Set NODE_ENV=production, an HTTPS PUBLIC_ORIGIN without a trailing slash, a persistent DATABASE_PATH, and the bootstrap credentials through protected host settings. Serve the interface and API on the same public origin. The process refuses a production HTTP public origin. Terminate HTTPS at an appropriate host or reverse proxy; the Node listener itself is ordinary HTTP.

The multi-stage Dockerfile uses Node 24 Alpine, builds API mode, installs runtime dependencies, and runs as a non-root user. It exposes port 4100 and declares /app/data for persistence. Supply secrets at runtime and mount durable storage. The Dockerfile is included as a deployment option; a successful image build or operational container test was not part of the recorded verification.

## 14 Security privacy and operations

### Implemented controls

Private passwords use scrypt with a random per-user salt. The database stores the salt and hash, not plaintext passwords. A session token uses random bytes and is stored in the database as a SHA-256 hash with an eight-hour expiry. Cookies are HttpOnly and SameSite Strict; HTTPS configuration adds Secure. Logout deletes the token record and clears the cookie.

Login rate limiting uses an in-process IP-keyed map and rejects excessive failed attempts with 429. It is not a distributed rate-limit service and is reset by process restart. Production deployments behind proxies need deliberate proxy and network configuration rather than trusting arbitrary forwarded headers.

Write requests require an exact Origin match. Role checks and shared transition rules protect actions on the server. Responses remove disallowed learner records and restricted employer fields. Revision checks prevent stale state from silently replacing newer state. The server sets several defensive response headers and avoids returning internal error traces.

### Consent and retention boundaries

Withdrawal blanks the programme name and email, removes skills, clears baseline income and outcome history, sets consent false, and removes evidence and follow-ups. The retained training record still includes fields such as course, district, gender, and training date. It must not be assumed to be irreversibly anonymous. Operational audit entries and a separate login account also remain.

The application does not implement database encryption at rest, account deletion, password reset, a complete retention engine, institutional employer vetting, multi-tenant isolation, or a formal privacy compliance process. Those responsibilities must be addressed before collecting real records. Browser demo role switching provides no access protection.

### Backup and recovery operations

Protect the SQLite database, exports, and host credentials. For a consistent simple backup, stop the service cleanly and copy the database together with any relevant SQLite sidecar files, or use a supported SQLite online backup mechanism. Do not assume copying only a live main database file captures recent WAL writes. Test recovery in a separate environment before relying on the backup.

Preserve the versioned source and schema used by a backup. A workspace JSON export is useful for review but is not a replacement for the full private database. Plan migrations before changing the persisted state shape. Session and account records contain security-sensitive material even though passwords and tokens are hashed.

## 15 Troubleshooting

| Symptom | Likely cause | Corrective action |
| --- | --- | --- |
| Server refuses first start | Missing or placeholder admin credential | Set valid private bootstrap values before the first launch. |
| API mode shows a demo | Built with the static build command | Use build:api or dev:full for server-connected mode. |
| Login works but writes return 403 | Public origin does not match the browser | Set the exact scheme, host, and port without a trailing slash. |
| Learner or employer has an empty view | Incorrect binding, no linked claims, or withdrawn consent | Inspect the relevant records as programme staff. |
| Employer cannot verify a record | Outcome belongs to another employer | Use the correct bound employer account and linked outcome. |
| Update returns 409 | Another request changed the workspace revision | Review the refreshed state, then retry the intended action. |
| Resetting environment values does not change a password | Bootstrap runs only without an administrator | Use an operator-managed account recovery procedure; no reset interface exists. |
| Data disappears after deployment | Database path is on ephemeral storage | Mount persistent storage and restore a consistent tested backup. |
| Browser tests cannot start | Compatible browser is absent or path differs | Install Chromium or set CHROMIUM_PATH correctly. |
| Static application is unavailable | Pages not enabled or deployment not run | Configure Pages and run the manual publication workflow. |

## 16 Maintenance and future work

Maintain the domain rules in shared/model.ts alongside meaningful tests. src/store.ts is the boundary between local and private operation; avoid duplicating permissions only in interface components. server/app.ts owns authentication, HTTP behavior, and database transitions. shared/seed.ts supplies fictional sample records and the configurable initial catalog.

The first operational improvements should cover account lifecycle, consistent backups and migrations, normalized storage, bounded queries, audit retention, and employer onboarding. A larger programme then needs tenant isolation, a durable follow-up queue, localization, authorized data integrations, and carefully designed aggregate sharing.

Further analytical work should distinguish descriptive outcomes from causal impact. A credible causal study requires an evaluation design and suitable comparison data, not only dashboard percentages. Validate support thresholds with programme staff and evaluate whether prioritization improves contact and assistance without creating unfair treatment.

## 17 Demonstration and review guide

For a short demonstration, filter the dashboard to a district and course, then explain the in-work denominator. Open a passport and follow its dated training, claims, and evidence. Record a new update and show that historical verification does not transfer. Use the demo employer role to confirm a linked outcome and use the learner role to submit an optional update.

Next, open the follow-up studio, explain a priority score, and record a check-in for one milestone. Show the missing requirements in Skill radar and schedule a support step. Finish with the impact report, its metric definitions, and an export. Use fictional data throughout a public presentation.

Useful review questions concern the evidence boundary, why missing responses remain separate, how permissions differ between modes, what a revision conflict protects, and why observed income change is not automatically programme impact. The answers are in the data contract and operational limits, rather than a claim that an external service has been integrated.

## 18 References and delivery record

Official problem-statement source: https://sih.gov.in/sih2026PS. Search for SIH26135. The implemented problem is employment-outcome tracking, skill gaps, and the impact of skilling initiatives from the Government of Maharashtra.

Implementation reference: https://github.com/Vthilakraj/udaan-atlas. Core sources are shared/model.ts, shared/seed.ts, src/store.ts, src/App.tsx, src/pages.tsx, src/dialogs.tsx, server/app.ts, and server/index.ts. Verification sources are tests/domain.test.ts, tests/api.test.ts, the browser tests, and the CI workflow. The source baseline documented here is commit 333eb2a, before this documentation addition.

Udaan Atlas uses the MIT license. Original source, artwork, screenshots, tests, and setup material are included; dependencies retain their own licenses. This documentation describes the implemented prototype and should be updated whenever behavior, data shapes, permissions, or deployment procedures change.
