"use client";

import Konva from "konva";
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { RedactCanvasContext } from "./redact-screen-canvas";

export interface Overlay {
  type?: string;
  nodeId: string;
  render: (box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => React.ReactNode;
}

interface OverlayContainerProps {
  stage: Konva.Stage | null;
  overlays: Overlay[];
}

/**
 * The OverlayContainer renders React elements over canvas nodes.
 * It queries each overlay's node position using getClientRect() and positions the corresponding overlay absolutely.
 */
const Overlay: React.FC<OverlayContainerProps> = ({ stage, overlays }) => {
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});

  const { redactions } = useContext(RedactCanvasContext);

  // Update positions for each overlay item by querying the stage's nodes.
  const updatePositions = useCallback(() => {
    if (!stage) return;
    const newPositions: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {};
    overlays.forEach((overlay) => {
      const node = stage.findOne(overlay.nodeId);
      if (node) {
        const box = node.getClientRect();
        newPositions[overlay.nodeId] = {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };
      }
    });

    // Check if the new positions are different from the current ones
    if (JSON.stringify(newPositions) !== JSON.stringify(positions)) {
      setPositions(newPositions);
    }
  }, [stage, overlays, positions]);

  useEffect(() => {
    if (!stage) return;

    // Perform an initial update
    updatePositions();

    // Listen for stage events that might affect node positions
    stage.on("touchmove mousemove dragmove transform", updatePositions);

    // Set up a requestAnimationFrame loop to check for scale/position changes
    let lastScale = stage.scale();
    let lastPosition = stage.position();
    let animationFrameId: number;

    const checkForUpdates = () => {
      if (!stage) return;
      const currentScale = stage.scale();
      const currentPosition = stage.position();
      if (
        currentScale.x !== lastScale.x ||
        currentScale.y !== lastScale.y ||
        currentPosition.x !== lastPosition.x ||
        currentPosition.y !== lastPosition.y
      ) {
        lastScale = currentScale;
        lastPosition = currentPosition;
        updatePositions();
      }
      animationFrameId = requestAnimationFrame(checkForUpdates);
    };

    checkForUpdates();

    return () => {
      stage.off("touchmove mousemove dragmove transform", updatePositions);
      // Also remove potential opposite events if they were registered
      stage.off("touchend mousemove dragend transformend", updatePositions);
      cancelAnimationFrame(animationFrameId);
    };
  }, [stage, overlays, redactions, updatePositions]);

  return (
    <>
      {overlays.map((overlay) => {
        const box = positions[overlay.nodeId];
        if (!box) return null;
        return (
          <div
            key={overlay.nodeId}
            style={{
              position: "absolute",
              left: `calc(${box.x + box.width}px + 1rem)`,
              top: box.y,
              pointerEvents: "none",
            }}
          >
            {overlay.render()}
          </div>
        );
      })}
    </>
  );
};

export default Overlay;
