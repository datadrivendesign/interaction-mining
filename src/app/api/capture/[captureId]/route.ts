import { NextRequest, NextResponse } from 'next/server';
import { getCapture, getTask } from '@/lib/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ captureId: string }> }
) {
  try {
    const { captureId } = await params;
    const result = await getCapture({ id: captureId });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    const taskId = result.data.taskId;  
    let taskDetails = null;

    if (taskId) {
      try {
        taskDetails = await getTask(taskId);
      } catch (taskError) {
        console.error('Error fetching task:', taskError);
      }
    }

    console.log('Capture:', result.data);
    console.log('Task:', taskDetails);

    return NextResponse.json({
      capture: {
        id: result.data.id,
        appId: result.data.appId,
        otp: result.data.otp,
        src: result.data.src,
      },
      task: taskDetails ? {
        id: taskDetails.id,
        os: taskDetails.os,
        description: taskDetails.description,
        traceIds: taskDetails.traceIds,
      } : null
    });

  } catch (error) {
    console.error('Endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}