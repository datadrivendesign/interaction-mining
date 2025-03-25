"use client"
import React from 'react'
import { FrameData } from './extract-frames'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function SaveTrace({
  data
}: {
  data: FrameData[]
}) {
  return (
    <div className='w-full h-[calc(100dvh-var(--nav-height))] p-8'>
      <SaveTraceGallery frames={data} />
      <div className='p-8'>
        <Label htmlFor='message'>Trace Description</Label>
        <Textarea placeholder="Give your trace a description" />
      </div>
    </div>
  )
}

function SaveTraceGallery({
    frames
  }: {
    frames: FrameData[]
  }) {
    return(
        <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
        {frames.map((frame, index) => (
          <div 
            className='flex flex-col items-center justify-center'
            key={`${frame.timestamp}-${index}`}
          >
            <Image 
              className="h-auto max-w-full rounded-lg"
              src={frame.url}
              width={183}
              height={400} 
              alt={`extracted frame at ${frame.timestamp}`} >
            </Image>
          </div>
        ))}
      </div>
    )
}