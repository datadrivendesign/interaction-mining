import { Button } from "@/components/ui/button";
import { Platform, prettyOS } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction, useState } from "react";
import {
  AppInput,
  checkIfAppExists,
  checkIfIosAppExistsByStoreId,
  getAndroidApp,
  getIosApp,
  saveApp,
} from "@/lib/actions";
import { toast } from "sonner";

export default function AddAppForm({
  platform,
  showAddApp,
  setShowAddApp,
  setApp,
}: {
  platform: Platform;
  showAddApp: boolean;
  setShowAddApp: Dispatch<SetStateAction<boolean>>;
  setApp: Dispatch<SetStateAction<{ name: string; id: string }>>;
}) {
  const [newAppId, setNewAppId] = useState("");
  const [isAddingApp, setIsAddingApp] = useState(false);

  function parseStoreAppInput(input: string) {
    const trimmedInput = input.trim();
    try {
      const url = new URL(trimmedInput);
      if (platform === Platform.ANDROID) {
        return url.searchParams.get("id")?.trim() || trimmedInput;
      }

      const appStoreId = url.pathname.match(/\/id(\d+)/)?.[1];
      return appStoreId || trimmedInput;
    } catch {
      if (platform === Platform.IOS) {
        return trimmedInput.match(/id(\d+)/)?.[1] || trimmedInput;
      }
      return trimmedInput;
    }
  }

  function convertToPrismaApp(data: any): AppInput {
    const app = {
      packageName: data.appId,
      category: {
        id:
          platform === Platform.ANDROID
            ? `${data.genre}`
            : `${data.primaryGenreId}`,
        name:
          platform === Platform.ANDROID
            ? `${data.genreId}`
            : `${data.primaryGenre}`,
      },
      metadata: {
        company: data.developer ?? "unknown",
        name: data.title ?? "unknown",
        cover: data.screenshots?.[0] ?? data.icon ?? "unknown",
        description: data.description ?? "unknown",
        icon: data.icon ?? "unknown",
        rating: data.score ?? -1,
        reviews: data.reviews ?? -1,
        genre:
          platform === Platform.ANDROID
            ? (data.categories.map((c: any) => c.name) ?? [])
            : (data.genres ?? []),
        downloads: platform === Platform.ANDROID ? data.installs : "-1",
        url: data.url ?? "unknown",
      },
      os: platform,
    } as AppInput;
    return app;
  }

  async function handleAddApp() {
    const parsedAppId = parseStoreAppInput(newAppId);
    if (!parsedAppId || isAddingApp) return;
    setIsAddingApp(true);

    try {
      if (platform === Platform.ANDROID) {
        const existing = await checkIfAppExists(parsedAppId, platform);
        if (existing) {
          toast.success("App already exists!");
          setApp({
            id: existing.packageName,
            name: existing.metadata.name,
          });
          setShowAddApp(false);
          return;
        }
      }

      if (platform === Platform.IOS) {
        // First try App Store numeric ID from metadata.url to avoid scraper
        // call for existing apps. After scraping, still check canonical saved
        // packageName/appId because metadata.url is only best-effort shortcut.
        const existingByStoreUrl =
          await checkIfIosAppExistsByStoreId(parsedAppId);
        if (existingByStoreUrl) {
          toast.success("App already exists!");
          setApp({
            id: existingByStoreUrl.packageName,
            name: existingByStoreUrl.metadata.name,
          });
          setShowAddApp(false);
          return;
        }
      }

      const result =
        platform === Platform.ANDROID
          ? await getAndroidApp({ appId: parsedAppId })
          : await getIosApp({ id: parsedAppId });

      if (!result || !result.ok) {
        toast.error(
          `Failed to fetch ${prettyOS(platform)} app. ${result?.message}`,
        );
        return;
      }

      if (platform === Platform.IOS) {
        const existing = await checkIfAppExists(result.data?.appId, platform);
        if (existing) {
          toast.success("App already exists!");
          setApp({
            id: existing.packageName,
            name: existing.metadata.name,
          });
          setShowAddApp(false);
          return;
        }
      }

      const saved = await saveApp(convertToPrismaApp(result.data));
      if (saved.ok) {
        toast.success("App added!");
        setTimeout(() => {
          setApp({
            id: saved.data?.packageName || parsedAppId,
            name: saved.data?.metadata.name || parsedAppId,
          });
        }, 0);
        setShowAddApp(false);
        setNewAppId("");
      } else {
        toast.error("Failed to save app to database.");
      }
    } finally {
      setIsAddingApp(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="text-sm p-2 dark:text-black"
        onClick={(e) => {
          e.preventDefault();
          setShowAddApp(!showAddApp);
        }}
      >
        {showAddApp ? `- Close Form` : `+ Add New ${prettyOS(platform)} App`}
      </Button>
      {showAddApp && (
        <div className="space-y-1 animate-fade-in">
          <Label htmlFor="newAppId">
            Paste{" "}
            {platform === Platform.ANDROID
              ? "Google Play URL or package name"
              : "App Store URL or app ID"}
          </Label>
          <div className="flex flex-col md:flex-row gap-2 w-3/4">
            <input
              type="text"
              id="newAppId"
              value={newAppId}
              onChange={(e) => setNewAppId(e.target.value)}
              placeholder={`${
                platform === Platform.ANDROID
                  ? "e.g. https://play.google.com/store/apps/details?id=com.whatsapp"
                  : "e.g. https://apps.apple.com/us/app/uber-request-a-ride/id368677368"
              }`}
              className="w-full border rounded px-3 py-2"
            />
            <Button
              type="button"
              disabled={!newAppId.trim() || isAddingApp}
              onClick={handleAddApp}
            >
              {isAddingApp ? "Adding..." : "Add App"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
