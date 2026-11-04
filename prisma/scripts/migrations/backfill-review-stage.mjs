/**
 * One-time backfill for the `stage` field added to capture_reviews in Nov 2026
 * (corrections workflow, Phase 1).
 *
 * Every review row written before the REVIEWER tier existed was the admin's
 * final verdict, so rows without a `stage` get `stage: "FINAL"`. The other new
 * fields (`self_review`, `overturned`, `fixed_kinds`) get their defaults in the
 * same write so no document is missing a required field.
 *
 * Usage:
 *   dotenvx run --env-file=.env.local -- node prisma/scripts/migrations/backfill-review-stage.mjs [--dry-run]
 */

import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  console.log(
    "Usage: node prisma/scripts/migrations/backfill-review-stage.mjs [--dry-run]",
  );
  process.exit(0);
}

const prisma = new PrismaClient();
const filter = { stage: { $exists: false } };

try {
  const countRes = await prisma.$runCommandRaw({
    count: "capture_reviews",
    query: filter,
  });
  const missing = countRes.n ?? 0;
  console.log(`capture_reviews without stage: ${missing}`);

  if (values["dry-run"] || missing === 0) {
    console.log(values["dry-run"] ? "Dry run, no writes." : "Nothing to do.");
  } else {
    const res = await prisma.$runCommandRaw({
      update: "capture_reviews",
      updates: [
        {
          q: filter,
          u: {
            $set: {
              stage: "FINAL",
              self_review: false,
              overturned: false,
              fixed_kinds: [],
            },
          },
          multi: true,
        },
      ],
    });
    console.log(`matched ${res.n ?? 0}, modified ${res.nModified ?? 0}`);
  }
} finally {
  await prisma.$disconnect();
}
