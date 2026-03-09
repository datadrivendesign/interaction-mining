"use client";
import { useState, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import {
  getApps,
  getAppsCount,
  getAppsTraceCount,
  type GetAppsParams,
} from "@/lib/actions";
import { App } from "@prisma/client";

export function useAppSearch(
  params: GetAppsParams,
  { includeTraceCount = false }: { includeTraceCount?: boolean } = {},
) {
  const [apps, setApps] = useState<App[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalTraceCount, setTotalTraceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const debouncedFetch = useMemo(
    () =>
      debounce(async (p: GetAppsParams) => {
        setLoading(true);
        try {
          const [results, count, traceCount] = await Promise.all([
            getApps(p),
            getAppsCount(p),
            includeTraceCount ? getAppsTraceCount(p) : Promise.resolve(0),
          ]);
          setApps(results);
          setTotalCount(count);
          setTotalTraceCount(traceCount);
        } finally {
          setLoading(false);
        }
      }, 300),
    [includeTraceCount],
  );

  useEffect(() => {
    debouncedFetch(params);
    return () => {
      debouncedFetch.cancel();
    };
  }, [params, debouncedFetch]);

  return {
    apps,
    totalCount,
    totalTraceCount,
    loading,
    refetch: () => debouncedFetch(params),
  };
}
