import { RefObject, useCallback } from "react";
import Konva from "konva";
import { Redaction } from "../../types";
import {
  Box,
  MIN_PIXEL_SIZE,
  clampLocalBox,
  clampToAnchor,
} from "./redact-geometry";

interface ImageRect {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
}

interface UseRedactTransformArgs {
  imageRect: ImageRect;
  stageRef: RefObject<Konva.Stage | null>;
  selectedRedactions: Redaction[];
  updateRect: (id: string, rect: Partial<Redaction>) => void;
}

export function useRedactTransform({
  imageRect,
  stageRef,
  selectedRedactions,
  updateRect,
}: UseRedactTransformArgs) {
  const { offsetX, offsetY, displayWidth, displayHeight } = imageRect;

  const boundBoxFunc = useCallback(
    (oldBox: Box, newBox: Box) => {
      const stage = stageRef.current;
      const transformer = stage?.findOne(
        "Transformer",
      ) as Konva.Transformer | null;
      const activeAnchor =
        transformer && typeof transformer.getActiveAnchor === "function"
          ? transformer.getActiveAnchor()
          : null;
      const scale = stage?.scaleX() ?? 1;

      return clampToAnchor(activeAnchor, oldBox, newBox, {
        boundsX: (stage?.x() ?? 0) + offsetX * scale,
        boundsY: (stage?.y() ?? 0) + offsetY * scale,
        boundsW: displayWidth * scale,
        boundsH: displayHeight * scale,
        minW: MIN_PIXEL_SIZE * scale,
        minH: MIN_PIXEL_SIZE * scale,
      });
    },
    [stageRef, offsetX, offsetY, displayWidth, displayHeight],
  );

  const handleTransform = useCallback(
    (e: Konva.KonvaEventObject<Event>, id: string) => {
      const node = e.target as Konva.Node;
      const selectedRedaction = selectedRedactions.find((r) => r.id === id);
      if (!selectedRedaction) return;

      const oldBox: Box = {
        x: selectedRedaction.x * displayWidth + offsetX,
        y: selectedRedaction.y * displayHeight + offsetY,
        width: selectedRedaction.width * displayWidth,
        height: selectedRedaction.height * displayHeight,
        rotation: 0,
      };

      const rawBox: Box = {
        x: node.x(),
        y: node.y(),
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY(),
        rotation: 0,
      };

      const clamped = clampLocalBox(oldBox, rawBox, imageRect);
      const newX = (clamped.x - offsetX) / displayWidth;
      const newY = (clamped.y - offsetY) / displayHeight;
      const newW = clamped.width / displayWidth;
      const newH = clamped.height / displayHeight;

      updateRect(id, { x: newX, y: newY, width: newW, height: newH });

      node.scaleX(1);
      node.scaleY(1);
      node.setAttrs({
        x: clamped.x,
        y: clamped.y,
        width: clamped.width,
        height: clamped.height,
      });

      node.getLayer()?.batchDraw();
    },
    [
      imageRect,
      offsetX,
      offsetY,
      displayWidth,
      displayHeight,
      selectedRedactions,
      updateRect,
    ],
  );

  return { boundBoxFunc, handleTransform };
}
