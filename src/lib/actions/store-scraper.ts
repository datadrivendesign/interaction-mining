"use server";

// @ts-ignore
import appStore from "app-store-scraper";
import gplay from "google-play-scraper";

export async function getIosApp({ appId }: { appId: string }) {
  let res = await appStore.app({ appId });

  if (!res) {
    return {
      ok: false,
      message: "Failed to fetch app data",
      data: null,
    };
  }

  return {
    ok: true,
    message: "App data fetched",
    data: res,
  };
}

export async function getAndroidApp({ appId }: { appId: string }) {

  let res = await gplay.app({ appId });

  if (!res) {
    return {
      ok: false,
      message: "Failed to fetch app data",
      data: null,
    };
  }

  return {
    ok: true,
    message: "App data fetched",
    data: res,
  };
}
