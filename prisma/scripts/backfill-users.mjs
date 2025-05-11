// prisma/scripts/backfill-users.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const SYSTEM_ID = "6820be42d9d93fe8796e6772";

  // Backfill Capture
  await prisma.capture.updateMany({
    where: { userId: null },
    data: { userId: SYSTEM_ID },
  });

  console.log("🎉 Backfill complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
