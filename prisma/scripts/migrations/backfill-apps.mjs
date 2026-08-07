// prisma/scripts/backfill-users.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const os = "ios";
  console.log(process.env.DATABASE_URL);
  if (process.env.DATABASE_URL == "YOUR_MONGO_DB_URL") {
    os = "android";
  }

  // Backfill Capture
  await prisma.app.updateMany({
    where: { os: { equals: undefined } },
    data: { os: os }, // "android"
  });

  console.log("🎉 Backfill complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
