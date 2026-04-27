import { useCallback, useEffect, useState, useRef } from "react";

export default function useMeasure<T extends HTMLElement>(
  providedRef?: React.RefObject<T>
) {
  const innerRef = useRef<T>(null);
  const ref = providedRef ?? innerRef;

  const [measure, setMeasure] = useState<DOMRect | null>(null);

  const measureElement = useCallback(() => {
    if (ref.current) {
      setMeasure(ref.current.getBoundingClientRect());
    }
  }, [ref]);

  useEffect(() => {
    measureElement();
    window.addEventListener("resize", measureElement);
    return () => {
      window.removeEventListener("resize", measureElement);
    };
  }, [measureElement]);

  return [ref, measure] as const;
}
