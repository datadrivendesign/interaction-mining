import { RefObject, useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Redaction } from "../../types";
import AnnotationCard from "./annotation-card";
import { Overlay } from "./stage-overlay";

type RedactMode = "pencil" | "eraser" | "select";

interface UseRedactSelectionOverlayArgs {
  mode: RedactMode;
  selectedRedactions: Redaction[];
  stageRef: RefObject<Konva.Stage | null>;
  selectRedaction: (id: string | null, multi: boolean) => void;
  updateRect: (id: string, rect: Partial<Redaction>) => void;
}

/**
 * Wires the Konva Transformer to the currently-selected redactions and renders
 * the annotation card overlay anchored to the (single) selected node. Returns a
 * ref the parent should attach to the Transformer plus the overlay list to
 * pass to the OverlayContainer.
 */
export function useRedactSelectionOverlay({
  mode,
  selectedRedactions,
  stageRef,
  selectRedaction,
  updateRect,
}: UseRedactSelectionOverlayArgs) {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [overlay, setOverlay] = useState<Overlay[]>([]);

  useEffect(() => {
    if (!stageRef.current) {
      return;
    }

    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;

    if (mode !== "select") {
      selectRedaction(null, false);
      setOverlay((prev) => prev.filter((o) => o.type !== "annotation"));

      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    if (selectedRedactions.length > 0) {
      const selectors = selectedRedactions
        .map((r) => `#redaction-${r.id}`)
        .join(", ");
      const selectedNodes = stage.find(selectors);
      transformer.nodes(selectedNodes);
      if (selectedNodes.length > 1) {
        transformer.resizeEnabled(false);
        transformer.rotateEnabled(false);
      } else {
        transformer.resizeEnabled(true);
        transformer.rotateEnabled(true);
      }
      transformer.getLayer()?.batchDraw();
      if (selectedNodes.length === 1) {
        setOverlay((prev) => [
          ...prev.filter((o) => o.type !== "annotation"),
          {
            type: "annotation",
            nodeId: `#redaction-${selectedRedactions[0].id}`,
            render: () => (
              <AnnotationCard
                key={`annotation-${selectedRedactions[0].id}`}
                annotation={selectedRedactions[0].annotation}
                setAnnotation={(value) => {
                  updateRect(selectedRedactions[0].id, {
                    annotation: value,
                  });
                }}
              />
            ),
          },
        ]);
      } else if (selectedNodes.length > 1) {
        setOverlay((prev) => prev.filter((o) => o.type !== "annotation"));
      } else {
        console.warn(
          `No nodes found for selected redaction ids: ${selectors}`,
        );
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      setOverlay((prev) => prev.filter((o) => o.type !== "annotation"));
    }
  }, [selectedRedactions, mode, selectRedaction, stageRef, updateRect]);

  return { transformerRef, overlay };
}
