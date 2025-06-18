"use client";
import { Rect } from "react-konva";
import { Redaction } from "../types";
import { useEffect, useRef } from "react";
import Konva from "konva";


import React from "react";
import { Circle, Line, Group } from "react-konva";

const CloseButton = ({
  x,
  y,
  redactId,
  radius = 10,
  onClick,
}: {
  x: number;
  y: number;
  redactId: string;
  radius?: number;
  onClick?: (e: any) => void;
}) => {
  const lineLength = radius * 0.8;
  const offset = lineLength / 2;

  return (
    <Group 
      id={`redaction-${redactId}-close`}
      x={x} 
      y={y} 
      onClick={onClick} 
      listening
    >
      <Circle
        id={`redaction-${redactId}-close-circle`}
        radius={radius}
        fill="#fff"
        stroke="#000"
        strokeWidth={1}
        shadowBlur={2}
      />
      <Line
        id={`redaction-${redactId}-close-line-1`}
        points={[-offset, -offset, offset, offset]}
        stroke="#000"
        strokeWidth={2}
        lineCap="round"
      />
      <Line
        id={`redaction-${redactId}-close-line-2`}
        points={[-offset, offset, offset, -offset]}
        stroke="#000"
        strokeWidth={2}
        lineCap="round"
      />
    </Group>
  );
};

export default function RedactRectangle({
  type = "blur",
  redaction,
  displayWidth,
  displayHeight,
  offsetX,
  offsetY,
  mode,
  selectRedaction,
  handleRectClick,
  handleTransform,
  handleRectDelete
}: {
  type?: "black-box" | "blur";
  redaction: Redaction;
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
  mode: string;
  selectRedaction: (_: string) => void;
  handleRectClick: (e: any, id: string) => void;
  handleTransform: (e: any, id: string) => void;
  handleRectDelete: (e: any, id: string) => void;
}) {
  const ref = useRef<Konva.Rect>(null);

  useEffect(() => {
    let node = ref.current;
    if (node) {
      if (type === "blur") {
        // node.cache();
        node.filters([Konva.Filters.Blur]);
        node.blurRadius(10);
        node.fill("black");
        node.opacity(1.0);
      } else {
        node.filters([]);
        node.fill("black");
        node.opacity(1.0);
      }
    }
  }, [type]);

  const onTransformStart = (e: any) => {
    // set opacity
    const node = ref.current;
    if (node) {
      node.opacity(0.75);
    }

    selectRedaction(redaction.id);
    handleTransform(e, redaction.id);
  };

  const onTransformEnd = (e: any) => {
    const node = ref.current;
    if (node) {
      node.opacity(1);
    }
    handleTransform(e, redaction.id);
  };

  return (
    <Group>
      <Rect
        ref={ref}
        id={`redaction-${redaction.id}`}
        x={redaction.x * displayWidth + offsetX}
        y={redaction.y * displayHeight + offsetY}
        width={redaction.width * displayWidth}
        height={redaction.height * displayHeight}
        draggable={mode === "select"}
        onClick={(e) => handleRectClick(e, redaction.id)}
        onTap={(e) => handleRectClick(e, redaction.id)}
        onTransformStart={onTransformStart}
        onTransform={(e) => handleTransform(e, redaction.id)}
        onTransofrmEnd={onTransformEnd}
        onDragStart={onTransformStart}
        onDragMove={(e) => handleTransform(e, redaction.id)}
        onDragEnd={onTransformEnd}
      />
      <CloseButton 
        x={redaction.x * displayWidth + offsetX}
        y={redaction.y * displayHeight + offsetY}  
        redactId={`${redaction.id}`}
        radius={8}    
        onClick={(e) => handleRectDelete(e, redaction.id)}
      />
    </Group>
  );
}
