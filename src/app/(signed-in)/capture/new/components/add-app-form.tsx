import { Button } from "@/components/ui/button";
import { Platform, prettyOS } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction, useState } from "react";
import {
  AppInput,
  checkIfAppExists,
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
    if (!newAppId) return;
    // FIXME: db check breaks for ios because we lookup id instead of appId
    if (platform === Platform.ANDROID) {
      const existing = await checkIfAppExists(newAppId, platform);
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

    const result =
      platform === Platform.ANDROID
        ? await getAndroidApp({ appId: newAppId })
        : await getIosApp({ id: newAppId });

    if (!result || !result.ok) {
      toast.error(
        `Failed to fetch ${prettyOS(platform)} app. ${result?.message}`
      );
      return;
    }

    // need to do post-scrape check, now we switch to id from appId
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
          id: saved.data?.packageName || newAppId,
          name: saved.data?.metadata.name || newAppId,
        });
      }, 0);
      setShowAddApp(false);
      setNewAppId("");
    } else {
      toast.error("Failed to save app to database.");
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
            Enter{" "}
            {platform === Platform.ANDROID
              ? "Google Play Package Id"
              : "App Store ID"}
          </Label>
          <div className="flex flex-col md:flex-row gap-2 w-3/4">
            <input
              type="text"
              id="newAppId"
              value={newAppId}
              onChange={(e) => setNewAppId(e.target.value)}
              placeholder={`${
                platform === Platform.ANDROID
                  ? "e.g. com.whatsapp"
                  : "e.g. 310633997"
              }`}
              className="w-full border rounded px-3 py-2"
            />
            <Button type="button" disabled={!newAppId} onClick={handleAddApp}>
              Add App
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
