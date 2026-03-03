// Do not commit this file with actual hardcoded values filled in. These are utility scripts to help with development.
/** 
 * run this script to transition all screens to use the new cloudfront url
 * this is useful when you need to transition to a new cloudfront url and you have a lot of screens to update
 * */ 
// example usage: node prisma/scripts/transition-to-cloudfront.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const AWS_CLOUDFRONT_URL = ""  // cloudfront url to transition to. Use process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL if not set.

  const screens = await prisma.screen.findMany({
    where: {
      NOT: {
        src: undefined,
        vh: undefined,
      }
    },
  });

  console.log(`Found ${screens.length} screens to update.`);

  for (const screen of screens) {
    // Compute new CloudFront URL by replacing the original host or prefixing if necessary
    const newSrc = screen.src.match(/^https?:\/\//)
      ? screen.src.replace(/^https?:\/\/[^/]+/, AWS_CLOUDFRONT_URL)
      : `${AWS_CLOUDFRONT_URL}/${screen.src}`;
    // Do the same for the vh field
    let newVh;
    if (screen.vh) {
      newVh = screen.vh.match(/^https?:\/\//)
        ? screen.vh.replace(/^https?:\/\/[^/]+/, AWS_CLOUDFRONT_URL)
        : `${AWS_CLOUDFRONT_URL}/${screen.vh}`;
    }

    // Update screen and only include vh if it exists
    await prisma.screen.update({
      where: { id: screen.id },
      data: {
        src: newSrc,
        ...(newVh ? { vh: newVh } : {}),
      },
    });
  }

  console.log("🎉 Backfill complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
