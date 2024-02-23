import { prisma } from "@/lib/prisma";
import { Trace } from "@prisma/client";
import { NextRequest } from "next/server";

import { getTraces, getTraceByApp } from "@/lib/actions/trace";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit")
    ? Number.parseInt(searchParams.get("limit")!, 10)
    : 10;
  const page = searchParams.get("page")
    ? Number.parseInt(searchParams.get("page")!, 10)
    : 1;
  const app = searchParams.get("app") ? searchParams.get("app")! : "";

  let traces: Trace[] = []; 

  try {
    if (app === "") {
      traces = await getTraces({
        limit,
        page,
      });
    } else {
      traces = await getTraceByApp(app);
    }
  } catch (err: any) {
    console.error(err);
    return Response.json(
      { message: "Failed to fetch traces", traces: [] },
      { status: 500 }
    );
  }

  return Response.json(
    { message: "OK: Found traces", traces },
    { status: 200 }
  );
}
