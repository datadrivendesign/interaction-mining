import { Ref, useCallback, useMemo, useRef, useState } from "react";
import Konva from "konva";
import useImage from "use-image";
import { useGesture } from "@use-gesture/react";
import { useMeasure } from "@uidotdev/usehooks";
import { useInvertedScroll } from "@/lib/hooks/useInvertedScroll";
import mergeRefs from "@/lib/utils/merge-refs";

interface UseRedactStageViewportArgs {
  imageSrc: string;
}

export interface ImageRect {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
}

/**
 * Owns the redact canvas viewport: image loading, fit math, and pan/zoom
 * gesture wiring. Returns a callback ref to attach to the Stage's wrapping div
 * (combining `useMeasure` and the gesture target).
 */
export function useRedactStageViewport({
  imageSrc,
}: UseRedactStageViewportArgs) {
  const [
    refMeasure,
    { width: measuredWidth, height: measuredHeight } = {
      width: 0,
      height: 0,
    },
  ] = useMeasure();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerCallbackRef = useMemo(
    () =>
      mergeRefs(
        refMeasure as Ref<HTMLDivElement>,
        containerRef,
      ) as Ref<HTMLDivElement>,
    [refMeasure],
  );

  const stageRef = useRef<Konva.Stage | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  const isInverted = useInvertedScroll();

  const width = measuredWidth ?? 0;
  const height = measuredHeight ?? 0;

  const [image, imageStatus] = useImage(imageSrc, "anonymous");

  const imageRect = useMemo<ImageRect>(() => {
    if (imageStatus !== "loaded" || !image || !width || !height) {
      return {
        displayWidth: 0,
        displayHeight: 0,
        offsetX: 0,
        offsetY: 0,
      };
    }

    const vPadding =
      typeof window !== "undefined"
        ? parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 16;
    const availableW = width;
    const availableH = height - vPadding * 2;
    const fitScale = Math.min(
      availableW / image.width,
      availableH / image.height,
    );
    // Start landscape frames at a smaller initial fit so they do not dominate
    // the redact focus area on first load.
    const initialScale = image.width > image.height ? fitScale * 0.5 : fitScale;
    const displayWidth = image.width * initialScale;
    const displayHeight = image.height * initialScale;
    const offsetX = (width - displayWidth) / 2;
    const offsetY = vPadding + (availableH - displayHeight) / 2;
    return { displayWidth, displayHeight, offsetX, offsetY };
  }, [width, height, image, imageStatus]);

  // useGesture handles pinch (for zoom) and drag (for pan).
  useGesture(
    {
      onPinch: ({ offset: [newScale], memo }) => {
        const stage = stageRef.current;
        if (!stage) return;
        if (!memo) {
          const pointer = stage.getPointerPosition();
          if (!pointer) return;
          const oldScale = stage.scaleX();
          memo = {
            mousePointTo: {
              x: (pointer.x - stage.x()) / oldScale,
              y: (pointer.y - stage.y()) / oldScale,
            },
          };
        }
        const pointer = stage.getPointerPosition();
        if (!pointer) return memo;
        stage.scale({ x: newScale, y: newScale });
        const newPos = {
          x: pointer.x - memo.mousePointTo.x * newScale,
          y: pointer.y - memo.mousePointTo.y * newScale,
        };
        stage.position(newPos);
        stage.batchDraw();
        setStageScale(newScale);
        return memo;
      },
      onWheel: ({ delta, event: e }) => {
        e.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const [dX, dY] = delta;
        const currX = stage.x();
        const currY = stage.y();

        const invertFactor = isInverted ? 1 : -1;

        stage.position({
          x: currX + invertFactor * dX,
          y: currY + invertFactor * dY,
        });
        stage.batchDraw();
      },
      onWheelEnd: () => {
        setIsPanning(false);
      },
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      pinch: { from: () => [stageScale, 0] },
      wheel: {
        from: () =>
          stageRef.current
            ? [stageRef.current.x(), stageRef.current.y()]
            : [0, 0],
      },
    },
  );

  const getRelativePointer = useCallback((stage: Konva.Stage) => {
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;
    const scale = stage.scaleX();
    return {
      x: (pointerPos.x - stage.x()) / scale,
      y: (pointerPos.y - stage.y()) / scale,
    };
  }, []);

  return {
    containerCallbackRef,
    stageRef,
    width,
    height,
    image,
    imageStatus,
    imageRect,
    stageScale,
    isPanning,
    setIsPanning,
    getRelativePointer,
  };
}
