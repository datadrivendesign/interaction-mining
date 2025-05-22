import { toast } from "sonner";
import { getCaptures, getUser } from "../actions";
import useSWR from "swr";
import { Prisma } from "@prisma/client";

interface UserFetcherOptions {
  includes?: Prisma.UserInclude;
}

export async function userFetcher([_, userId, options]: [
  string,
  string,
  UserFetcherOptions,
]) {
  const includes = options.includes || {};
  let res = await getUser(userId, { includes });

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch capture session:", res.message);
    toast.error("Failed to fetch capture session.");
  }
}

export function useUser(userId: string, options: UserFetcherOptions = {}) {
  const { data, error, isLoading } = useSWR(
    ["user", userId, options],
    userFetcher
  );

  return {
    user: data,
    error,
    isLoading,
  };
}