"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  createCaptureTask,
  getAllApps,
  getAndroidApp,
  getIosApp,
  checkIfAppExists,
  saveApp,
  AppItemList,
  AppInput,
} from "@/lib/actions";
import { Platform } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function CaptureNewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [platform, setPlatform] = useState<Platform>(Platform.ANDROID);
  const [app, setApp] = useState("");
  const [description, setDescription] = useState("");
  const [apps, setApps] = useState<AppItemList[]>([]);
  const [showAddApp, setShowAddApp] = useState(false);
  const [newAppId, setNewAppId] = useState("");

  useEffect(() => {
    async function fetchApps() {
      const appList = await getAllApps();
      setApps(appList);
    }
    fetchApps();
  }, []);

  function convertToPrismaApp(data: any): AppInput {
    const app = {
      packageName: data.appId,
      category: {
        id: platform === Platform.ANDROID 
          ? `${data.genre}` 
          : `${data.primaryGenreId}`,
        name: platform === Platform.ANDROID 
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
        genre: platform === Platform.ANDROID
          ? (data.categories.map((c: any) => c.name) ?? [])
          : (data.genres ?? []),
        downloads: platform === Platform.ANDROID ? 
          data.installs : 
          "-1",
        url: data.url ?? "unknown",
      },
      os: platform
    } as AppInput;
    return app;
  }

  async function handleAddApp() {
    if (!newAppId) return;

    console.log("Check if app exists");
    const existing = await checkIfAppExists(newAppId, platform);
    if (existing) {
      toast.success("App already exists!");
      setApp(newAppId);
      setShowAddApp(false);
      return;
    }

    console.log("Scraping app data from store...");
    const result =
      platform === Platform.ANDROID
        ? await getAndroidApp({ appId: newAppId })
        : await getIosApp({ appId: newAppId });

    console.log("Scraper result:", result);
    if (!result || !result.ok) {
      toast.error("Failed to fetch app from store.");
      return;
    }

    console.log("Saving app to DB...");
    const saved = await saveApp(convertToPrismaApp(result.data));

    if (saved.ok) {
      toast.success("App added!");
      const updatedApps = await getAllApps();
      setApps(updatedApps);
      setTimeout(() => {
        setApp(saved.data?.packageName || newAppId);
      }, 0);
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
      appId: app,
      os: platform,
      description,
    });

    if (result.ok) {
      toast.success("Capture task created! Redirecting...");
      router.push(`/capture/${result.data?.captureId}/start`);
    } else {
      toast.error("Failed to create capture task.");
    }
  };
  const step = !platform
  ? 0
  : !app
  ? 1
  : !description
  ? 2
  : 3;

  return (
    <div className="p-8 max-w-2xl mt-10 mx-auto space-y-8 bg-neutral-150 dark:bg-neutral-900 rounded-lg hover:shadow-2xl transition-shadow duration-300">
      <ul className="flex justify-between text-center text-sm text-muted-foreground font-medium mb-4">
        {["Platform", "Select App", "Describe Task"].map((label, index) => (
        <li
          key={label}
          className={`flex-1 transition-all duration-300 rounded-lg px-2 py-2
            ${step > index ? "bg-neutral-200 dark:bg-neutral-800 text-foreground shadow-lg mr-2 dark:text-white" : ""}
          `}
        >
          <div className="text-lg font-bold">
            {step > index ? "☑" : index + 1}
          </div>
          <div>{label}</div>
        </li>
      ))}
      </ul>

      <div>
        <h1 className="text-4xl font-extrabold tracking-tight dark:text-white">
          Start Capture Session
        </h1>
        <p className = "mt-4">
        
        </p>
        <div className = "p-1 rounded-lg mx-auto space-y-8 bg-neutral-100 dark:bg-neutral-800">
          <p className="text-muted-foreground ml-4 mt-2 mb-2 dark:text-white">
            Add your own tasks and contribute to ODIM. Follow the steps below to get started.
          </p>
        </div> 
        
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">

       
        <div className="space-y-2 dark:text-white">
          <Label>Platform</Label>
          <ToggleGroup
            type="single"
            value={platform}
            onValueChange={(selectPlatform) => {
              if (selectPlatform) {
                setPlatform(selectPlatform as Platform);
                setApp("");
              }
            }}
            className="w-full"
          >
            <ToggleGroupItem value={Platform.ANDROID} className="w-full dark:text-neutral-200 cursor-pointer">
              Android
            </ToggleGroupItem>
            <ToggleGroupItem value={Platform.IOS} className="w-full dark:text-neutral-200 cursor-pointer">
              iOS
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2 dark:text-white">
          <Label htmlFor="app">1. Search or Select App</Label>
          <Select value={app} onValueChange={setApp} required>
            <SelectTrigger id="app" className="cursor-pointer">
              <SelectValue placeholder="Select an app" />
            </SelectTrigger>
            <SelectContent>
              {apps.filter((app) => {
                return app.os === platform
              })
                .map((a: AppItemList) => (
                <SelectItem key={a.id} value={a.package}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="link"
          className="text-sm p-0 mt-1 dark:text-white"
          onClick={(e) => {
            e.preventDefault();
            setShowAddApp(true);
          }}
        >
          + Add app not listed
        </Button>

        {showAddApp && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="newAppId">
              Enter {platform === Platform.ANDROID 
                ? "Package Name" 
                : "iOS Bundle ID"}
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

        <div className="space-y-2 dark:text-white">
          <Label htmlFor="description">
            2. Describe what task you&apos;ll perform in the app
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Create a new message and attach a photo"
            required
          />
        </div>
          <Button className="dark:bg-neutral-50 dark:text-black" type="submit">Start Capture</Button>
      
      </form>
  </div>
);
}
