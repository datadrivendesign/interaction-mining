"use client";

import { useRef, useState, useEffect, FC, useCallback, useLayoutEffect, useMemo } from "react";
import Marquee from "react-fast-marquee";
import { useIntersectionObserver, useWindowSize } from "@uidotdev/usehooks";

import { cn } from "@/lib/utils";

interface TitleMarqueeProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  pauseDurationMs?: number;  // pause length at each end
  speed?: number;            // scrolling speed
  mode?: "hover" | "visibility";
}

export const TitleMarquee: FC<TitleMarqueeProps> = ({
  children,
  title = "",
  className = "",
  pauseDurationMs = 3000,
  speed = 50,
  mode = "visibility",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const size = useWindowSize();
  const [isPlay, setIsPlay] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  const [ioRef, entry] = useIntersectionObserver({
    threshold: 1.0,
    root: null,
    rootMargin: "0px",
  });
  const isVisible = entry?.isIntersecting ?? false;

  useEffect(() => {
    const c = containerRef.current;
    const t = contentRef.current;
    if (!c || !t) return;
    const observer = new ResizeObserver(() => {
      const containerW = Math.floor(c.clientWidth);
      const contentW = Math.max(Math.ceil(c.scrollWidth), Math.ceil(t.scrollWidth)); // LOL this is a hack to get the content width, might break
      setIsTruncated(contentW > containerW);
    });
    observer.observe(c);
    observer.observe(t);
    // initial measurement
    observer.disconnect(); // restart to capture initial sizes
    observer.observe(c);
    observer.observe(t);
    return () => observer.disconnect();
  }, [size]);

  // delay initial play by 1s when truncation is true and mode is visibility
  useEffect(() => {
    if (mode !== "visibility") return;
    if (isTruncated) {
      const timer = setTimeout(() => {
        setIsPlay(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isTruncated, mode]);

  // hover mode handlers
  const handleMouseEnter = () => {
    if (mode === "hover" && isTruncated) {
      setIsPlay(true);
    }
  };

  // handler to pause at end of cycle
  const handleCycleComplete = () => {
    setIsPlay(false);
    if (mode === "visibility") {
      setTimeout(() => {
        setIsPlay(true);
      }, pauseDurationMs);
    }
  };

  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    // Update our container ref
    containerRef.current = node;
    // Forward to intersection observer ref
    if (typeof ioRef === "function") {
      ioRef(node);
    } else if (ioRef && typeof ioRef === "object") {
      (ioRef as any).current = node;
    }
  }, [ioRef]);

  const contentElement = useMemo(() => (<div ref={contentRef} className={cn("whitespace-nowrap", isTruncated && "*:mr-2")}>{children}</div>
  ), [children, isTruncated]);

  return (
    <div
      ref={mergedRef}
      className={cn(isTruncated ? "overflow-hidden" : "truncate", className)}
      title={title}
      onMouseEnter={handleMouseEnter}
    >
      <Marquee
        speed={speed}
        pauseOnHover={false}
        pauseOnClick={false}
        loop={0}
        play={isTruncated && (mode === "visibility" ? isVisible && isPlay : isPlay)}
        onCycleComplete={handleCycleComplete}
      >
        {contentElement}
      </Marquee>
    </div>
  );
};