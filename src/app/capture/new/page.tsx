"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createCaptureTask, getAllApps } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function CaptureNewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [platform, setPlatform] = useState("android");
  const [app, setApp] = useState("");
  const [description, setDescription] = useState("");
  const [apps, setApps] = useState([]);

  useEffect(() => {
    async function fetchApps() {
      const appList = await getAllApps();
      setApps(appList);
    }
  
    fetchApps();
  }, []);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting capture task:", { platform, app, description });
    if (!session?.user?.id) return;

    const result = await createCaptureTask({
      userId: session.user.id,
      os: platform,
      appId: app,
      description,
    });

    if (result?.captureId) {
      console.log("Capture task created successfully:", result.captureId);
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
          <ToggleGroup type="single" value={platform} onValueChange={setPlatform} className="w-full">
            <ToggleGroupItem value="android" className="w-full">Android</ToggleGroupItem>
            <ToggleGroupItem value="ios" className="w-full">iOS</ToggleGroupItem>
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

        {/* Task Description */}
        <div className="space-y-2">
          <Label htmlFor="description">2. Task Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What actions will you record?"
            required
          />
        </div>

        {/* Next Button */}
        <div className="flex justify-end">
          <Button type="submit">Next</Button>
        </div>
      </form>
    </div>
  );
}
