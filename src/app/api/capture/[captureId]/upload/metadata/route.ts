// app/api/capture/[captureId]/upload/metadata/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleAndroidMetadataUpload } from "@/lib/actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ captureId: string }> }
) {
  try {
    const { captureId } = await params;
    const body = await request.json();

    // Handle Android screen upload
    if (body.screens && body.gestures && body.redactions) {
      const result = await handleAndroidMetadataUpload({
        screens: body.screens,
        gestures: body.gestures,
        redactions: body.redactions,
        captureId: captureId,
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json(
        { message: "Upload successful" },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
