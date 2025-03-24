"use client"

import React, { Dispatch, SetStateAction, useRef } from 'react'
import { Button } from '@/components/ui/button';
import FrameGallery from './extract-frames-gallery';
import { fileFetcher } from '../../start/util';
import useSWR from 'swr';

export type FrameData = {
  url: string,
  timestamp: number
}

const ExtractFrames = ({ 
  capture, 
  frames, 
  setFrames 
}: { 
  capture: any, 
  frames: FrameData[], 
  setFrames:  Dispatch<SetStateAction<FrameData[]>> 
}) => {
  const videoRef = useRef<HTMLVideoElement|null>(null)

  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher,
    {
      refreshInterval: 10,
    }
  );

  /**
   * Extracts frame from the video at current timestamp
   * @param video HTML object of video element to extract from
   */
  function extractVideoFrame(
    video: HTMLVideoElement
  ): Promise<FrameData> {
    return new Promise(
      async (
        resolve: (frame: FrameData) => void, 
        reject: (error: string) => void
      ) => {
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        let context: CanvasRenderingContext2D|null = canvas.getContext("2d");
        if (context === null) {
          console.error("HTML canvas could not get 2d context")
          reject("canvas creation error")
          return
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let time = video.currentTime;
  
        let eventCallback = () => {
          video.removeEventListener("seeked", eventCallback);
          storeFrame(video, context, canvas, time, resolve);
        };
        video.addEventListener("seeked", eventCallback);
        video.currentTime = time;
      }
    );
  }
  
  function storeFrame(
    video: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    time: number,
    resolve: (frame: FrameData) => void
  ) {
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    resolve({
      "url": canvas.toDataURL(),
      "timestamp": time
    });
  }
  

  return (
    <div className="relative flex flex-col w-full grow min-h-dvh">
      {/* <div className="sticky top-16 z-40 flex flex-col md:flex-col mb-4 md:mb-8 p-4 md:px-16 items-start bg-white dark:bg-black border-b-2 border-neutral-100 dark:border-neutral-900">
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 md:mb-0">
          Frame Extraction
        </h1>
      </div> */}
      <main className="relative flex flex-row justify-around w-full max-w-(--breakpoint-1xl) mb-4 md:mb-8 p-4 md:px-16 ">
        {!isCapturesLoading && captures.length > 0 ? (
          <div className='flex flex-col justify-start items-center'>
            <video
              crossOrigin="anonymous"
              className='relative sticky top-50 mb-8 md:mb-12'
              controls
              width={220}
              height={480}
              ref={videoRef}
            >
              <source src={captures[0].fileUrl} type="video/mp4" />
            </video>
            <Button
            className='sticky top-178'
              onClick={async () => {
                if (videoRef.current !== null) {                
                  const frame = await extractVideoFrame(videoRef.current);
                  setFrames(
                    (prev) => [...prev, frame].sort(
                      (a, b) => a.timestamp - b.timestamp
                    )
                  );
                }
              }}
            >
              Extract Frame
            </Button>
          </div>
        ) : (
          <></>
        )}
        {(frames.length > 0 ||  
          videoRef.current != null) &&
          <FrameGallery 
            frameData={frames} 
            setFrameData={setFrames}
            video={videoRef.current} />
        }
      </main>
    </div>
  )
}

export default ExtractFrames