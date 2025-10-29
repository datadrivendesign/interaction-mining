"use client";
import { useState, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import { getApps, getAppsCount, type GetAppsParams } from "@/lib/actions";
import { App } from "@prisma/client";

export function useAppSearch(params: GetAppsParams) {
  const [apps, setApps] = useState<App[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const debouncedFetch = useMemo(
    () =>
      debounce(async (p: GetAppsParams) => {
        setLoading(true);
        try {
          const [results, count] = await Promise.all([
            getApps(p),
            getAppsCount(p),
          ]);
          setApps(results);
          setTotalCount(count);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    debouncedFetch(params);
    return () => {
      debouncedFetch.cancel();
    };
  }, [params, debouncedFetch]);

  return { apps, totalCount, loading, refetch: () => debouncedFetch(params) };
}
