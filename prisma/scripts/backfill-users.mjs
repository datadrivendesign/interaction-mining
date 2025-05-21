// prisma/scripts/backfill-users.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const SYSTEM_ID = "6823a2bfff2ae879579b8578";

  const problem_captures = await prisma.trace.findMany({
    where: {
      userId: undefined,
    },
  });

  console.log(`Found ${problem_captures.length} captures with null userId`);

  // Backfill Capture
  await prisma.trace.updateMany({
    where: { userId: undefined },
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
