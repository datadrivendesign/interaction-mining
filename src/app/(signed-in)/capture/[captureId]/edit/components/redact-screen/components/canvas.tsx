"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
  useContext,
} from "react";
import {
  Stage,
  Layer,
  Rect,
  Transformer,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import { useGesture } from "@use-gesture/react";
import { useMeasure } from "@uidotdev/usehooks";

import { FrameData, Redaction } from "../../types";
import AnnotationCard from "./annotation-card";
import { cn } from "@/lib/utils";
import {
  RedactCanvasContext,
  vhBox,
  vhRootBounds,
} from "./redact-screen-canvas";
import mergeRefs from "@/lib/utils/merge-refs";
import RedactRectangle from "./redact-rect";
import { useInvertedScroll } from "@/lib/hooks/useInvertedScroll";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import OverlayContainer, { Overlay } from "./stage-overlay";

const MIN_PIXEL_SIZE = 10;

const toEdges = (box: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  left: box.x,
  right: box.x + box.width,
  top: box.y,
  bottom: box.y + box.height,
});

const fromEdges = ({
  left,
  right,
  top,
  bottom,
  rotation = 0,
}: {
  left: number;
  right: number;
  top: number;
  bottom: number;
  rotation?: number;
}) => ({
  x: left,
  y: top,
  width: right - left,
  height: bottom - top,
  rotation,
});

export interface CanvasComponentProps {
  screen: FrameData;
  vh: {
    vhBoxes: vhBox[];
    rootBounds: vhRootBounds;
  };
  redactions: Redaction[];
  mode: "pencil" | "eraser" | "select";
}

export interface CanvasRef {
  getStage: () => Konva.Stage | null;
}

const CanvasComponent = forwardRef<CanvasRef, CanvasComponentProps>(
  function CanvasComponent({ screen, redactions, vh }, ref) {
    const [
      refMeasure,
      { width, height } = {
        width: 0,
        height: 0,
      },
    ] = useMeasure();
    const containerRef = useRef<HTMLDivElement>(null);
    const { vhBoxes, rootBounds } = vh;
    const {
      mode,
      setMode,
      selected: selectedRedactions,
      selectRedaction,
      createRedactions,
      updateRedaction,
      deleteRedaction,
    } = useContext(RedactCanvasContext);

    const [shiftDown, setShiftDown] = useState(false);
    const [newRect, setNewRect] = useState<Redaction | null>(null);
    const [stageScale, setStageScale] = useState(1);
    const [overlay, setOverlay] = useState<Array<Overlay>>([]);
    const [isPanning, setIsPanning] = useState(false);
    const stageRef = useRef<Konva.Stage | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const isInverted = useInvertedScroll();

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

          const invertFactor = isInverted ? 1 : -1; // invert based on user preference

          stage.position({
            x: currX + invertFactor * dX, // add the incremental movement
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

    // Helper to calculate pointer position accounting for current transform.
    const getRelativePointer = useCallback((stage: any) => {
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return null;
      const scale = stage.scaleX();
      const pos = {
        x: (pointerPos.x - stage.x()) / scale,
        y: (pointerPos.y - stage.y()) / scale,
      };
      return pos;
    }, []);

    // Calculate layout dimensions and offsets only when dependencies change.
    const [image, imageStatus] = useImage(screen.src, "anonymous");
    const { displayWidth, displayHeight, offsetX, offsetY } = useMemo(() => {
      // Return default values if image is not ready or has error
      if (imageStatus !== "loaded" || !image || !width || !height) {
        return {
          image: null,
          imageScale: 1,
          verticalPadding: 16,
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
      const availableH = height! - vPadding * 2;
      const fitScale =
        image && width && height
          ? Math.min(availableW! / image.width, availableH / image.height)
          : 1;
      // Start landscape frames at a smaller initial fit so they do not dominate
      // the redact focus area on first load.
      const initialScale =
        image && image.width > image.height ? fitScale * 0.5 : fitScale;
      const displayWidth = image ? image.width * initialScale : 0;
      const displayHeight = image ? image.height * initialScale : 0;
      const offsetX = image ? (width! - displayWidth) / 2 : 0;
      const offsetY = image ? vPadding + (availableH - displayHeight) / 2 : 0;
      return { displayWidth, displayHeight, offsetX, offsetY };
    }, [width, height, image, imageStatus]);

    // handler for mouse down event
    const handleStageMouseDown = useCallback(
      (e: any) => {
        const stage = e.target.getStage();
        const pointerPos = getRelativePointer(stage);
        if (!pointerPos) return;
        const clamp = (val: number) => Math.max(0, Math.min(val, 1));
        const normX = clamp((pointerPos.x - offsetX) / displayWidth);
        const normY = clamp((pointerPos.y - offsetY) / displayHeight);
        if (mode === "pencil") {
          setNewRect({
            id: `${Date.now()}`, // unique enough id for redaction
            x: normX,
            y: normY,
            width: 0,
            height: 0,
            annotation: "",
          });
        }
      },
      [offsetX, offsetY, displayWidth, displayHeight, mode, getRelativePointer],
    );

    // handler for mouse move event
    const handleStageMouseMove = useCallback(
      (e: any) => {
        const normalizedMinW = MIN_PIXEL_SIZE / displayWidth;
        const normalizedMinH = MIN_PIXEL_SIZE / displayHeight;
        if (mode === "pencil" && newRect) {
          const stage = e.target.getStage();
          const pointerPos = getRelativePointer(stage);
          if (!pointerPos) return;
          const clamp = (val: number) => Math.max(0, Math.min(val, 1));
          const normX = clamp((pointerPos.x - offsetX) / displayWidth);
          const normY = clamp((pointerPos.y - offsetY) / displayHeight);
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

    // handler for mouse up event
    const handleStageMouseUp = useCallback(
      (e: any) => {
        if (mode === "pencil" && newRect) {
          // Enforce minimum rectangle size in pixels:
          const pixelW = newRect.width * displayWidth;
          const pixelH = newRect.height * displayHeight;
          const minNormW = MIN_PIXEL_SIZE / displayWidth;
          const minNormH = MIN_PIXEL_SIZE / displayHeight;

          if (pixelW < MIN_PIXEL_SIZE) {
            // Adjust width to the minimum normalized width
            newRect.width = minNormW;
          }
          if (pixelH < MIN_PIXEL_SIZE) {
            // Adjust height to the minimum normalized height
            newRect.height = minNormH;
          }

          createRedactions([newRect], { select: true });
          setMode("select");
          setNewRect(null);
        }
      },
      [newRect, createRedactions, mode, setMode, displayWidth, displayHeight],
    );

    // function to update the rectangle properties
    const updateRect = useCallback(
      (id: string, rect: Partial<Redaction>) => {
        if (selectedRedactions) {
          updateRedaction(id, rect);
        }
      },
      [selectedRedactions, updateRedaction],
    );

    const handleBackgroundClick = (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        if (mode === "select") {
          // deselect redaction and clear annotation card overlay
          selectRedaction(null, false);
        }
      }
    };

    // handler for when user clicks a rectangle
    const handleRectClick = (_: any, id: string) => {
      if (mode === "eraser") {
        deleteRedaction([id]);
      } else if (mode === "select") {
        selectRedaction(id, shiftDown);
      }
    };

    const boundBoxFunc = useCallback(
      (oldBox: any, newBox: any) => {
        const stage = stageRef.current;
        const transformer = stage?.findOne(
          "Transformer",
        ) as Konva.Transformer | null;
        const activeAnchor =
          transformer && typeof transformer.getActiveAnchor === "function"
            ? transformer.getActiveAnchor()
            : null;
        const scale = stage?.scaleX() ?? 1;
        const boundsX = (stage?.x() ?? 0) + offsetX * scale;
        const boundsY = (stage?.y() ?? 0) + offsetY * scale;
        const boundsW = displayWidth * scale;
        const boundsH = displayHeight * scale;
        const minW = MIN_PIXEL_SIZE * scale;
        const minH = MIN_PIXEL_SIZE * scale;
        const boundsRight = boundsX + boundsW;
        const boundsBottom = boundsY + boundsH;

        const oldEdges = toEdges(oldBox);
        const newEdges = toEdges(newBox);
        const clamp = (value: number, min: number, max: number) =>
          Math.min(Math.max(value, min), max);

        let returnedBox;

        switch (activeAnchor) {
          case "middle-right": {
            const left = oldEdges.left;
            const right = clamp(newEdges.right, left + minW, boundsRight);
            returnedBox = fromEdges({
              left,
              right,
              top: oldEdges.top,
              bottom: oldEdges.bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          case "middle-left": {
            const right = oldEdges.right;
            const left = clamp(newEdges.left, boundsX, right - minW);
            returnedBox = fromEdges({
              left,
              right,
              top: oldEdges.top,
              bottom: oldEdges.bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          case "middle-bottom": {
            const top = oldEdges.top;
            const bottom = clamp(newEdges.bottom, top + minH, boundsBottom);
            returnedBox = fromEdges({
              left: oldEdges.left,
              right: oldEdges.right,
              top,
              bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          case "middle-top": {
            const bottom = oldEdges.bottom;
            const top = clamp(newEdges.top, boundsY, bottom - minH);
            returnedBox = fromEdges({
              left: oldEdges.left,
              right: oldEdges.right,
              top,
              bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          case "top-left": {
            const right = oldEdges.right;
            const bottom = oldEdges.bottom;
            const left = clamp(newEdges.left, boundsX, right - minW);
            const top = clamp(newEdges.top, boundsY, bottom - minH);
            returnedBox = fromEdges({
              left,
              right,
              top,
              bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          case "top-right": {
            const left = oldEdges.left;
            const bottom = oldEdges.bottom;
            const right = clamp(newEdges.right, left + minW, boundsRight);
            const top = clamp(newEdges.top, boundsY, bottom - minH);
            returnedBox = fromEdges({
              left,
              right,
              top,
              bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          case "bottom-left": {
            const right = oldEdges.right;
            const top = oldEdges.top;
            const left = clamp(newEdges.left, boundsX, right - minW);
            const bottom = clamp(newEdges.bottom, top + minH, boundsBottom);
            returnedBox = fromEdges({
              left,
              right,
              top,
              bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          case "bottom-right": {
            const left = oldEdges.left;
            const top = oldEdges.top;
            const right = clamp(newEdges.right, left + minW, boundsRight);
            const bottom = clamp(newEdges.bottom, top + minH, boundsBottom);
            returnedBox = fromEdges({
              left,
              right,
              top,
              bottom,
              rotation: oldBox.rotation ?? 0,
            });
            break;
          }
          default: {
            const w = Math.max(minW, Math.min(newBox.width, boundsW));
            const h = Math.max(minH, Math.min(newBox.height, boundsH));
            const x = Math.min(Math.max(newBox.x, boundsX), boundsRight - w);
            const y = Math.min(Math.max(newBox.y, boundsY), boundsBottom - h);
            returnedBox = { ...oldBox, x, y, width: w, height: h };
          }
        }

        return returnedBox;
      },
      [offsetX, offsetY, displayWidth, displayHeight],
    );

    const clampLocalBox = useCallback(
      (
        oldBox: { x: number; y: number; width: number; height: number },
        rawBox: { x: number; y: number; width: number; height: number },
      ) => {
        const x0 = offsetX;
        const y0 = offsetY;
        const maxW = displayWidth;
        const maxH = displayHeight;
        const w = Math.max(MIN_PIXEL_SIZE, Math.min(rawBox.width, maxW));
        const h = Math.max(MIN_PIXEL_SIZE, Math.min(rawBox.height, maxH));
        const x = Math.min(Math.max(rawBox.x, x0), x0 + maxW - w);
        const y = Math.min(Math.max(rawBox.y, y0), y0 + maxH - h);
        return {
          ...oldBox,
          x,
          y,
          width: w,
          height: h,
        };
      },
      [offsetX, offsetY, displayWidth, displayHeight],
    );

    const handleTransform = useCallback(
      (e: any, id: string) => {
        const node = e.target;
        const selectedRedaction = selectedRedactions.find((r) => r.id === id);
        if (!selectedRedaction) return;

        const oldBox = {
          x: selectedRedaction.x * displayWidth + offsetX,
          y: selectedRedaction.y * displayHeight + offsetY,
          width: selectedRedaction.width * displayWidth,
          height: selectedRedaction.height * displayHeight,
        };

        const rawBox = {
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
        };

        const clamped = clampLocalBox(oldBox, rawBox);
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
        offsetX,
        offsetY,
        displayWidth,
        displayHeight,
        selectedRedactions,
        updateRect,
        clampLocalBox,
      ],
    );

    const handleRectDelete = (e: any, id: string) => {
      deleteRedaction([id]);
    };

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Shift") {
          setShiftDown(true);
          return;
        }
        if (e.key === "Escape") {
          setNewRect(null);
        }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Shift") {
          setShiftDown(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, []);

    useEffect(() => {
      if (!stageRef.current) {
        return;
      }

      const stage = stageRef.current;
      const transformer = transformerRef.current;
      if (!stage || !transformer) return;

      if (mode !== "select") {
        selectRedaction(null, false);
        setOverlay((prev: any) =>
          prev.filter((o: any) => o.type !== `annotation`),
        );

        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
        return;
      }

      if (selectedRedactions.length > 0) {
        let selectors = "";
        for (let i = 0; i < selectedRedactions.length; i++) {
          const selectedRedaction = selectedRedactions[i];
          selectors += `#redaction-${selectedRedaction.id}`;
          if (i !== selectedRedactions.length - 1) {
            selectors += ", ";
          }
        }
        const selectedNodes = stage.find(selectors);
        transformer.nodes(selectedNodes);
        if (selectedNodes.length > 1) {
          transformer.resizeEnabled(false);
          transformer.rotateEnabled(false);
        } else {
          transformer.resizeEnabled(true);
          transformer.rotateEnabled(true);
        }
        transformer.getLayer()?.batchDraw();
        if (selectedNodes.length === 1) {
          setOverlay((prev: any) => [
            ...prev.filter((o: any) => o.type !== `annotation`),
            {
              type: "annotation",
              nodeId: `#redaction-${selectedRedactions[0].id}`,
              render: () => (
                <AnnotationCard
                  key={`annotation-${selectedRedactions[0].id}`}
                  annotation={selectedRedactions[0].annotation}
                  setAnnotation={(value) => {
                    updateRect(selectedRedactions[0].id, {
                      annotation: value,
                    });
                  }}
                />
              ),
            },
          ]);
        } else if (selectedNodes.length > 1) {
          setOverlay((prev: any) =>
            prev.filter((o: any) => o.type !== `annotation`),
          );
        } else {
          console.warn(
            `No node found for selected redaction with id: ${selectedNodes[0].id}`,
          );
        }
      } else {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
        setOverlay((prev: any) =>
          prev.filter((o: any) => o.type !== `annotation`),
        );
      }
    }, [selectedRedactions, mode, selectRedaction, updateRect]);

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    return (
      <div className="relative w-full h-full">
        <div
          ref={
            mergeRefs(
              refMeasure,
              containerRef,
            ) as React.MutableRefObject<HTMLDivElement | null>
          }
          className={cn(
            "relative w-full h-full",
            mode === "select" && "cursor-normal",
            mode === "pencil" && "cursor-crosshair",
            mode === "eraser" && "cursor-normal",
          )}
        >
          {imageStatus === "loaded" &&
            !!image &&
            image.complete &&
            offsetX > 0 &&
            offsetY > 0 &&
            displayWidth > 0 &&
            displayHeight > 0 && (
              <Stage
                ref={stageRef}
                width={width ?? 0}
                height={height ?? 0}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onClick={handleBackgroundClick}
                draggable={mode === "select"}
                onWheel={() => setIsPanning(true)}
                onDragStart={() => setIsPanning(true)}
                onDragEnd={() => setIsPanning(false)}
                scaleX={stageScale}
                scaleY={stageScale}
              >
                <Layer>
                  <KonvaImage
                    image={image}
                    x={offsetX}
                    y={offsetY}
                    width={displayWidth}
                    height={displayHeight}
                  />
                  {
                    // add vh bouding boxes here
                    rootBounds &&
                      vhBoxes.map((box: vhBox, index: number) => (
                        <Rect
                          key={box.id + index}
                          x={
                            (box.x / rootBounds.width) * displayWidth + offsetX
                          }
                          y={
                            (box.y / rootBounds.height) * displayHeight +
                            offsetY
                          }
                          width={(box.width / rootBounds.width) * displayWidth}
                          height={
                            (box.height / rootBounds.height) * displayHeight
                          }
                          stroke="red"
                          strokeWidth={1}
                        />
                      ))
                  }
                  {imageStatus === "loaded" &&
                    image &&
                    image.complete &&
                    image.naturalWidth > 0 &&
                    (redactions || []).map((redaction) => (
                      <React.Fragment key={redaction.id}>
                        <RedactRectangle
                          redaction={redaction}
                          displayWidth={displayWidth}
                          displayHeight={displayHeight}
                          offsetX={offsetX}
                          offsetY={offsetY}
                          mode={mode}
                          selectRedaction={(id) =>
                            selectRedaction(id, shiftDown)
                          }
                          handleRectClick={handleRectClick}
                          handleTransform={handleTransform}
                          handleRectDelete={handleRectDelete}
                        />
                      </React.Fragment>
                    ))}
                  {newRect && (
                    // draws rectangle while drawing
                    <Rect
                      x={newRect.x * displayWidth + offsetX}
                      y={newRect.y * displayHeight + offsetY}
                      width={newRect.width * displayWidth}
                      height={newRect.height * displayHeight}
                      fill="black"
                      opacity={0.5}
                    />
                  )}
                  {mode === "select" && (
                    <Transformer
                      boundBoxFunc={boundBoxFunc}
                      onTransformStart={() => setIsPanning(true)}
                      onTransformEnd={() => setIsPanning(false)}
                      flipEnabled={false}
                      keepRatio={false}
                      rotateEnabled={false}
                      ref={transformerRef}
                    />
                  )}
                </Layer>
              </Stage>
            )}
        </div>
        {stageRef.current && (
          <OverlayContainer
            stage={stageRef.current}
            overlays={overlay}
            isPanning={isPanning}
            setIsPanning={setIsPanning}
          />
        )}
      </div>
    );
  },
);

export default CanvasComponent;
