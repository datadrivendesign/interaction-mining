"use server";

import type { AppInput } from "@/lib/actions/app";
import { Platform } from "@/lib/utils";
import gplay from "google-play-scraper";

type StoreActionResult<T> =
  | { ok: true; message: string; data: T }
  | { ok: false; message: string; data: null };

type AppleLookupResponse = {
  resultCount: number;
  results: AppleLookupResult[];
};

type AppleLookupResult = {
  trackId: number;
  bundleId?: string;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
  description?: string;
  primaryGenreId?: number;
  primaryGenreName?: string;
  genres?: string[];
  averageUserRating?: number;
  userRatingCount?: number;
  trackViewUrl?: string;
};

type GetIosAppParams =
  { id: string; appId?: string } | { id?: string; appId: string };

type AndroidStoreCategory = {
  name: string;
};

type AndroidStoreAppData = {
  appId: string;
  genre?: string;
  genreId?: string;
  developer?: string;
  title?: string;
  screenshots?: string[];
  icon?: string;
  description?: string;
  score?: number;
  reviews?: number;
  categories?: AndroidStoreCategory[];
  installs?: string;
  url?: string;
};

function convertIosToPrismaApp(result: AppleLookupResult): AppInput {
  const icon = result.artworkUrl100 ?? "unknown";
  const screenshots = result.screenshotUrls?.length
    ? result.screenshotUrls
    : (result.ipadScreenshotUrls ?? []);

  return {
    packageName: result.bundleId ?? String(result.trackId),
    category: {
      id: result.primaryGenreId ? String(result.primaryGenreId) : "unknown",
      name: result.primaryGenreName ?? "unknown",
    },
    metadata: {
      company: result.artistName ?? "unknown",
      name: result.trackName ?? "unknown",
      cover: screenshots[0] ?? icon,
      description: result.description ?? "unknown",
      icon,
      rating: result.averageUserRating ?? -1,
      reviews: result.userRatingCount ?? -1,
      genre: result.genres ?? [],
      downloads: "-1",
      url:
        result.trackViewUrl ?? `https://apps.apple.com/app/id${result.trackId}`,
    },
    os: Platform.IOS,
  };
}

function convertAndroidToPrismaApp(data: AndroidStoreAppData): AppInput {
  const app: AppInput = {
    packageName: data.appId,
    category: {
      id: `${data.genre}`,
      name: `${data.genreId}`,
    },
    metadata: {
      company: data.developer ?? "unknown",
      name: data.title ?? "unknown",
      cover: data.screenshots?.[0] ?? data.icon ?? "unknown",
      description: data.description ?? "unknown",
      icon: data.icon ?? "unknown",
      rating: data.score ?? -1,
      reviews: data.reviews ?? -1,
      genre: data.categories?.map((category) => category.name) ?? [],
      downloads: data.installs ?? "-1",
      url: data.url ?? "unknown",
    },
    os: Platform.ANDROID,
  };
  return app;
}

export async function getIosApp({
  id,
  appId,
}: GetIosAppParams): Promise<StoreActionResult<AppInput>> {
  const lookupAppId = appId;

  if (id && !/^\d+$/.test(id)) {
    return {
      ok: false,
      message: "Enter a valid numeric App Store ID or App Store URL.",
      data: null,
    };
  }

  try {
    let query: string;
    if (id) {
      query = `id=${encodeURIComponent(id)}`;
    } else if (lookupAppId) {
      query = `bundleId=${encodeURIComponent(lookupAppId)}`;
    } else {
      return {
        ok: false,
        message: "Enter a valid App Store ID, App Store URL, or bundle ID.",
        data: null,
      };
    }

    const response = await fetch(`https://itunes.apple.com/lookup?${query}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "Failed to fetch app data",
        data: null,
      };
    }

    const data = (await response.json()) as AppleLookupResponse;
    const app = data.results[0];

    if (!app) {
      return {
        ok: false,
        message: "No iOS app found for this App Store ID.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "App data fetched",
      data: convertIosToPrismaApp(app),
    };
  } catch {
    return {
      ok: false,
      message: "Error fetching iOS app data",
      data: null,
    };
  }
}

export async function getAndroidApp({
  appId,
}: {
  appId: string;
}): Promise<StoreActionResult<AppInput>> {
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
      data: convertAndroidToPrismaApp(res),
    };
  } catch (error) {
    return {
      ok: false,
      message: "Error fetching Android app data",
      data: null,
    };
  }
}
