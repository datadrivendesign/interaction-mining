import { getCapture, getTrace } from "@/lib/actions";

import useSWR from "swr";
import { toast } from "sonner";

export enum CaptureSWRKeys {
  CAPTURE = "capture",
}

export async function captureFetcher([_, captureId]: [string, string]) {
  let res = await getCapture({ id: captureId, includes: { app: true } });

  if (res.ok) {
    return { capture: res.data };
  } else {
    console.error("Failed to fetch capture session:", res.message);
    toast.error("Failed to fetch capture session.");
    return null;
  }
}

export function useCapture(captureId: string) {
  const { data, error, isLoading } = useSWR(
    [CaptureSWRKeys.CAPTURE, captureId],
    captureFetcher
  );

  return {
    capture: data?.capture,
    error,
    isLoading,
  };
}
