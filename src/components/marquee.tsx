"use client";

import React from "react";
import { useRef, useState, useEffect, FC } from "react";
import Marquee from "react-fast-marquee";
import { useIntersectionObserver } from "@uidotdev/usehooks";

interface TitleMarqueeProps {
  children: React.ReactNode;
  className?: string;
  pauseDurationMs?: number;  // pause length at each end
  speed?: number;            // scrolling speed
}

export const TitleMarquee: FC<TitleMarqueeProps> = ({
  children,
  className = "",
  pauseDurationMs = 3000,
  speed = 50,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [playMarquee, setPlayMarquee] = useState(false);

  const [ioRef, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: "0px",
  });
  const isVisible = entry?.isIntersecting;

  // detect truncation after first render
  useEffect(() => {
    const el = containerRef.current!;
    setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [children]);

  // delay initial play by 1s when truncation and visibility are true
  useEffect(() => {
    if (isTruncated && isVisible) {
      const timer = setTimeout(() => {
        setPlayMarquee(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isTruncated, isVisible]);

  // handler to pause at end of cycle
  const handleCycleComplete = () => {
    setPlayMarquee(false);
    setTimeout(() => {
      setPlayMarquee(true);
    }, pauseDurationMs);
  };

  // if not truncated, render plain
  if (!isTruncated) {
    return (
      <div
        ref={containerRef}
        className={`truncate ${className}`}
        title={String(children)}
      >
        {children}
      </div>
    );
  }

  // else render a single‐pass marquee that pauses then restarts
  return (
    <div className={`overflow-hidden ${className}`} ref={ioRef}>
      <Marquee
        gradient={false}
        speed={speed}
        pauseOnHover={false}
        pauseOnClick={false}
        loop={0}
        play={isVisible && playMarquee}
        onCycleComplete={handleCycleComplete}
      >
        <span className="whitespace-nowrap *:pr-2">{children}</span>
      </Marquee>
    </div>
  );
};