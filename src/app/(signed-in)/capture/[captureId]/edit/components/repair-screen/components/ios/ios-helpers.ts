import { FrameData } from "../../../types";

export const MAX_TIMELINE_THUMBS = 35;
export const TIMELINE_THUMB_HEIGHT = 128;
export const PREVIEW_THUMB_HEIGHT = 1440;
export const TIMELINE_THUMB_JPEG_QUALITY = 0.84;
export const PREVIEW_THUMB_JPEG_QUALITY = 0.9;
export const SCRUB_SEEK_INTERVAL_MS = 125;
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
