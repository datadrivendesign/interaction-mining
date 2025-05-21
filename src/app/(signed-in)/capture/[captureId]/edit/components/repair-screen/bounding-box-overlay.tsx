import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MutableRefObject, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FocusedBox } from "./repair-screen-canvas";

export function FocusedElementTab({
  showBoxes,
  setShowBoxes,
  focusedBox,
}: {
  showBoxes: boolean;
  setShowBoxes: React.Dispatch<React.SetStateAction<boolean>>;
  focusedBox: FocusedBox;
}) {
  return (
    <Card className="absolute right-0 top-0 mr-5 mt-5 w-auto h-auto">
      <CardHeader>
        <CardTitle>Gesture Interaction Element</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-5">
          <Switch
            checked={showBoxes}
            onCheckedChange={(checked) => {
              setShowBoxes(checked);
            }}
          />
          <span className="pl-3">Show Bounding Boxes</span>
        </div>
        {showBoxes ? (
          <>
            <div className="space-y-1 flex flex-row mb-5">
              <div className="w-15 flex flex-col justify-center items-center">
                <Label
                  htmlFor="x0"
                  className="text-sm font-bold leading-none mb-1"
                >
                  x0
                </Label>
                <Input
                  id="x0"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={focusedBox.x ?? -1}
                />
              </div>
              <div className="w-15 flex flex-col justify-center items-center mr-3">
                <Label
                  htmlFor="y0"
                  className="text-sm font-bold leading-none mb-1"
                >
                  y0
                </Label>
                <Input
                  id="y0"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={focusedBox.y ?? -1}
                />
              </div>
              <div className="w-15 flex flex-col justify-center items-center">
                <Label
                  htmlFor="x1"
                  className="text-sm font-bold leading-none mb-1"
                >
                  x1
                </Label>
                <Input
                  id="x1"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={(focusedBox.x ?? -1) + (focusedBox.width ?? -1)}
                />
              </div>
              <div className="w-15 flex flex-col justify-center items-center">
                <Label
                  htmlFor="y1"
                  className="text-sm font-bold leading-none mb-1"
                >
                  y1
                </Label>
                <Input
                  id="y1"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={(focusedBox.y ?? -1) + (focusedBox.height ?? -1)}
                />
              </div>
            </div>
            <div className="space-y-1 mb-5">
              <Label
                htmlFor="elemId"
                className="text-base font-bold leading-none"
              >
                Element Id
              </Label>
              <Input
                id="elemId"
                className="text-sm font-normal text-muted-foreground"
                readOnly={true}
                value={focusedBox.id ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label
                className="text-base font-bold leading-none"
                htmlFor="elemClass"
              >
                Element Class
              </Label>
              <Input
                id="elemClass"
                className="text-sm font-normal text-muted-foreground"
                readOnly={true}
                value={focusedBox.class ?? ""}
              />
            </div>
          </>
        ) : (
          <></>
        )}
      </CardContent>
    </Card>
  );
}

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
          <svg
            ref={svgRef}
            viewBox={`${rootBounds.x} ${rootBounds.y} ${rootBounds.width} ${rootBounds.height}`}
            preserveAspectRatio="xMinYMin meet"
            className="pointer-events-none top-0 left-0 absolute cursor-crosshair"
          >
            {boxes.map((box: any, index: number) => (
              <BoundingBox
                key={box.id + index}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
              />
            ))}
          </svg>
        )}
      </div>
    );
  }
  
  function BoundingBox({
    x,
    y,
    width,
    height,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
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
        className="pointer-events-none"
      />
    );
  }
  