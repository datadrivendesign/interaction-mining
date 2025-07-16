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

  useLayoutEffect(() => {
    const measure = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerW = containerRef.current!.getBoundingClientRect().width;
      const contentW = Math.max(
        contentRef.current!.scrollWidth,
        contentRef.current!.getBoundingClientRect().width
      );
      setIsTruncated(contentW > containerW);
    };
    const rafId = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [size, children]);

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

  const contentElement = useMemo(() => (<div ref={contentRef} className={cn("w-full whitespace-nowrap", isTruncated && "*:mr-2")}>{children}</div>
  ), [children, isTruncated]);

  return (
    <div
      ref={mergedRef}
      className={cn(isTruncated ? "overflow-hidden" : "truncate flex justify-center", className)}
      title={title}
      onMouseEnter={handleMouseEnter}
    >
      {isTruncated ? (
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
      ) : (
        <div className="flex items-center justify-center w-full">
          {contentElement}
        </div>
      )}
    </div>
  );
};