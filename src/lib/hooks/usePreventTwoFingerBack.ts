import { useEffect } from "react";

/**
 * usePreventTwoFingerBack
 * -----------------------
 * Prevents two-finger swipes (wheel events with deltaX < 0 or deltaY > 0) from triggering
 * Back/Forward navigation on macOS when no parent can scroll further in that direction.
 *
 * Usage: just call `usePreventTwoFingerBack()` at the top of your component.
 * It will attach a `wheel` listener on window and clean up on unmount.
 */
export function usePreventTwoFingerBack() {
  useEffect(() => {
    // Only apply on macOS
    if (!navigator.userAgent.includes("Macintosh")) {
      return;
    }

    // Only apply in major browsers on macOS
    const ua = navigator.userAgent;
    const isChrome = ua.includes("Chrome");
    const isSafari = ua.includes("Safari") && !isChrome; // Safari UA also contains "Safari"
    const isFirefox = ua.includes("Firefox");

    if (!isChrome && !isSafari && !isFirefox) {
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      // 1) Detect a trackpad pinch (both axes non‐zero while ctrlKey is true)
      //    → allow it through so Konva’s zoom-in/out can run.
      const isPinch =
        e.ctrlKey === true && Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) > 0;
      if (isPinch) {
        // Let Konva or your own pinch-zoom logic take over.
        return;
      }

      // 2) If the event has already been prevented elsewhere, do nothing.
      if (e.defaultPrevented) return;

      // 3) Only consider “futile” horizontal (deltaX < 0) or vertical (deltaY > 0) swipes
      //    that might otherwise trigger Back/Forward in the browser.
      const isSwipingLeft = e.deltaX < 0;
      const isSwipingUp = e.deltaY > 0;
      if (!isSwipingLeft && !isSwipingUp) {
        // Not a two-finger swipe, so ignore.
        return;
      }

      // 4) Check if any scrollable ancestor can still scroll in the swipe direction.
      //    If none can scroll, then block the event to prevent history navigation.
      let el: HTMLElement | null =
        (e.target as HTMLElement) || document.scrollingElement;
      let canScrollFurther = false;

      while (el) {
        const style = window.getComputedStyle(el);
        const overflowX = style.overflowX;
        const overflowY = style.overflowY;
        const hasScrollableX = overflowX === "auto" || overflowX === "scroll";
        const hasScrollableY = overflowY === "auto" || overflowY === "scroll";

        // Horizontal check (two-finger swipe left)
        if (isSwipingLeft && hasScrollableX && el.scrollLeft > 0) {
          canScrollFurther = true;
          break;
        }
        // Vertical check (two-finger swipe up)
        if (isSwipingUp && hasScrollableY && el.scrollTop > 0) {
          canScrollFurther = true;
          break;
        }
        el = el.parentElement;
      }

      // 5) If no ancestor can scroll further, prevent default to stop Back/Forward navigation.
      if (!canScrollFurther) {
        e.preventDefault();
      }
    };

    // Use `{ passive: false }` so we are allowed to call preventDefault()
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);
}
