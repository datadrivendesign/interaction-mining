import { useCallback, useEffect, useState, useRef } from "react";

export default function useMeasure<T extends HTMLElement>(
  providedRef?: React.RefObject<T>
) {
  const innerRef = useRef<T>(null);
  const ref = providedRef ?? innerRef;

  const [measure, setMeasure] = useState<DOMRect | null>(null);

  const measureElement = useCallback(() => {
    if (ref.current) {
      const nextMeasure = ref.current.getBoundingClientRect();
      setMeasure((prev) => {
        if (
          prev &&
          prev.x === nextMeasure.x &&
          prev.y === nextMeasure.y &&
          prev.width === nextMeasure.width &&
          prev.height === nextMeasure.height
        ) {
          return prev;
        }

        return nextMeasure;
      });
    }
  }, [ref]);

  useEffect(() => {
    const element = ref.current;

    measureElement();

    let resizeObserver: ResizeObserver | null = null;
    if (element && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        measureElement();
      });
      resizeObserver.observe(element);
    }

    window.addEventListener("resize", measureElement);
    return () => {
      window.removeEventListener("resize", measureElement);
      resizeObserver?.disconnect();
    };
  }, [measureElement, ref]);

  return [ref, measure] as const;
}
