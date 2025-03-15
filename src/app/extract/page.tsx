"use client"

import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { extractVideoFrame } from './util/extract-frames';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import FrameGallery from './component/frame-gallery';

export type FrameData = {
  url: string,
  timestamp: number
}

const Page = () => {
  const params = useSearchParams();
  let videoUrl = params.get("videoUrl") ?? "Clock.mp4" as string;
  const videoRef = useRef<HTMLVideoElement|null>(null)
  const [extractedFrames, setExtractedFrames] = useState<FrameData[]>([])

  return (
  <div className="relative flex flex-col w-full grow min-h-dvh">
    <div className="sticky top-16 z-40 flex flex-col md:flex-col mb-4 md:mb-8 p-4 md:px-16 items-start bg-white dark:bg-black border-b-2 border-neutral-100 dark:border-neutral-900">
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 md:mb-0">
        Frame Extraction
      </h1>
    </div>
    <main className="relative flex flex-row justify-around w-full max-w-(--breakpoint-1xl) mb-4 md:mb-8 p-4 md:px-16 ">
      {videoUrl !== "" ? (
        <div className='flex flex-col justify-start items-center'>
          <video
            crossOrigin="anonymous"
            className='relative sticky top-50 mb-8 md:mb-12'
            controls
            width={220}
            height={480}
            ref={videoRef}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <Button
          className='sticky top-178'
            onClick={async () => {
              if (videoRef.current !== null) {                
                const frame = await extractVideoFrame(videoRef.current);
                setExtractedFrames(
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
      {extractedFrames?.length > 0 && 
        videoRef.current != null &&
        <FrameGallery 
          frameData={extractedFrames} 
          setFrameData={setExtractedFrames}
          video={videoRef.current} />
      }
      </main>
    </div>
  )
}

export default Page