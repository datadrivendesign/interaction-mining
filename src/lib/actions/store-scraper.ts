"use server";

// @ts-ignore
import appStore from "app-store-scraper";
import gplay from "google-play-scraper";

export async function getIosApp({ appId }: { appId: string }) {
  try {
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
  } catch (error) {
    return {
      ok: false,
      message: "Error fetching iOS app data",
      data: null,
    };
  }
}

export async function getAndroidApp({ appId }: { appId: string }) {
  try {
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
  } catch (error) {
    return {
      ok: false,
      message: "Error fetching Android app data",
      data: null,
    };
  }
}
