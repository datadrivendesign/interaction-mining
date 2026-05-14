"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useWatch } from "react-hook-form";
import { FrameData, TraceFormData } from "./components/types";

interface ScreenBlobRegistry {
  /** Mark a freshly-created screen `blob:` URL as owned by this form session. */
  register: (url: string) => void;
}

const ScreenBlobRegistryContext = createContext<ScreenBlobRegistry>({
  register: () => {},
});

export function useScreenBlobRegistry() {
  return useContext(ScreenBlobRegistryContext);
}

/**
 * Owns the lifecycle of every `blob:` URL used as a screen `src` inside the
 * edit form. Sits inside <FormProvider> so it can observe `screens` via
 * `useWatch`.
 *
 * Cleanup happens automatically:
 *   - on every screens write, any registered URL no longer present in
 *     `screens[].src` is revoked (handles deletes, replacements, and the
 *     blob → https swap that follows upload),
 *   - on provider unmount (route exit), all remaining URLs are revoked.
 *
 * Producers (bootstrap, manual capture) just call `register(url)` once after
 * `URL.createObjectURL` and never deal with revocation themselves.
 */
export function ScreenBlobRegistryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const registered = useRef<Set<string>>(new Set());

  const screens = useWatch<TraceFormData, "screens">({
    name: "screens",
  }) as FrameData[] | undefined;

  // Orphan sweep: revoke any URL we registered that no longer backs a screen.
  useEffect(() => {
    const live = new Set(
      (screens ?? [])
        .map((s) => s.src)
        .filter(
          (src): src is string =>
            typeof src === "string" && src.startsWith("blob:"),
        ),
    );
    for (const url of Array.from(registered.current)) {
      if (!live.has(url)) {
        URL.revokeObjectURL(url);
        registered.current.delete(url);
      }
    }
  }, [screens]);

  // Final sweep on route exit.
  useEffect(() => {
    const set = registered.current;
    return () => {
      for (const url of set) {
        URL.revokeObjectURL(url);
      }
      set.clear();
    };
  }, []);

  const register = useCallback((url: string) => {
    if (typeof url === "string" && url.startsWith("blob:")) {
      registered.current.add(url);
    }
  }, []);

  const value = useMemo<ScreenBlobRegistry>(() => ({ register }), [register]);

  return (
    <ScreenBlobRegistryContext.Provider value={value}>
      {children}
    </ScreenBlobRegistryContext.Provider>
  );
}
