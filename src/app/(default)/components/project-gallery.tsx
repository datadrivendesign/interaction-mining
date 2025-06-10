// src/app/components/project-gallery/index.tsx
"use client";

import ProjectCard from "@/app/components/project-card";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import works from "@/data/works";

const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const matchMedia = window.matchMedia("(pointer: coarse)");
    setIsTouch(matchMedia.matches);

    const handleMatchMediaChange = (event: MediaQueryListEvent) => {
      setIsTouch(event.matches);
    };

    matchMedia.addEventListener("change", handleMatchMediaChange);

    return () => {
      matchMedia.removeEventListener("change", handleMatchMediaChange);
    };
  }, []);

  return isTouch;
};

export default function ProjectGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;

    let closestIndex = 0;
    let smallestDistance = Infinity;

    cardRefs.current.forEach((cardEl, idx) => {
      if (!cardEl) return;
      const distance = Math.abs(cardEl.offsetLeft - scrollLeft);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = idx;
      }
    });

    // Update selectedIndex if it changed
    if (closestIndex !== selectedIndex) {
      setSelectedIndex(closestIndex);
    }
  };

  useEffect(() => {
    cardRefs.current = Array(works.length).fill(null);
  }, []);

  const isTouch = useIsTouchDevice();

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative flex w-full snap-x snap-mandatory gap-6 lg:gap-8 overflow-x-auto pb-6 lg:pb-8 overscroll-x-none"
    >
      {/* Left “spacer” so first card can snap fully into view */}
      <div className="shrink-0 snap-start scroll-mx-6 lg:scroll-mx-8">
        <div className="w-0 shrink-0"></div>
      </div>

      {works.map((work, index) => (
        <ProjectCard
          key={index}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          title={work.title}
          description={work.description}
          colors={work.colors}
          link={work.link}
          isSelected={index === selectedIndex}
          isTouch={isTouch}
        >
          <figure className="flex justify-center items-center w-full h-full p-4">
            {!work.image && (
              <div className="absolute z-20 top-4 left-4 flex flex-col p-6">
                <span className="font-semibold">{work.title}</span>
                <span className="text-sm">Teaser WIP</span>
              </div>
            )}
            <Image
              src={
                (work.image && work.image.light) ||
                "/blank_ruled_grid_light.png"
              }
              alt="Teaser"
              className="relative z-10 block dark:hidden w-full h-auto object-contain rounded-xl border border-neutral-200 dark:border-neutral-800"
              width={0}
              height={0}
              sizes="100vw"
            />
            <Image
              src={
                (work.image && work.image.dark) || "/blank_ruled_grid_dark.png"
              }
              alt={`${work.title} Teaser`}
              className="relative z-10 hidden dark:block w-full h-auto object-contain rounded-xl border border-neutral-200 dark:border-neutral-800"
              width={0}
              height={0}
              sizes="100vw"
            />
          </figure>
        </ProjectCard>
      ))}

      <div className="shrink-0 snap-start w-[calc(50%-3rem)] lg:w-[calc(75%-4rem)]"></div>
    </div>
  );
}
