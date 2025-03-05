import { NextRequest } from "next/server";

import { getTrace } from "@/lib/actions/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let trace;

  try {
    const { id } = await params;
    trace = await getTrace(id);
  } catch (err: any) {
    console.error(err);
    return Response.json(
      { message: "Failed to fetch trace", trace: {} },
      { status: 500 }
    );
  }

  if (!trace) {
    return Response.json(
      { message: "Trace not found", trace: {} },
      { status: 404 }
    );
  }

  return Response.json({ message: "OK: Found trace", trace }, { status: 200 });
}
