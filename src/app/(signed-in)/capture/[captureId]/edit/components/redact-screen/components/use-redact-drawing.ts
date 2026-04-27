import { useCallback, useState } from "react";
import Konva from "konva";
import { Redaction } from "../../types";
import { MIN_PIXEL_SIZE } from "./redact-geometry";

interface ImageRect {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
}

interface UseRedactDrawingArgs {
  mode: "pencil" | "eraser" | "select";
  imageRect: ImageRect;
  setMode: (mode: "pencil" | "eraser" | "select") => void;
  createRedactions: (
    redactions: Redaction[],
    options?: { select?: boolean },
  ) => void;
  getRelativePointer: (stage: Konva.Stage) => { x: number; y: number } | null;
}

const clamp01 = (val: number) => Math.max(0, Math.min(val, 1));

export function useRedactDrawing({
  mode,
  imageRect,
  setMode,
  createRedactions,
  getRelativePointer,
}: UseRedactDrawingArgs) {
  const { offsetX, offsetY, displayWidth, displayHeight } = imageRect;
  const [newRect, setNewRect] = useState<Redaction | null>(null);

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointerPos = getRelativePointer(stage);
      if (!pointerPos) return;
      const normX = clamp01((pointerPos.x - offsetX) / displayWidth);
      const normY = clamp01((pointerPos.y - offsetY) / displayHeight);
      if (mode === "pencil") {
        setNewRect({
          id: `${Date.now()}`,
          x: normX,
          y: normY,
          width: 0,
          height: 0,
          annotation: "",
        });
      }
    },
    [
      offsetX,
      offsetY,
      displayWidth,
      displayHeight,
      mode,
      getRelativePointer,
    ],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const normalizedMinW = MIN_PIXEL_SIZE / displayWidth;
      const normalizedMinH = MIN_PIXEL_SIZE / displayHeight;
      if (mode === "pencil" && newRect) {
        const stage = e.target.getStage();
        if (!stage) return;
        const pointerPos = getRelativePointer(stage);
        if (!pointerPos) return;
        const normX = clamp01((pointerPos.x - offsetX) / displayWidth);
        const normY = clamp01((pointerPos.y - offsetY) / displayHeight);
        setNewRect({
          ...newRect,
          x: Math.min(newRect.x, normX),
          y: Math.min(newRect.y, normY),
          width: Math.max(normalizedMinW, Math.abs(normX - newRect.x)),
          height: Math.max(normalizedMinH, Math.abs(normY - newRect.y)),
        });
      }
    },
    [
      newRect,
      mode,
      offsetX,
      offsetY,
      displayWidth,
      displayHeight,
      getRelativePointer,
    ],
  );

  const handleStageMouseUp = useCallback(() => {
    if (mode === "pencil" && newRect) {
      const pixelW = newRect.width * displayWidth;
      const pixelH = newRect.height * displayHeight;
      const minNormW = MIN_PIXEL_SIZE / displayWidth;
      const minNormH = MIN_PIXEL_SIZE / displayHeight;

      const finalRect: Redaction = {
        ...newRect,
        width: pixelW < MIN_PIXEL_SIZE ? minNormW : newRect.width,
        height: pixelH < MIN_PIXEL_SIZE ? minNormH : newRect.height,
      };

      createRedactions([finalRect], { select: true });
      setMode("select");
      setNewRect(null);
    }
  }, [newRect, createRedactions, mode, setMode, displayWidth, displayHeight]);

  const cancelDrawing = useCallback(() => {
    setNewRect(null);
  }, []);

  return {
    newRect,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    cancelDrawing,
  };
}
