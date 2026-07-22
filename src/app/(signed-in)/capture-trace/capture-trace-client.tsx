"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createCrawlRequest } from "@/lib/actions";

const DESCRIPTION_MAX_LENGTH = 200;

export default function CaptureTraceClient() {
  const [targetInput, setTargetInput] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allFilled = targetInput.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createCrawlRequest({ targetInput, description });
      if (!result.ok) {
        toast.error(result.message || "Failed to create crawl request.");
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create crawl request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mt-10 mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <CheckCircle2 className="size-12 text-green-500" />
            <h1 className="text-2xl font-bold tracking-tight">
              Trace request submitted
            </h1>
            <p className="text-muted-foreground max-w-sm">
              We&apos;ll notify you here once this trace has been collected.
              You can track its status from your dashboard.
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mt-10 mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Capture Trace
        </h1>
        <p className="text-muted-foreground mt-2">
          Describe an app or website and a task, and we&apos;ll automatically
          capture the interaction trace for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request a capture</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetInput" className="font-bold">
                App or URL
              </Label>
              <Input
                id="targetInput"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="e.g. https://play.google.com/store/apps/details?id=com.whatsapp or https://example.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold">
                What task should be performed?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) =>
                  e.target.value.length <= DESCRIPTION_MAX_LENGTH &&
                  setDescription(e.target.value)
                }
                placeholder="e.g. Sign up for an account and add an item to the cart"
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </p>
            </div>

            <Button type="submit" disabled={!allFilled || isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
