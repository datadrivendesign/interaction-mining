"use client";

import Konva from "konva";
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import throttle from "lodash/throttle";
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
  isPanning: boolean;
  setIsPanning: (_: boolean) => void;
}

/**
 * The OverlayContainer renders React elements over canvas nodes.
 * It queries each overlay's node position using getClientRect() and positions the corresponding overlay absolutely.
 */
const OverlayContainer: React.FC<OverlayContainerProps> = ({
  stage,
  overlays,
  isPanning,
  setIsPanning,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});
  const [overlaySizes, setOverlaySizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const { redactions } = useContext(RedactCanvasContext);

  // Update positions for each overlay item by querying the stage's nodes.
  const updatePositionsUnthrottled = useCallback(() => {
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

    setPositions((prev) => {
      for (const key in newPositions) {
        const prevBox = prev[key];
        const newBox = newPositions[key];
        if (
          !prevBox ||
          prevBox.x !== newBox.x ||
          prevBox.y !== newBox.y ||
          prevBox.width !== newBox.width ||
          prevBox.height !== newBox.height
        ) {
          return newPositions;
        }
      }
      return prev;
    });
  }, [stage, overlays]);

  const updatePositions = useMemo(
    () =>
      throttle(updatePositionsUnthrottled, 1000 / 60, {
        leading: true,
        trailing: true,
      }),
    [updatePositionsUnthrottled],
  );

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

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handler to stop events from bubbling to Konva stage:
  const stopPointer = (
    event: React.MouseEvent | React.WheelEvent | React.TouchEvent,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    setIsPanning(true);
  };

  const getOverlayPosition = useCallback(
    (
      nodeId: string,
      box: { x: number; y: number; width: number; height: number },
    ) => {
      const margin = 8;
      const gap = 16;
      const size = overlaySizes[nodeId] ?? { width: 0, height: 0 };

      let left = box.x + box.width + gap;
      if (size.width > 0 && left + size.width > containerSize.width - margin) {
        left = box.x - size.width - gap;
      }
      if (size.width > 0) {
        left = Math.max(
          margin,
          Math.min(left, containerSize.width - size.width - margin),
        );
      }

      let top = box.y;
      if (
        size.height > 0 &&
        top + size.height > containerSize.height - margin
      ) {
        top = box.y + box.height - size.height;
      }
      if (size.height > 0) {
        top = Math.max(
          margin,
          Math.min(top, containerSize.height - size.height - margin),
        );
      }

      return { left, top };
    },
    [containerSize.height, containerSize.width, overlaySizes],
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {overlays.map((overlay) => {
        const box = positions[overlay.nodeId];
        if (!box) return null;
        const { left, top } = getOverlayPosition(overlay.nodeId, box);
        return (
          <div
            key={overlay.nodeId}
            ref={(node) => {
              if (!node) return;
              const nextWidth = node.offsetWidth;
              const nextHeight = node.offsetHeight;
              setOverlaySizes((prev) => {
                const curr = prev[overlay.nodeId];
                if (
                  curr &&
                  curr.width === nextWidth &&
                  curr.height === nextHeight
                ) {
                  return prev;
                }
                return {
                  ...prev,
                  [overlay.nodeId]: {
                    width: nextWidth,
                    height: nextHeight,
                  },
                };
              });
            }}
            style={{
              position: "absolute",
              left,
              top,
              zIndex: 140,
              pointerEvents: isPanning ? "none" : "auto",
            }}
            onWheel={stopPointer}
            onTouchStart={stopPointer}
          >
            {overlay.render(box)}
          </div>
        );
      })}
    </div>
  );
};

export default OverlayContainer;
