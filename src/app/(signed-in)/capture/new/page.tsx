"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  createCaptureTask,
} from "@/lib/actions";
import { Platform, prettyOS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import AddAppForm from "./add-app-form";
import AppGallery from "./app-gallery";
import { Loader2 } from "lucide-react";

export default function CaptureNewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const taskRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 200;

  const [platform, setPlatform] = useState<Platform>(Platform.IOS);
  const [app, setApp] = useState({name: "", id: ""});
  const [description, setDescription] = useState("");
  const [showAddApp, setShowAddApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const result = await createCaptureTask({
        appId: app.id,
        os: platform,
        description,
      });
  
      if (result.ok) {
        toast.success("Capture task created! Redirecting...");
        router.push(`/capture/${result.data?.captureId}/start`);
      } else {
        throw new Error(`Failed to create capture task: ${result.message}`);
      }
    } catch (error) {
      toast.error("Failed to create capture task. Please try again.");
      console.error(error);
      setIsSubmitting(false);
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
          Create Task Flow
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {/* Platform */}
        <div className="space-y-2 dark:text-white">
          <Label className="mr-3 font-bold">1. Choose Platform</Label>
          <Badge 
            className={`${platform === Platform.ANDROID ? "bg-green-500" : "bg-blue-500"} text-white`}
          >
              {prettyOS(platform)}
          </Badge>
          <ToggleGroup
            type="single"
            value={platform}
            onValueChange={(selectPlatform) => {
              if (selectPlatform) {
                setPlatform(selectPlatform as Platform);
                setApp({name: "", id: ""});
              }
            }}
            className="w-full"
          >
            <ToggleGroupItem disabled value={Platform.ANDROID} className="w-full dark:text-neutral-200 cursor-pointer">
              {prettyOS(Platform.ANDROID)}
            </ToggleGroupItem>
            <ToggleGroupItem value={Platform.IOS} className="w-full dark:text-neutral-200 cursor-pointer">
              {prettyOS(Platform.IOS)}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* App */}
        <div className="space-y-2 dark:text-white">
            <Label htmlFor="app" className="mr-5 font-bold">
              2. Select App
            </Label>
            {app.name && <Badge>{app.name}</Badge>} 
            <AppGallery platform={platform} app={app} setApp={setApp} />
            <AddAppForm 
              platform={platform}
              showAddApp={showAddApp}
              setShowAddApp={setShowAddApp}
              setApp={setApp}
            />
        </div>


        {/* Description */}
        <div className="space-y-2 dark:text-white">
          <Label className="font-bold" htmlFor="description">
            3. Describe what task you&apos;ll perform in the app
          </Label>
          <Textarea
            id="description"
            maxLength={maxLength}
            value={description}
            ref={taskRef}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Create a new message and attach a photo"
            required
          />
          {taskRef.current && (
            <div className="w-full flex flex-col">
              <div 
                className="text-sm flex justify-end text-muted-foreground z-10"
              > 
                {`${description.length}/${maxLength}`}
              </div>
            </div>
          )}
        </div>
          <Button 
            className="dark:bg-neutral-50 dark:text-black" 
            type="submit"
            disabled={!app.id || !description || isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Start Capture
          </Button>
      </form>
  </div>
);
}
