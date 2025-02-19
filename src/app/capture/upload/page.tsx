"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, redirect, RedirectType } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { Button } from "@/components/ui/button";
import { getCapture } from "@/lib/actions";
import { Loader2 } from "lucide-react";

// Server action to fetch the capture
async function fetchCapture(prevState: any, formData: FormData) {
  const otp = formData.get("otp") as string;

  if (!otp || otp.length !== 6) {
    return { error: "Capture session code is required." };
  }

  try {
    const capture = await getCapture({ otp });

    if (!capture.id) {
      toast.error("Invalid capture session code.");
      return { error: "Invalid capture session code." };
    }

    return { capture };
  } catch (error) {
    toast.error("Failed to fetch capture. Please try again.");
    return { error: "Failed to fetch capture. Please try again." };
  }
}

export default function Page() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [state, formAction, pending] = useActionState(fetchCapture, null);

  useEffect(() => {
    if (state?.capture!) {
      redirect(`/capture/${state.capture.id}/upload`, RedirectType.push);
    }
  }, [state?.capture]);

  return (
    <>
      <div className="flex w-dvw min-h-dvh justify-center items-start md:items-center p-8 md:p-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Let&rsquo;s find your capture session</CardTitle>
            <CardDescription>
              Enter your capture session code to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {state?.error && (
              <span className="text-red-500 dark:text-red-400 text-sm mb-4">
                {state.error}
              </span>
            )}
            <InputOTP maxLength={6} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </CardContent>
          <CardFooter className="flex justify-end">
            <form action={formAction}>
              <input type="hidden" name="otp" value={otp} />
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-6 animate-spin" />}
                Continue
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
