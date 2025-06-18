import { toast } from "sonner";
import { getTrace } from "../actions";
import useSWR from "swr";
import { Prisma } from "@prisma/client";

interface TraceFetcherOptions {
  includes?: Prisma.TraceInclude;
}

export async function traceFetcher([_, traceId, options]: [
  string,
  string,
  TraceFetcherOptions
]) {
  const includes = options.includes || {};
  let res = await getTrace(traceId, { includes });

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch trace:", res.message);
    toast.error("Failed to fetch trace.");
  }
}

export function useTrace(traceId: string, options: TraceFetcherOptions = {}) {
  const { data, error, isLoading } = useSWR(
    ["trace", traceId, options],
    traceFetcher
  );

  return {
    trace: data,
    error,
    isLoading,
  };
}
