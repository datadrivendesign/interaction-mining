"use client";

import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
} from "react";
import Konva from "konva";

import { FrameData, Redaction } from "../../types";
import { cn } from "@/lib/utils";
import {
  RedactCanvasContext,
  vhBox,
  vhRootBounds,
} from "./redact-screen-canvas";
import OverlayContainer from "./stage-overlay";
import { RedactKonvaLayer } from "./redact-konva-layer";
import { useRedactDrawing } from "./use-redact-drawing";
import { useRedactKeyboardState } from "./use-redact-keyboard-state";
import { useRedactSelectionOverlay } from "./use-redact-selection-overlay";
import { useRedactStageViewport } from "./use-redact-stage-viewport";
import { useRedactTransform } from "./use-redact-transform";

export interface CanvasComponentProps {
  screen: FrameData;
  vh: {
    vhBoxes: vhBox[];
    rootBounds: vhRootBounds;
  };
  redactions: Redaction[];
  mode: "pencil" | "eraser" | "select";
  onImageStatusChange?: (imageStatus: "loading" | "loaded" | "failed") => void;
}

export interface CanvasRef {
  getStage: () => Konva.Stage | null;
}

const CanvasComponent = forwardRef<CanvasRef, CanvasComponentProps>(
  function CanvasComponent(
    { screen, redactions, vh, onImageStatusChange },
    ref,
  ) {
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

    const {
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
    } = useRedactStageViewport({ imageSrc: screen.src });

    useEffect(() => {
      onImageStatusChange?.(imageStatus);
    }, [imageStatus, onImageStatusChange]);

    const updateRect = useCallback(
      (id: string, rect: Partial<Redaction>) => {
        if (selectedRedactions) {
          updateRedaction(id, rect);
        }
      },
      [selectedRedactions, updateRedaction],
    );

    const {
      newRect,
      handleStageMouseDown,
      handleStageMouseMove,
      handleStageMouseUp,
      cancelDrawing,
    } = useRedactDrawing({
      mode,
      imageRect,
      setMode,
      createRedactions,
      getRelativePointer,
    });

    const { shiftDown } = useRedactKeyboardState({
      onCancelDraft: cancelDrawing,
    });

    const { boundBoxFunc, handleTransform } = useRedactTransform({
      imageRect,
      stageRef,
      selectedRedactions,
      updateRect,
    });

    const { transformerRef, overlay } = useRedactSelectionOverlay({
      mode,
      selectedRedactions,
      stageRef,
      selectRedaction,
      updateRect,
    });

    const handleBackgroundClick = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.target.getStage()) {
          if (mode === "select") {
            selectRedaction(null, false);
          }
        }
      },
      [mode, selectRedaction],
    );

    const handleRectClick = useCallback(
      (_: Konva.KonvaEventObject<MouseEvent>, id: string) => {
        if (mode === "eraser") {
          deleteRedaction([id]);
        } else if (mode === "select") {
          selectRedaction(id, shiftDown);
        }
      },
      [mode, deleteRedaction, selectRedaction, shiftDown],
    );

    const handleRectDelete = useCallback(
      (_e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
        deleteRedaction([id]);
      },
      [deleteRedaction],
    );

    const handlePanningStart = useCallback(
      () => setIsPanning(true),
      [setIsPanning],
    );
    const handlePanningEnd = useCallback(
      () => setIsPanning(false),
      [setIsPanning],
    );

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    return (
      <div className="relative h-full w-full">
        <div
          ref={containerCallbackRef}
          className={cn(
            "relative h-full w-full",
            mode === "select" && "cursor-normal",
            mode === "pencil" && "cursor-crosshair",
            mode === "eraser" && "cursor-normal",
          )}
        >
          <RedactKonvaLayer
            width={width}
            height={height}
            stageScale={stageScale}
            stageRef={stageRef}
            transformerRef={transformerRef}
            mode={mode}
            image={image}
            imageStatus={imageStatus}
            imageRect={imageRect}
            redactions={redactions}
            newRect={newRect}
            vhBoxes={vhBoxes}
            rootBounds={rootBounds}
            onStageMouseDown={handleStageMouseDown}
            onStageMouseMove={handleStageMouseMove}
            onStageMouseUp={handleStageMouseUp}
            onBackgroundClick={handleBackgroundClick}
            onPanningStart={handlePanningStart}
            onPanningEnd={handlePanningEnd}
            selectRedaction={(id: string) => selectRedaction(id, shiftDown)}
            handleRectClick={handleRectClick}
            handleRectDelete={handleRectDelete}
            handleTransform={handleTransform}
            boundBoxFunc={boundBoxFunc}
          />
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
