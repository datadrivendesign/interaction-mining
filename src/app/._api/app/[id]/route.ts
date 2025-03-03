import { getApp } from "@/lib/actions";
import { NextRequest } from "next/server";

export async function GET(_ : NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let app;

  try {
    const { id } = await params;
    app = await getApp(id);
  } catch (err: any) {
    return Response.json(
      // { message: "Failed to fetch app.", app: {} },
      { message: err.toString(), app: {} },
      { status: 500 }
    );
  }

  return Response.json({ message: "Found app.", app }, { status: 200 });
}
