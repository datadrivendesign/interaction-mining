import React, { Ref } from "react";
import {
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Transformer,
} from "react-konva";
import Konva from "konva";
import { Redaction } from "../../types";
import RedactRectangle from "./redact-rect";
import { vhBox, vhRootBounds } from "./redact-screen-canvas";
import { Box } from "./redact-geometry";

type RedactMode = "pencil" | "eraser" | "select";

interface RedactKonvaLayerProps {
  width: number;
  height: number;
  stageScale: number;
  stageRef: Ref<Konva.Stage>;
  transformerRef: Ref<Konva.Transformer>;
  mode: RedactMode;
  image: HTMLImageElement | undefined;
  imageStatus: "loading" | "loaded" | "failed";
  imageRect: {
    offsetX: number;
    offsetY: number;
    displayWidth: number;
    displayHeight: number;
  };
  redactions: Redaction[];
  newRect: Redaction | null;
  vhBoxes: vhBox[];
  rootBounds: vhRootBounds;
  onStageMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onBackgroundClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onPanningStart: () => void;
  onPanningEnd: () => void;
  selectRedaction: (id: string) => void;
  handleRectClick: (e: Konva.KonvaEventObject<MouseEvent>, id: string) => void;
  handleRectDelete: (e: Konva.KonvaEventObject<MouseEvent>, id: string) => void;
  handleTransform: (e: Konva.KonvaEventObject<Event>, id: string) => void;
  boundBoxFunc: (oldBox: Box, newBox: Box) => Box;
}

/**
 * Pure Konva rendering: image, VH bounding boxes, redaction rectangles, the
 * in-progress draft rectangle, and the Transformer. All behavior is supplied
 * via props.
 */
export function RedactKonvaLayer({
  width,
  height,
  stageScale,
  stageRef,
  transformerRef,
  mode,
  image,
  imageStatus,
  imageRect,
  redactions,
  newRect,
  vhBoxes,
  rootBounds,
  onStageMouseDown,
  onStageMouseMove,
  onStageMouseUp,
  onBackgroundClick,
  onPanningStart,
  onPanningEnd,
  selectRedaction,
  handleRectClick,
  handleRectDelete,
  handleTransform,
  boundBoxFunc,
}: RedactKonvaLayerProps) {
  const { offsetX, offsetY, displayWidth, displayHeight } = imageRect;

  if (
    imageStatus !== "loaded" ||
    !image ||
    !image.complete ||
    offsetX <= 0 ||
    offsetY <= 0 ||
    displayWidth <= 0 ||
    displayHeight <= 0
  ) {
    return null;
  }

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={onStageMouseDown}
      onMouseMove={onStageMouseMove}
      onMouseUp={onStageMouseUp}
      onClick={onBackgroundClick}
      draggable={mode === "select"}
      onWheel={onPanningStart}
      onDragStart={onPanningStart}
      onDragEnd={onPanningEnd}
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
        {rootBounds &&
          vhBoxes.map((box, index) => (
            <Rect
              key={box.id + index}
              x={(box.x / rootBounds.width) * displayWidth + offsetX}
              y={(box.y / rootBounds.height) * displayHeight + offsetY}
              width={(box.width / rootBounds.width) * displayWidth}
              height={(box.height / rootBounds.height) * displayHeight}
              stroke="red"
              strokeWidth={1}
            />
          ))}
        {image.naturalWidth > 0 &&
          (redactions || []).map((redaction) => (
            <React.Fragment key={redaction.id}>
              <RedactRectangle
                redaction={redaction}
                displayWidth={displayWidth}
                displayHeight={displayHeight}
                offsetX={offsetX}
                offsetY={offsetY}
                mode={mode}
                selectRedaction={(id: string) => selectRedaction(id)}
                handleRectClick={handleRectClick}
                handleTransform={handleTransform}
                handleRectDelete={handleRectDelete}
              />
            </React.Fragment>
          ))}
        {newRect && (
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
            onTransformStart={onPanningStart}
            onTransformEnd={onPanningEnd}
            flipEnabled={false}
            keepRatio={false}
            rotateEnabled={false}
            ref={transformerRef}
          />
        )}
      </Layer>
    </Stage>
  );
}
