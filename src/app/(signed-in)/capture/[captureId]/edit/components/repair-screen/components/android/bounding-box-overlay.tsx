import { MutableRefObject, useRef, useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export default function BoundingBoxOverlay({
  showBoxes,
  mergedRef,
  height,
  width,
  boxes,
  rootBounds,
}: {
  showBoxes: boolean;
  mergedRef: MutableRefObject<HTMLImageElement | null>;
  height: number | null;
  width: number | null;
  boxes: any[];
  rootBounds: any;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
  }>({
    visible: false,
    content: "",
  });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const svg = svgRef.current;
    const img = (mergedRef as MutableRefObject<HTMLImageElement | null>)
      .current;
    if (!height || !width || !img || !svg) return;
    // Use ResizeObserver to synchronize SVG dimensions with image dimensions
    const resizeObserver = new ResizeObserver(() => {
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
    });
    resizeObserver.observe(img);
    // Cleanup observer
    return () => {
      resizeObserver.unobserve(img);
    };
  }, [height, width, mergedRef, svgRef]);

  if (!rootBounds) {
    return null; // Render nothing if rootBounds is not available
  }

  return (
    <div>
      {showBoxes && (
        <>
          <svg
            ref={svgRef}
            viewBox={`${rootBounds.x} ${rootBounds.y} ${rootBounds.width} ${rootBounds.height}`}
            preserveAspectRatio="xMinYMin meet"
            className="pointer-events-none top-0 left-0 absolute"
          >
            {boxes.map((box: any, index: number) => (
              <BoundingBox
                key={box.id + index}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                onMouseEnter={(e) => {
                  setTooltip({
                    visible: true,
                    content: box.class || "Unknown element",
                  });
                }}
                onMouseMove={(e) => {
                  setMousePosition({
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => {
                  setTooltip((prev) => ({ ...prev, visible: false }));
                }}
              />
            ))}
          </svg>

          {/* Custom tooltip */}
          {tooltip.visible && (
            <TooltipProvider delayDuration={10}>
              <Tooltip open={tooltip.visible}>
                <TooltipContent
                  side="top"
                  className="z-50 opacity-70"
                  style={{
                    position: "fixed",
                    left: mousePosition.x + 10,
                    top: mousePosition.y - 10,
                    transform: "none",
                  }}
                >
                  {tooltip.content}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}
    </div>
  );
}

function BoundingBox({
  x,
  y,
  width,
  height,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  onMouseEnter?: (e: React.MouseEvent<SVGRectElement>) => void;
  onMouseMove?: (e: React.MouseEvent<SVGRectElement>) => void;
  onMouseLeave?: () => void;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={"transparent"}
      stroke="red"
      strokeWidth="1"
      className="pointer-events-auto cursor-crosshair"
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    />
  );
}
