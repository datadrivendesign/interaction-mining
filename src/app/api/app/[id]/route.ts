import { getApp } from "@/lib/actions";
import { NextRequest } from "next/server";

export async function GET(request : NextRequest, { params }: { params: { id: string } }) {
  let app;

  try {
    app = await getApp(params.id);
  } catch (err: any) {
    return Response.json(
      // { message: "Failed to fetch app.", app: {} },
      { message: err.toString(), app: {} },
      { status: 500 }
    );
  }

  return Response.json({ message: "Found app.", app }, { status: 200 });
}
