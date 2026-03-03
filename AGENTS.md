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

## 1. Mandatory Plan-First Protocol
### Plan Before Code
Before any changes, provide:
1. A checklist of steps.
2. Exact file list with action: **Create / Modify / Delete**.
3. Labels for: **Breaking, Risky, Backend, or Data Model** changes.
4. Known failure points and edge cases.

**Wait for explicit approval.** Only proceed when the user says:
- `APPROVE PLAN`: Proceed with implementation.
- `APPROVE BREAKING CHANGE`: Authorize schema/API/trace format shifts.

### Scope Changes
If work reveals a necessary deviation: **Stop immediately**, explain the deviation, and wait for renewed approval.

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
- **Change Summary:** After each step, group changes by: **UI, API, Data Model, Styling, and Dependencies.**
- **Manual Test Checklist:** Provide a custom Markdown checkbox list derived from the diff:
  - **Happy Path:** One end-to-end success test.
  - **Edge Cases:** Malformed Zod inputs (400 vs 500), interrupted uploads, and viewport tests (360px).
  - **Double-Submit:** Verify buttons disable during execution.
  - **Persistence:** Test page refresh mid-state.
  - **Environment:** Label tests with `[Local]` or `[Amplify dev]` if they require specific DB/S3 access.

---

## 4. Non-Goals
**Do not, under any circumstances:**
- Modify auth flow or change DB schema without explicit `APPROVE BREAKING CHANGE`.
- Perform unrelated refactors or add new external services without explicit `APPROVE BREAKING CHANGE`.

---

## Agent Principle
Be conservative. Minimize side effects. Correctness over elegance. **Ask when uncertain.**
A wrong assumption caught before implementation costs nothing; after, it costs a rollback.