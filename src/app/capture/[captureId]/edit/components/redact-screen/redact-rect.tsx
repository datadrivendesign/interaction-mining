"use client";
import { Rect } from "react-konva";
import { Redaction } from "./types";
import { useEffect, useRef } from "react";
import Konva from "konva";

export default function RedactRectangle({
  type = "blur",
  redaction,
  displayWidth,
  displayHeight,
  offsetX,
  offsetY,
  mode,
  handleRectClick,
  handleDrag,
  handleTransform,
}: {
  type?: "black-box" | "blur";
  redaction: Redaction;
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
  mode: string;
  handleRectClick: (e: any, id: string) => void;
  handleDrag: (e: any, id: string) => void;
  handleTransform: (e: any, id: string) => void;
}) {
  const ref = useRef<Konva.Rect>(null);

  useEffect(() => {
    let node = ref.current;
    if (node) {
      if (type === "blur") {
        node.cache();
        node.filters([Konva.Filters.Blur]);
        node.blurRadius(10);
        node.fill("black");
        node.opacity(0.75);
      } else {
        node.filters([]);
      }
    }
  }, [type]);

  return (
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
      onDragMove={(e) => handleDrag(e, redaction.id)}
      onTransform={(e) => handleTransform(e, redaction.id)}
    />
  );
}
