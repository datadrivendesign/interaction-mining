// app/api/capture/[captureId]/upload/metadata/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleAndroidMetadataUpload } from "@/lib/actions";
import { objectIdSchema } from "@/lib/aws/s3/upload-purpose";
import { androidMetadataUploadSchema } from "@/lib/aws/s3/android-upload";
import { badRequest, readJsonBody } from "../responses";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ captureId: string }> },
) {
  try {
    const { captureId } = await params;

    // Validate before this reaches Prisma or an S3 object key.
    const captureIdResult = objectIdSchema.safeParse(captureId);
    if (!captureIdResult.success) {
      return badRequest("Invalid capture id.");
    }

    const body = await readJsonBody(request);
    if (!body.ok) {
      return badRequest("Malformed JSON body.");
    }

    const parsed = androidMetadataUploadSchema.safeParse(body.value);
    if (!parsed.success) {
      return badRequest("Invalid request body.", parsed.error.issues);
    }

    const result = await handleAndroidMetadataUpload({
      ...(parsed.data as Parameters<typeof handleAndroidMetadataUpload>[0]),
      captureId: captureIdResult.data,
    });

    if (!result.ok) {
      return badRequest(result.message);
    }

    return NextResponse.json({ message: "Upload successful" }, { status: 200 });
  } catch (error) {
    console.error("Metadata upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
