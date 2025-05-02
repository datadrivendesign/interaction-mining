"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createCaptureTask, getAllApps, getAndroidApp, getIosApp, checkIfAppExists, saveApp, AppItemList } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { redirect } from "next/navigation";
import { App } from "@prisma/client";

export interface AppListItem {
  id: string;
  package: string;
  name: string;
}

export default function CaptureNewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // if (!session) {
  //   redirect(`/sign-in?callbackUrl=${encodeURIComponent("/capture/new")}`);
  // }

  enum OS {
    IOS = "ios",
    ANDROID = "android"
  }

  const [platform, setPlatform] = useState<OS>(OS.ANDROID);//"android");
  const [app, setApp] = useState("");
  const [description, setDescription] = useState("");
  const [apps, setApps] = useState<AppListItem[]>([]);
  const [showAddApp, setShowAddApp] = useState(false);
  const [newAppId, setNewAppId] = useState("");

  useEffect(() => {
    async function fetchApps() {
      const appList = await getAllApps();
      setApps(appList); 
    }
    fetchApps();
  }, []);

  function convertToPrismaApp(data: any): App {
    const app = {
      packageName: data.appId,
      category: {
        id: platform == OS.ANDROID ? data.primaryGenre : data.genre,
        name: platform == OS.IOS ? data.primaryGenreId : data.genreId,
      },
      metadata: {
        company: data.developer ?? "unknown",
        name: data.title ?? "unknown",
        cover: data.screenshots?.[0] ?? data.icon ?? "unknown",
        description: data.description ?? "unknown",
        icon: data.icon ?? "unknown",
        rating: data.score ?? -1,
        reviews: data.reviews ?? -1,
        genre: platform == OS.ANDROID ? 
          (data.categories.map((c: any) => c.name) ?? []) : 
          (data.genres ?? []),
        downloads: platform == OS.ANDROID ? data.installs : "-1",
        url: data.url ?? "unknown",
      },
    } as App;
    return app;
  }

  async function handleAddApp() {
    if (!newAppId) return;

    console.log("Check if app exists:", newAppId);
    const existing = await checkIfAppExists(newAppId);
    if (existing) {
      toast.success("App already exists!");
      setApp(newAppId);
      setShowAddApp(false);
      return;
    }

    console.log("Scraping app data from store...");
    const result = platform === "android"
      ? await getAndroidApp({ appId: newAppId })
      : await getIosApp({ appId: newAppId });

    console.log("Scraper result:", result);
    if (!result || !result.ok) {
      toast.error("Failed to fetch app from store.");
      return;
    }

    console.log("Saving app to DB...");
    const saved = await saveApp(convertToPrismaApp(result.data));
    console.log("Save result:", saved);

    if (saved.ok) {
      toast.success("App added!");
      const updatedApps = await getAllApps();
      setApps(updatedApps);
      setTimeout(() => { setApp(saved.data?.packageName || newAppId); }, 0); 
      setShowAddApp(false);
      setNewAppId("");
    } else {
      toast.error("Failed to save app to database.");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    const result = await createCaptureTask({
      userId: session.user.id,
      os: platform,
      appId: app,
      description,
    });

    if (result?.captureId) {
      router.push(`/capture/${result.captureId}/start`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contribute</h1>
        <p className="text-muted-foreground">Add your own tasks & contribute to ODIM.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Toggle */}
        <div className="space-y-2">
          <Label>Platform</Label>
          <ToggleGroup 
            type="single" 
            value={platform} 
            onValueChange={(platform) => setPlatform(platform as OS)} 
            className="w-full"
          >
            <ToggleGroupItem 
              value={OS.ANDROID} 
              className="w-full"
            >
              Android
            </ToggleGroupItem>
            <ToggleGroupItem 
              value={OS.IOS} 
              className="w-full"
            >
              iOS
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* App Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="app">1. Search or Select App</Label>
          <Select value={app} onValueChange={setApp} required>
            <SelectTrigger id="app">
              <SelectValue placeholder="Select an app" />
            </SelectTrigger>
            <SelectContent>
              {apps.map((a: any) => (
                <SelectItem key={a.id} value={a.package}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="link"
          className="text-sm p-0 mt-1"
          onClick={(e) => {
            e.preventDefault();
            setShowAddApp(true);
          }}
        >
          + Add app not listed
        </Button>

        {/* Manual App Entry */}
        {showAddApp && (
          <div className="space-y-2">
            <Label htmlFor="newAppId">
              Enter {platform === "android" ? "Package Name" : "iOS Bundle ID"}
            </Label>
            <input
              type="text"
              id="newAppId"
              value={newAppId}
              onChange={(e) => setNewAppId(e.target.value)}
              placeholder="e.g. com.whatsapp"
              className="w-full border rounded px-3 py-2"
            />
            <Button type="button" onClick={handleAddApp}>
              Fetch & Add App
            </Button>
          </div>
        )}

        {/* Task Description */}
        <div className="space-y-2">
          <Label htmlFor="description">2. Describe what task you’ll perform in the app</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Create a new message and attach a photo"
            required
          />
        </div>

        <Button type="submit">Start Capture</Button>
      </form>
    </div>
  );
}
