import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedCaptureUploadImg } from '@/lib/actions';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ captureId: string }> }
) {
    try {
        const { captureId } = await params;
        const body = await request.json();
        const files = body.files;

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json(
                { error: 'Files array is required and cannot be empty.' },
                { status: 400 }
            );
        }

        const presignedUrls = [];

        for (const file of files) {
            const { fileType } = file;

            if (!fileType) {
                return NextResponse.json(
                    { error: 'Each file must have a fileType' },
                    { status: 400 }
                );
            }

            const presignedUrlResult = await generatePresignedCaptureUploadImg(
                captureId,
                fileType
            );

            if (!presignedUrlResult.ok) {
                return NextResponse.json(
                    {
                        ok: presignedUrlResult.ok,
                        message: presignedUrlResult.message,
                    },
                    { status: 400 }
                );
            }

            presignedUrls.push({
                uploadUrl: presignedUrlResult.data.uploadUrl,
                fileKey: `${presignedUrlResult.data.fileKey}`,
                fileUrl: `${presignedUrlResult.data.fileUrl}`
            });
        }

        return NextResponse.json({ presignedUrls });
    } catch (error) {
        console.error('Error in POST /upload:', error);
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        );
    }
}
