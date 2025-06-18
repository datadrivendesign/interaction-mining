// src/hooks/useInvertedScroll.tsx
import { useState, useEffect } from "react";

/**
 * useInvertedScroll()
 *
 * Detects whether the user’s trackpad/mouse is set to "natural" (inverted) scrolling.
 * Internally, it creates a tiny offscreen <div> that’s scrollable by 1px,
 * listens for a single `wheel` event, and compares e.deltaY against the div's scrollTop change.
 * Once detected (or after a 3 second timeout), it cleans itself up.
 *
 * Returns:
 *   - isInverted: boolean
 *       true  = trackpad/mouse is in “natural” (inverted) scrolling mode
 *       false = standard scrolling
 */
export function useInvertedScroll(): boolean {
  const [isInverted, setIsInverted] = useState(false);

  useEffect(() => {
    // 1) Create a tiny 1×1px scrollable <div> offscreen
    const detector = document.createElement("div");
    detector.style.width = "1px";
    detector.style.height = "1px";
    detector.style.overflow = "auto";
    detector.style.position = "absolute";
    detector.style.left = "-10000px";
    detector.style.top = "-10000px";

    // Give it a 2px-tall child so there's exactly 1px of scroll range
    const inner = document.createElement("div");
    inner.style.width = "1px";
    inner.style.height = "2px";
    detector.appendChild(inner);

    document.body.appendChild(detector);

    let detected = false;

    // 2) Listen for the first wheel event on that div
    const onWheelDetect = (e: WheelEvent) => {
      if (detected) return;
      detected = true;

      const delta = e.deltaY;
      const prevScroll = detector.scrollTop;

      // Let the browser perform the scroll; check scrollTop on next animation frame
      requestAnimationFrame(() => {
        const newScroll = detector.scrollTop;
        // If deltaY > 0 but scrollTop < prev → inverted
        // Or deltaY < 0 but scrollTop > prev → inverted
        if (
          (delta > 0 && newScroll < prevScroll) ||
          (delta < 0 && newScroll > prevScroll)
        ) {
          setIsInverted(true);
        }
        // Clean up listener and DOM element
        detector.removeEventListener("wheel", onWheelDetect);
        if (document.body.contains(detector)) {
          document.body.removeChild(detector);
        }
      });
    };

    detector.addEventListener("wheel", onWheelDetect, { passive: true });

    // 3) As a fallback, if no wheel ever hits that div in 3s, remove it
    const timeoutId = window.setTimeout(() => {
      if (!detected) {
        detected = true;
        detector.removeEventListener("wheel", onWheelDetect);
        if (document.body.contains(detector)) {
          document.body.removeChild(detector);
        }
      }
    }, 3000);

    // 4) Cleanup on unmount
    return () => {
      if (!detected) {
        detector.removeEventListener("wheel", onWheelDetect);
        if (document.body.contains(detector)) {
          document.body.removeChild(detector);
        }
      }
      clearTimeout(timeoutId);
    };
  }, []);

  return isInverted;
}
