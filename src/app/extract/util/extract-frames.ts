import { FrameData } from "../page";

/**
 * Extracts frame from the video at current timestamp
 * @param video HTML object of video element to extract from
 */
export function extractVideoFrame(
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
