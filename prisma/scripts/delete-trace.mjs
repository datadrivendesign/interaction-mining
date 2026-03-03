// Do not commit this file with actual hardcoded values filled in. These are utility scripts to help with development.
/** 
 * run this script to delete a trace and all associated screens and captures
 * this is useful when you need to delete a trace and all associated screens and captures
 * */ 
// example usage: node prisma/scripts/delete-trace.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const traceId = ""  // db object id of trace to delete
  // delete all screens associated with the trace
  const screens = await prisma.screen.deleteMany({
    where: { traceId: traceId },
  });
  console.log("screens deleted:", screens.count);
  // delete the trace
  const trace = await prisma.trace.delete({
    where: { id: traceId },
  });
  console.log("trace deleted:", trace.id);
  // send capture back to review
  const captureId = trace.captureId;
  const capture = await prisma.capture.update({
    where: { id: captureId },
    data: {
      status: "REVIEWING",
    },
  });
  console.log("capture sent back to review:", capture.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());