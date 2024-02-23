import { NextRequest } from "next/server";

import { getTrace } from "@/lib/actions/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let trace;

  try {
    trace = await getTrace(params.id);
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
