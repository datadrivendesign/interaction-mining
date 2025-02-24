"use server";

// @ts-ignore
import appStore from "app-store-scraper";
import gplay from "google-play-scraper";

export async function getIosApp({ appId }: { appId: string }) {
  return await appStore.app({ appId });
}

export async function getAndroidApp({ appId }: { appId: string }) {
  return await gplay.app({ appId });
}
