// prisma/scripts/backfill-users.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {

  // Update all captures
  await prisma.capture.updateMany({
    where: { NOT: { appId_: null } },
    data: {
      
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
