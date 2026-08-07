import { FrameData } from "../../../types";

export const MAX_TIMELINE_THUMBS = 35;
export const TIMELINE_THUMB_HEIGHT = 128;
export const PREVIEW_THUMB_HEIGHT = 1440;
export const TIMELINE_THUMB_JPEG_QUALITY = 0.84;
export const PREVIEW_THUMB_JPEG_QUALITY = 0.9;
/**
 * Minimum gap between seeks while scrubbing.
 *
 * Exists because assigning `currentTime` while a seek is in flight aborts it and
 * starts over, so an unthrottled drag could thrash the decoder badly enough that
 * no seek ever completed — the original reason scrubbing appeared to break.
 *
 * Measured seek-to-frame-presented latency is 14-38ms median and 30-93ms at p95
 * across Chrome and Safari, so the old 125ms was throttling several times slower
 * than the hardware and holding back both the frame rate during a drag and how
 * quickly the real frame appears once the pointer stops.
 */
export const SCRUB_SEEK_INTERVAL_MS = 70;
export const FRAME_STEP_SECONDS = 1 / 30;
export const STEP_COMMIT_DELAY_MS = 120;
export const PREVIEW_SWAP_DELAY_MS = 70;
/**
 * How close the landed frame has to be to the requested moment before the real
 * video can replace the thumbnail. Browsers snap to the nearest decodable frame,
 * so an exact match never holds; two frames at 30fps is close enough that the
 * element is showing what was asked for.
 */
export const PREVIEW_MATCH_TOLERANCE = 2 / 30;
/**
 * Backstop for uncovering the video when `requestVideoFrameCallback` is missing
 * or never fires — which is every paused seek in Safari, so this is the normal
 * path there rather than an edge case. It is only armed once the seek for the
 * current target has completed, so the frame is already painted or about to be;
 * a quarter second of extra thumbnail was just latency.
 */
export const PREVIEW_REVEAL_TIMEOUT_MS = 100;
/** Profiling only: how long to wait for a swapped-in thumbnail to report loading. */
export const PREVIEW_SWAP_WATCHDOG_MS = 600;
export const VIDEO_LOAD_TIMEOUT_MS = 30000;

export type PreviewThumbnail = {
  src: string;
  timestamp: number;
  width: number;
  height: number;
};

export function findNearestScreenIndex(
  screens: FrameData[],
  time: number,
): number {
  if (!Number.isFinite(time) || screens.length === 0) {
    return -1;
  }

  let nearestIndex = 0;
  let nearestDelta = Math.abs(screens[0].timestamp - time);

  for (let index = 1; index < screens.length; index += 1) {
    const delta = Math.abs(screens[index].timestamp - time);
    if (delta < nearestDelta) {
      nearestIndex = index;
      nearestDelta = delta;
    }
  }

  return nearestIndex;
}

export function findNearestPreviewThumbnail(
  thumbnails: PreviewThumbnail[],
  time: number,
): PreviewThumbnail | null {
  if (thumbnails.length === 0) {
    return null;
  }

  return thumbnails.reduce((closest, thumbnail) =>
    Math.abs(thumbnail.timestamp - time) < Math.abs(closest.timestamp - time)
      ? thumbnail
      : closest,
  );
}

export function revokeBlobUrls(urls: Iterable<string>): void {
  for (const url of urls) {
    if (typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}
