// Do not commit this file with actual hardcoded values filled in. These are utility scripts to help with development.
/** 
 * run this script to add an ios app to the database using the app store scraper
 * this is useful when you need to add an ios app to the database using the app store scraper
 * */ 
// example usage: node prisma/scripts/add-ios-app-to-db.mjs
import { PrismaClient } from "@prisma/client";
import appStore from "app-store-scraper";

const prisma = new PrismaClient();

function convertToPrismaApp(data) {
  const app = {
    packageName: data.appId,
    category: {
      id:
        `${data.primaryGenreId}`,
      name:
        `${data.primaryGenre}`,
    },
    metadata: {
      company: data.developer ?? "unknown",
      name: data.title ?? "unknown",
      cover: data.screenshots?.[0] ?? data.icon ?? "unknown",
      description: data.description ?? "unknown",
      icon: data.icon ?? "unknown",
      rating: data.score ?? -1,
      reviews: data.reviews ?? -1,
      genre: data.genres ?? [],
      downloads: "-1",
      url: data.url ?? "unknown",
    },
    os: "",  // "ios" or "android"
  };
  return app;
}

async function main() {
  const appId = ""  // ios app store id or android package name
  const res = await appStore.app({ id: appId });
  const app = convertToPrismaApp(res);
  const newApp = await prisma.app.create({
    data: {
      packageName: app.packageName,
      category: app.category || null,
      os: app.os,
      metadata: {
        company: app.metadata.company,
        name: app.metadata.name,
        cover: app.metadata.cover,
        description: app.metadata.description,
        icon: app.metadata.icon,
        rating: app.metadata.rating,
        reviews: app.metadata.reviews,
        genre: app.metadata.genre,
        downloads: app.metadata.downloads,
        url: app.metadata.url,
      },
    },
  });
  console.log("new app:", newApp);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());