"use client";
import { useState, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import { getApps, type GetAppsParams } from "@/lib/actions";
import { App } from "@prisma/client";

export function useAppSearch(params: GetAppsParams) {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedFetch = useMemo(
    () =>
      debounce(async (p: GetAppsParams) => {
        setLoading(true);
        try {
          const results = await getApps(p);
          setApps(results);
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

  return { apps, loading, refetch: () => debouncedFetch(params) };
}
