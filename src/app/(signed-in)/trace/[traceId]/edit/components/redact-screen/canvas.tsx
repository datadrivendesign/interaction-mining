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
import Konva from "konva";
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
import { cn } from "@/lib/utils";
import mergeRefs from "@/lib/utils/merge-refs";

import { Screen } from "@prisma/client";
import AnnotationCard from "./annotation-card";
import Overlay from "./stage-overlay";
import { RedactCanvasContext } from "./redact-screen-canvas";
import RedactRectangle from "./redact-rect";
import { Redaction } from "../types";

export interface CanvasComponentProps {
  screen: Screen;
  redactions: Redaction[];
  mode: "pencil" | "eraser" | "select";
}

export interface CanvasRef {
  getStage: () => any;
  // You can add more imperative methods here if needed.
}

const CanvasComponent = forwardRef<CanvasRef, CanvasComponentProps>(
  function CanvasComponent({ screen, redactions }, ref) {
    const [refMeasure, { width, height }] = useMeasure();
    const containerRef = useRef<HTMLDivElement>(null);

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

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);

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
        onWheel: ({ offset: [dx, dy] }) => {
          const stage = stageRef.current;
          if (!stage) return;
          stage.position({ x: dx, y: dy });
          stage.batchDraw();
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
    const [image] = useImage(screen.src);
    // Calculate common layout dimensions and offsets only when dependencies change.
    const { displayWidth, displayHeight, offsetX, offsetY } = useMemo(() => {
      const vPadding =
        typeof window !== "undefined"
          ? parseFloat(getComputedStyle(document.documentElement).fontSize)
          : 16;
      const scale =
        image && width && height
          ? Math.min(width / image.width, height / image.height)
          : 1;
      const dWidth = image ? image.width * scale : 0;
      const dHeight = image ? image.height * scale - vPadding * 2 : 0;
      const offX = width && image ? (width - dWidth) / 2 : 0;
      const offY =
        height && image ? (height - dHeight - vPadding) / 2 + vPadding / 2 : 0;
      return {
        image: image,
        imageScale: scale,
        verticalPadding: vPadding,
        displayWidth: dWidth,
        displayHeight: dHeight,
        offsetX: offX,
        offsetY: offY,
      };
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
      [offsetX, offsetY, displayWidth, displayHeight, mode, getRelativePointer]
    );

    // handler for mouse move event
    const handleStageMouseMove = useCallback(
      (e: any) => {
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
            width: Math.abs(normX - newRect.x),
            height: Math.abs(normY - newRect.y),
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

    // handler for when user clicks a rectangle
    const handleRectClick = (_: any, id: string) => {
      if (mode === "eraser") {
        deleteRedaction(id);
      } else if (mode === "select") {
        selectRedaction(id);
      }
    };

    // function to handle dragging of rectangles
    const handleDrag = useCallback(
      (e: any, id: string) => {
        const pos = e.target.position();
        const newX = (pos.x - offsetX) / displayWidth;
        const newY = (pos.y - offsetY) / displayHeight;
        updateRect(id, { x: newX, y: newY });
      },
      [offsetX, offsetY, displayWidth, displayHeight, updateRect]
    );

    // function to handle transformation of rectangles
    const handleTransform = useCallback(
      (e: any, id: string) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        // Reset scale to 1
        node.scaleX(1);
        node.scaleY(1);

        // Calculate new positions and dimensions in normalized coordinates
        const newX = (node.x() - offsetX) / displayWidth;
        const newY = (node.y() - offsetY) / displayHeight;
        const rawWidth = (node.width() * scaleX) / displayWidth;
        const rawHeight = (node.height() * scaleY) / displayHeight;

        // Handle negative resizing: if width or height is negative, adjust position and flip size
        let updatedX = newX;
        let updatedY = newY;
        let updatedWidth = rawWidth;
        let updatedHeight = rawHeight;

        if (rawWidth < 0) {
          updatedX = newX + rawWidth;
          updatedWidth = Math.abs(rawWidth);
        }
        if (rawHeight < 0) {
          updatedY = newY + rawHeight;
          updatedHeight = Math.abs(rawHeight);
        }

        // Clamp the values so the redaction stays within [0, 1]
        const clampedX = Math.max(0, updatedX);
        const clampedY = Math.max(0, updatedY);
        const clampedWidth = Math.min(updatedWidth, 1 - clampedX);
        const clampedHeight = Math.min(updatedHeight, 1 - clampedY);

        updateRect(id, {
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
        });
      },
      [offsetX, offsetY, displayWidth, displayHeight, updateRect]
    );

    useEffect(() => {
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

    const handleExport = useCallback(() => {
      // const stage = stageRef.current;
      // const transformer = transformerRef.current;
      // if (!stage) return;
      // transformer.hide();

      // // Get the layer and image
      // const layer = stage.findOne("Layer");
      // if (!layer) return;

      // const image = layer.findOne("Image");
      // if (!image) return;

      // const dataURL = stage.toDataURL({
      //   x: image.x(),
      //   y: image.y(),
      //   width: image.width(),
      //   height: image.height(),
      //   pixelRatio: 1,
      //   mimeType: "image/png",
      // });
      // transformer.show();

      if (!image) return;

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = `${image.width}px`;
      container.style.height = `${image.height}px`;
      container.style.zIndex = "-9999";
      document.body.appendChild(container);

      // create new canvas
      var renderStage = new Konva.Stage({
        container: container,
        width: image.width,
        height: image.height,
      });

      // create new layer
      const renderLayer = new Konva.Layer();
      renderStage.add(renderLayer);

      // create new image with original resolution
      const renderImage = new Konva.Image({
        image: image,
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
      renderLayer.add(renderImage);

      // render redactions
      redactions.forEach((redaction) => {
        const rect = new Konva.Rect({
          x: redaction.x * image.width,
          y: redaction.y * image.height,
          width: redaction.width * image.width,
          height: redaction.height * image.height,
          fill: "black",
          opacity: 1,
        });
        renderLayer.add(rect);
      });
      renderLayer.batchDraw();

      // export the canvas to data URL
      const dataURL = renderStage.toDataURL({
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
        pixelRatio: 1,
        mimeType: "image/png",
      });

      // delete the container
      document.body.removeChild(container);

      // create a link to download the image
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "redacted-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, [image, redactions]);

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
          <div className="absolute top-0 left-0 z-10 flex items-center justify-between w-full p-2">
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md shadow-md hover:bg-blue-600"
              onClick={handleExport}
            >
              Export
            </button>
          </div>
          <Stage
            ref={stageRef}
            width={width ?? 0}
            height={height ?? 0}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onWheel={(e) => {}}
            draggable={mode === "select"}
            scaleX={stageScale}
            scaleY={stageScale}
          >
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  x={offsetX}
                  y={offsetY}
                  width={displayWidth}
                  height={displayHeight}
                />
              )}
              {(redactions || []).map((redaction) => (
                <RedactRectangle
                  key={redaction.id}
                  redaction={redaction}
                  displayWidth={displayWidth}
                  displayHeight={displayHeight}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  mode={mode}
                  handleRectClick={handleRectClick}
                  handleDrag={handleDrag}
                  handleTransform={handleTransform}
                />
              ))}
              {newRect && image && (
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
                <Transformer keepRatio={false} ref={transformerRef} />
              )}
            </Layer>
          </Stage>
        </div>
        {stageRef.current && (
          <Overlay stage={stageRef.current} overlays={overlay} />
        )}
      </div>
    );
  }
);

export default CanvasComponent;
