// prisma/scripts/transition-to-cloudfront.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const AWS_CLOUDFRONT_URL = "https://d1nrlpeg5tvzyr.cloudfront.net";

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
