// app/api/capture/[captureId]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleAndroidScreenUpload, processCaptureFiles, updateCapture } from '@/lib/actions';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ captureId: string }> }
) {
    try {
        const { captureId } = await params;
        const body = await request.json();
        

        // Handle Android screen upload
        if (body.vh && body.img && body.created && body.gesture) {
            const result = await handleAndroidScreenUpload({
                vh: body.vh,
                img: body.img,
                created: body.created,
                gesture: body.gesture,
                captureId: captureId
            });

            if (!result.ok) {
                return NextResponse.json(
                    { error: result.message },
                    { status: 400 }
                );
            }

            console.log('Upload successful');
            console.log("update capture with url")
            const capture = await updateCapture(captureId, {
                src: result.data.url
            })
            console.log("updated capture:", capture)

            processCaptureFiles(result.data.fileKey);

            return NextResponse.json(
                { message: 'Upload successful'},
                { status: 200 }
            );
        }
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}