import { NextRequest } from "next/server";
import { App } from "@prisma/client";
import { getApps } from "@/lib/actions/app";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit")
    ? Number.parseInt(searchParams.get("limit")!, 10)
    : 10;
  const page = searchParams.get("page")
    ? Number.parseInt(searchParams.get("page")!, 10)
    : 1;
  const query = searchParams.get("query") || "";

  let apps: App[] = [];

  try {
    apps = await getApps({
      limit,
      page,
      query,
    });
  } catch {
    return Response.json({ message: "Failed to fetch apps" }, { status: 500 });
  }

  return Response.json({ message: "OK: Found apps", apps }, { status: 200 });
}
