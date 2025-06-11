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

import { FrameData, Redaction } from "../types";
import AnnotationCard from "./annotation-card";
import Overlay from "./stage-overlay";
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

const MIN_PIXEL_SIZE = 8;

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
  getStage: () => any;
}

const CanvasComponent = forwardRef<CanvasRef, CanvasComponentProps>(
  function CanvasComponent({ screen, redactions, vh }, ref) {
    const [refMeasure, { width, height } = { width: 0, height: 0 }] =
      useMeasure();
    const containerRef = useRef<HTMLDivElement>(null);
    const { vhBoxes, rootBounds } = vh;

    const {
      mode,
      setMode,
      selected: selectedRedaction,
      selectRedaction,
      createRedaction,
      updateRedaction,
      deleteRedaction,
    } = useContext(RedactCanvasContext);

    const [newRect, setNewRect] = useState<Redaction | null>(null);
    const [stageScale, setStageScale] = useState(1);
    const [overlay, setOverlay] = useState<any>([]);
    const [isPanning, setIsPanning] = useState(false);

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);

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
      }
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

    // Load the image from the screen URL and calculate scaling
    const [image, imageStatus] = useImage(screen.src);
    // Calculate layout dimensions and offsets only when dependencies change.
    const { displayWidth, displayHeight, offsetX, offsetY } = useMemo(() => {
      // Return default values if image is not ready
      if (imageStatus !== 'loaded' || !image || !width || !height) {
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
      const scale =
        image && width && height
          ? Math.min(availableW! / image.width, availableH / image.height)
          : 1;
      const displayWidth = image ? image.width * scale : 0;
      const displayHeight = image ? image.height * scale : 0;
      const offsetX = image ? (width! - displayWidth) / 2 : 0;
      const offsetY = image ? vPadding + (availableH - displayHeight) / 2 : 0;
      return { displayWidth, displayHeight, offsetX, offsetY };
    }, [width, height, image]);

    // handler for mouse down event
    const handleStageMouseDown = useCallback(
      (e: any) => {
        const stage = e.target.getStage();
        const pointerPos = getRelativePointer(stage);
        if (!pointerPos) return;
        const clamp = (val: number) => Math.max(0, Math.min(val, 1));
        const normX = clamp((pointerPos.x - offsetX) / displayWidth);
        const normY = clamp((pointerPos.y - offsetY) / displayHeight);
        if (e.target === stage) {
          // Deselect any selected redaction when clicking on empty canvas
          selectRedaction(null);
        }
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
      [
        offsetX,
        offsetY,
        displayWidth,
        displayHeight,
        mode,
        getRelativePointer,
        selectRedaction,
      ]
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
      ]
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

          createRedaction(newRect, { select: true });
          setMode("select");
          setNewRect(null);
        }
      },
      [newRect, createRedaction, mode, setMode]
    );

    // function to update the rectangle properties
    const updateRect = useCallback(
      (id: string, rect: Partial<Redaction>) => {
        if (selectedRedaction) {
          updateRedaction(id, rect);
        }
      },
      [selectedRedaction, updateRedaction]
    );

    const handleBackgroundClick = (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        if (mode === "select") {
          // deselect redaction and clear annotation card overlay
          selectRedaction(null);
        }
      }
    }

    // handler for when user clicks a rectangle
    const handleRectClick = (_: any, id: string) => {
      if (mode === "eraser") {
        deleteRedaction(id);
      } else if (mode === "select") {
        selectRedaction(id);
      }
    };

    const handleTransform = useCallback(
      (e: any, id: string) => {
        const node = e.target;
        // read transform scale
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        // compute raw pixel dimensions (signed)
        const rawW = node.width() * scaleX;
        const rawH = node.height() * scaleY;
        // build a raw box to clamp
        const rawBox = {
          x: node.x(),
          y: node.y(),
          width: rawW,
          height: rawH,
        };
        // clamp using our boundBoxFunc
        const clamped = boundBoxFunc(selectedRedaction, rawBox);
        // convert to normalized coordinates
        const newX = (clamped.x - offsetX) / displayWidth;
        const newY = (clamped.y - offsetY) / displayHeight;
        const newW = clamped.width / displayWidth;
        const newH = clamped.height / displayHeight;
        // update React state once
        updateRect(id, { x: newX, y: newY, width: newW, height: newH });
        // reset scale and apply clamped pixel attrs
        node.scaleX(1);
        node.scaleY(1);
        node.setAttrs({
          x: clamped.x,
          y: clamped.y,
          width: clamped.width,
          height: clamped.height,
        });
        node.getLayer().batchDraw();
      },
      [offsetX, offsetY, displayWidth, displayHeight, updateRect]
    );

    const boundBoxFunc = (oldBox: any, newBox: any) => {
      const x0 = offsetX,
        y0 = offsetY;
      const maxW = displayWidth,
        maxH = displayHeight;
      const w = Math.max(MIN_PIXEL_SIZE, Math.min(newBox.width, maxW));
      const h = Math.max(MIN_PIXEL_SIZE, Math.min(newBox.height, maxH));
      const x = Math.min(Math.max(newBox.x, x0), x0 + maxW - w);
      const y = Math.min(Math.max(newBox.y, y0), y0 + maxH - h);
      return { ...oldBox, x, y, width: w, height: h };
    };

    const handleRectDelete = (e: any, id: string) => {
      deleteRedaction(id);
    }

    useEffect(() => {
      if (!stageRef.current) { return; }

      const stage = stageRef.current;
      const transformer = transformerRef.current;
      if (!stage || !transformer) return;

      if (mode !== "select") {
        selectRedaction(null);
        setOverlay((prev: any) =>
          prev.filter((o: any) => o.type !== `annotation`)
        );

        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
        return;
      }

      if (selectedRedaction) {
        const selectedNode = stage.findOne(
          `#redaction-${selectedRedaction.id}`
        );

        if (selectedNode) {
          transformer.nodes([selectedNode]);
          transformer.getLayer().batchDraw();

          setOverlay((prev: any) => [
            ...prev.filter((o: any) => o.type !== `annotation`),
            {
              type: "annotation",
              nodeId: `#redaction-${selectedRedaction.id}`,
              render: () => (
                <AnnotationCard
                  key={`annotation-${selectedRedaction.id}`}
                  annotation={selectedRedaction.annotation}
                  onChange={(value) => {
                    updateRect(selectedRedaction.id, {
                      annotation: value,
                    });
                  }}
                />
              ),
            },
          ]);
        } else {
          console.warn(
            `No node found for selected redaction with id: ${selectedRedaction.id}`
          );
        }
      } else {
        transformer.nodes([]);
        transformer.getLayer().batchDraw();
        setOverlay((prev: any) =>
          prev.filter((o: any) => o.type !== `annotation`)
        );
      }
    }, [selectedRedaction, mode, selectRedaction, updateRect]);

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    return (
      <div className="relative w-full h-full">
        <div
          ref={
            mergeRefs(
              refMeasure,
              containerRef
            ) as React.MutableRefObject<HTMLDivElement | null>
          }
          className={cn(
            "relative w-full h-full",
            mode === "select" && "cursor-normal",
            mode === "pencil" && "cursor-crosshair",
            mode === "eraser" && "cursor-normal"
          )}
        >
          <Stage
            ref={stageRef}
            width={width ?? 0}
            height={height ?? 0}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            draggable={mode === "select"}
            onWheel={() => setIsPanning(true)}
            onDragStart={() => setIsPanning(true)}
            onDragEnd={() => setIsPanning(false)}
            scaleX={stageScale}
            scaleY={stageScale}
          >
            <Layer>
              {imageStatus === 'loaded' && image && image.complete && (
                <KonvaImage
                  image={image}
                  x={offsetX}
                  y={offsetY}
                  width={displayWidth}
                  height={displayHeight}
                />
              )}
              {
                // add vh bouding boxes here
                rootBounds &&
                vhBoxes.map((box: vhBox, index: number) => (
                  <Rect
                    key={box.id + index}
                    x={(box.x / rootBounds.width) * displayWidth + offsetX}
                    y={(box.y / rootBounds.height) * displayHeight + offsetY}
                    width={(box.width / rootBounds.width) * displayWidth}
                    height={(box.height / rootBounds.height) * displayHeight}
                    stroke="red"
                    strokeWidth={1}
                  />
                ))
              }
              {imageStatus === "loaded"
                && image?.complete
                && (redactions || []).map((redaction) => (
                  <React.Fragment key={redaction.id}>
                    <RedactRectangle // redaction rectanges
                      redaction={redaction}
                      displayWidth={displayWidth}
                      displayHeight={displayHeight}
                      offsetX={offsetX}
                      offsetY={offsetY}
                      mode={mode}
                      selectRedaction={selectRedaction}
                      handleRectClick={handleRectClick}
                      handleTransform={handleTransform}
                      handleRectDelete={handleRectDelete}
                    />
                  </React.Fragment>
                ))}
              {newRect &&
                image && ( // draws rectangle while drawing
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
        </div>
        {/* {stageRef.current && (
          <Overlay stage={stageRef.current} overlays={overlay} isPanning={isPanning} />
        )} */}
        {stageRef.current && (
          <Overlay
            stage={stageRef.current}
            overlays={overlay}
            isPanning={isPanning}
            setIsPanning={setIsPanning}
          />
        )}
      </div>
    );
  }
);

export default CanvasComponent;
