import { getTrace } from "@/lib/actions";

import useSWR from "swr";
import { toast } from "sonner";

export enum TraceSWRKeys {
  TRACE = "trace",
}

export async function traceFetcher([_, traceId]: [string, string]) {
  let res = await getTrace(traceId, { includes: { screens: true } });

  if (res.ok) {
    return { trace: res.data };
  } else {
    console.error("Failed to fetch capture session:", res.message);
    toast.error("Failed to fetch capture session.");
    return null;
  }
}

export function useTrace(traceId: string) {
  const { data, error, isLoading } = useSWR(
    [TraceSWRKeys.TRACE, traceId],
    traceFetcher
  );

  return {
    trace: data?.trace,
    error,
    isLoading,
  };
}