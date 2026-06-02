# AGENTS.md
## Project Context
Next.js app for crowdworkers to upload recordings and annotate mobile UI traces.
- **Stack:** TypeScript, Zod, Prisma (MongoDB), Tailwind CSS, Radix UI, NextAuth.js (Google OAuth), S3/MinIO.
- **State:** Local React hooks only (useState, useMemo, useCallback, useContext). No new global state libraries.
- **Priority:** Stability and data integrity. Preserve existing annotation behavior.
- **Conflict Rule:** If repo code conflicts with this file, **trust the repo** and note the discrepancy in your plan.

## Source of Truth
Before changing logic or data format, verify:
- `prisma/schema.prisma`: Source of truth for all data shapes.
- Trace form types and Zod schemas in `src/app/(signed-in)/capture/[captureId]/edit/components/types.ts` (and `_trace/[traceId]/edit/components/types.ts` for legacy trace flow).
- API routes in `src/app/api/` use ad-hoc validation (no Zod); consider adding Zod for new endpoints.
- Hooks in `src/lib/hooks/` are SWR fetchers; they consume but do not define data shapes.

## Project Structure
- `prisma/`: Schema and one-off DB/S3 scripts.
- `src/app/(signed-in)/capture/`: Core annotation pipeline (new, upload, edit, evaluate).
- `src/app/api/`: Auth, frame uploads, and metadata endpoints.
- `src/lib/`: Server actions (`/actions`), Auth config (`/auth`), S3 client (`/aws`), and hooks (`/hooks`).
- `src/components/ui/`: Radix-based primitives.

---

## 1. Scoped Plan-First Protocol
### When Approval Is Required
Require a plan and explicit approval only for application changes, including:
- Frontend behavior, UI flows, annotation interactions, uploads, auth, API routes, server actions, Prisma queries, data validation, persistence, or trace/data formats.
- Any risky, breaking, backend, or data-model-impacting change.

Do not require plan approval for low-risk non-application work such as:
- Documentation edits, README/AGENTS updates, comments, formatting-only changes, local utility scripts, analysis, command output, branch cleanup, or test-only changes that do not alter app behavior.

### Plan Format
Keep plans concise. For approval-gated work, include only:
- Steps.
- Files to create/modify/delete.
- Risk labels: `Breaking`, `Risky`, `Backend`, `Data Model`, or `None`.
- Key failure points/edge cases.

Approval shorthand:
- `A`: approve plan and proceed.
- `B`: decline or revise; user may add requested changes.
- `AB`: approve breaking change, including schema/API/auth/trace format shifts.

Do not ask the user to type long approval phrases.

### Scope Changes
For approval-gated work, stop and ask again if the approved scope must materially change. For non-gated work, proceed conservatively and report the deviation briefly.

---

## 2. Technical Standards
- **TypeScript & Validation:** No `any`. Use Zod for all API/Action inputs. Validate MongoDB ObjectIds at the API boundary (before Prisma calls).
- **Prisma + MongoDB:** - IDs must use `@db.ObjectId`. No auto-cascading deletes; handle orphan cleanup explicitly.
  - Replica set required; prefer atomic single-doc writes over multi-doc transactions.
  - No referential integrity; validate relationships in application logic.
- **UI/UX:** Radix + Tailwind only. All actions MUST have loading/disabled states to prevent double-submission. Surface clear, user-facing errors.
- **Media & Privacy:** Validate file type/size on client AND server. No PII, presigned URLs, or session tokens in logs.
- **Reliability:** Handle large uploads, slow networks, and mid-task refreshes. Design for upload resumption or clear failure messaging.

---

## 3. Execution & Verification
- Implement in small, independently reviewable steps. No unrelated refactors.
- Keep status updates and final summaries token-efficient. Do not repeat large plans, file inventories, or boilerplate unless useful.
- For app changes, summarize by affected area only when relevant: **UI, API, Data Model, Styling, Dependencies**.
- For app changes, provide a focused manual test checklist derived from the diff. Include relevant items only:
  - **Happy Path:** One end-to-end success test.
  - **Edge Cases:** Malformed Zod inputs (400 vs 500), interrupted uploads, viewport tests (360px).
  - **Double-Submit:** Verify buttons disable during execution.
  - **Persistence:** Test page refresh mid-state.
  - **Environment:** Label tests `[Local]` or `[Amplify dev]` if they require specific DB/S3 access.
- For docs/scripts/tooling-only changes, a brief summary plus any command/test result is enough.

---

## 4. Non-Goals
**Do not, under any circumstances:**
- Modify auth flow or change DB schema without explicit `AB`.
- Perform unrelated refactors or add new external services without explicit `AB`.

---

## Agent Principle
Be conservative. Minimize side effects. Correctness over elegance. **Ask when uncertain.**
A wrong assumption caught before implementation costs nothing; after, it costs a rollback.
