"use client";

import { forwardRef, HTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  colors: [string, string];
  link: string | null;
  isTouch: boolean;
  isSelected: boolean;
} & HTMLAttributes<HTMLDivElement>;

const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>(
  function ProjectCard(
    {
      children,
      title,
      description,
      colors,
      link,
      isTouch,
      isSelected,
      ...props
    },
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div
        ref={ref}
        {...props}
        className="flex h-auto w-1/2 shrink-0 snap-start scroll-mx-6 flex-col md:w-1/3 lg:w-1/4 lg:scroll-mx-8"
      >
        <Link href={link ?? "#"} className="group cursor-pointer">
          <div
            className={cn(
              `relative aspect-[4/5] h-auto w-full overflow-clip rounded-2xl bg-background transition-all duration-300 ease-in-out`,
              !isTouch
                ? `border border-neutral-200 hover:border-3 dark:border-neutral-800 hover:border-${colors[0]}-300 dark:hover:border-${colors[0]}-700`
                : isSelected
                  ? `border-3 border-${colors[0]}-300 dark:border-${colors[0]}-700`
                  : "border border-neutral-200 dark:border-neutral-800",
            )}
          >
            <div className="absolute z-10 h-full w-full scale-100 opacity-100 transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:opacity-80">
              {children}
            </div>
            <div
              className={cn(
                "absolute h-full w-full transition-transform duration-300 ease-in-out",
                `bg-radial-[at_0%_100%] from-${colors[0]}-300 from-0% via-${colors[1]}-100 via-40% to-transparent to-80% dark:bg-radial-[at_0%_100%] dark:from-${colors[0]}-700 dark:from-0% dark:via-${colors[1]}-900 dark:via-40% dark:to-transparent dark:to-80%`,
                !isTouch
                  ? "-translate-x-1/2 translate-y-1/2 group-hover:translate-x-0 group-hover:translate-y-0"
                  : isSelected
                    ? "translate-x-0 translate-y-0"
                    : "-translate-x-1/2 translate-y-1/2",
              )}
            ></div>
          </div>
          <p className="mt-4 text-muted-foreground transition-colors duration-300 ease-in-out hover:text-foreground">
            <span className="font-semibold text-foreground">{title}</span>{" "}
            {description ? `— ${description}` : ""}
          </p>
        </Link>
      </div>
    );
  },
);

export default ProjectCard;
