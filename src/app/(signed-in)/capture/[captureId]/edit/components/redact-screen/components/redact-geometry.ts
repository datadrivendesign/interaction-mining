export const MIN_PIXEL_SIZE = 10;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface BoxEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface TransformBounds {
  /** Stage-space x of the image origin. */
  boundsX: number;
  /** Stage-space y of the image origin. */
  boundsY: number;
  /** Stage-space width of the image. */
  boundsW: number;
  /** Stage-space height of the image. */
  boundsH: number;
  /** Minimum width of a redaction in stage space. */
  minW: number;
  /** Minimum height of a redaction in stage space. */
  minH: number;
}

export const toEdges = (box: Box): BoxEdges => ({
  left: box.x,
  right: box.x + box.width,
  top: box.y,
  bottom: box.y + box.height,
});

export const fromEdges = ({
  left,
  right,
  top,
  bottom,
  rotation = 0,
}: BoxEdges & { rotation?: number }): Box => ({
  x: left,
  y: top,
  width: right - left,
  height: bottom - top,
  rotation,
});

export const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Clamp a transformed Konva box to the image bounds, anchored to the side or
 * corner indicated by `activeAnchor`. Operates entirely in transformed/stage
 * space — caller is responsible for converting to/from local image space.
 */
export function clampToAnchor(
  activeAnchor: string | null,
  oldBox: Box,
  newBox: Box,
  bounds: TransformBounds,
): Box {
  const { boundsX, boundsY, boundsW, boundsH, minW, minH } = bounds;
  const boundsRight = boundsX + boundsW;
  const boundsBottom = boundsY + boundsH;
  const oldEdges = toEdges(oldBox);
  const newEdges = toEdges(newBox);
  const rotation = oldBox.rotation ?? 0;

  switch (activeAnchor) {
    case "middle-right": {
      const left = oldEdges.left;
      const right = clampValue(newEdges.right, left + minW, boundsRight);
      return fromEdges({ left, right, top: oldEdges.top, bottom: oldEdges.bottom, rotation });
    }
    case "middle-left": {
      const right = oldEdges.right;
      const left = clampValue(newEdges.left, boundsX, right - minW);
      return fromEdges({ left, right, top: oldEdges.top, bottom: oldEdges.bottom, rotation });
    }
    case "middle-bottom": {
      const top = oldEdges.top;
      const bottom = clampValue(newEdges.bottom, top + minH, boundsBottom);
      return fromEdges({ left: oldEdges.left, right: oldEdges.right, top, bottom, rotation });
    }
    case "middle-top": {
      const bottom = oldEdges.bottom;
      const top = clampValue(newEdges.top, boundsY, bottom - minH);
      return fromEdges({ left: oldEdges.left, right: oldEdges.right, top, bottom, rotation });
    }
    case "top-left": {
      const right = oldEdges.right;
      const bottom = oldEdges.bottom;
      const left = clampValue(newEdges.left, boundsX, right - minW);
      const top = clampValue(newEdges.top, boundsY, bottom - minH);
      return fromEdges({ left, right, top, bottom, rotation });
    }
    case "top-right": {
      const left = oldEdges.left;
      const bottom = oldEdges.bottom;
      const right = clampValue(newEdges.right, left + minW, boundsRight);
      const top = clampValue(newEdges.top, boundsY, bottom - minH);
      return fromEdges({ left, right, top, bottom, rotation });
    }
    case "bottom-left": {
      const right = oldEdges.right;
      const top = oldEdges.top;
      const left = clampValue(newEdges.left, boundsX, right - minW);
      const bottom = clampValue(newEdges.bottom, top + minH, boundsBottom);
      return fromEdges({ left, right, top, bottom, rotation });
    }
    case "bottom-right": {
      const left = oldEdges.left;
      const top = oldEdges.top;
      const right = clampValue(newEdges.right, left + minW, boundsRight);
      const bottom = clampValue(newEdges.bottom, top + minH, boundsBottom);
      return fromEdges({ left, right, top, bottom, rotation });
    }
    default: {
      const w = Math.max(minW, Math.min(newBox.width, boundsW));
      const h = Math.max(minH, Math.min(newBox.height, boundsH));
      const x = Math.min(Math.max(newBox.x, boundsX), boundsRight - w);
      const y = Math.min(Math.max(newBox.y, boundsY), boundsBottom - h);
      return { ...oldBox, x, y, width: w, height: h };
    }
  }
}

/**
 * Clamp a box to live entirely within the image rectangle (in image-local
 * space, not transformed/stage space). Used during drag/transform commit.
 */
export function clampLocalBox(
  oldBox: Box,
  rawBox: Box,
  imageRect: {
    offsetX: number;
    offsetY: number;
    displayWidth: number;
    displayHeight: number;
  },
): Box {
  const { offsetX, offsetY, displayWidth, displayHeight } = imageRect;
  const w = Math.max(MIN_PIXEL_SIZE, Math.min(rawBox.width, displayWidth));
  const h = Math.max(MIN_PIXEL_SIZE, Math.min(rawBox.height, displayHeight));
  const x = Math.min(Math.max(rawBox.x, offsetX), offsetX + displayWidth - w);
  const y = Math.min(Math.max(rawBox.y, offsetY), offsetY + displayHeight - h);
  return {
    ...oldBox,
    x,
    y,
    width: w,
    height: h,
  };
}
