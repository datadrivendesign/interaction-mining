import { toast } from "sonner";
import { getCapture, getCaptures } from "../actions";
import useSWR from "swr";
import { Prisma } from "@prisma/client";

interface CaptureFetcherOptions {
  includes?: Prisma.CaptureInclude;
}

export async function captureFetcher([_, captureId, options]: [
  string,
  string,
  CaptureFetcherOptions,
]) {
  const includes = options.includes || {};
  let res = await getCapture({ id: captureId, includes });

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch capture session:", res.message);
    toast.error("Failed to fetch capture session.");
  }
}

export function useCapture(
  captureId: string,
  options: CaptureFetcherOptions = {}
) {
  const { data, error, isLoading } = useSWR(
    ["capture", captureId, options],
    captureFetcher
  );

  return {
    capture: data,
    error,
    isLoading,
  };
}

export async function userCaptureFetcher([_, userId, options]: [
  string,
  string,
  CaptureFetcherOptions,
]) {
  const includes = options.includes || {};
  let res = await getCaptures({ userId, includes });

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch captures:", res.message);
    toast.error("Failed to fetch captures.");
  }
}

export function useUserCaptures(
  userId: string,
  options: CaptureFetcherOptions = {}
) {
  const { data, error, isLoading } = useSWR(
    ["userCapture", userId, options],
    captureFetcher
  );

  return {
    captures: data,
    error,
    isLoading,
  };
}
