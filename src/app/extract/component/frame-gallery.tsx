import Image from 'next/image'
import React from 'react'
import { FrameData } from '../page'
import { X } from 'lucide-react'
import { prettyNumber } from '@/lib/utils/number'

export const FrameGallery = ({
  frameData, 
  setFrameData, 
  video
}: {
  frameData: FrameData[], 
  setFrameData: React.Dispatch<React.SetStateAction<FrameData[]>>
  video: HTMLVideoElement
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {frameData.map((frame, index) => (
        <div 
          className='flex flex-col items-center justify-center'
          key={`${frame.timestamp}-${index}`}
        >
          <button 
            onClick={() => setFrameData(
              prev => [...prev.slice(0, index), ...prev.slice(index+1)]
            )}
            className="inline-flex self-end items-center cursor-pointer"
          >
            <X 
              color='white'
              className="size-4 text-neutral-500 hover:opacity-75" 
            />
          </button>
          <Image 
            className="h-auto max-w-full rounded-lg"
            src={frame.url}
            width={220}
            height={480} 
            alt={`extracted frame at ${frame.timestamp}`} >
          </Image>
          <a
            className='cursor-pointer text-blue-300'
            onClick={() => video.currentTime = frame.timestamp}
          >
            {`Timestamp: ${prettyNumber(frame.timestamp)}s`}
          </a>
        </div>
      ))}
    </div>
  )
}

export default FrameGallery