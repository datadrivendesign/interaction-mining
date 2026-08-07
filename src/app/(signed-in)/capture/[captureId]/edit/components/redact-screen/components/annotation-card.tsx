"use client";

import React, {
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { redactLabels } from "@/lib/utils/redact-labels";
import { RedactCanvasContext } from "./redact-screen-canvas";

interface AnnotationCardProps {
  annotation: string;
  setAnnotation: (value: string) => void;
}

const MAX_LENGTH = 30;

const AnnotationCard: React.FC<AnnotationCardProps> = ({
  annotation,
  setAnnotation,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState(annotation);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const { selectRedaction } = useContext(RedactCanvasContext);

  const filteredLabels = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return redactLabels;
    }
    return redactLabels.filter((label) =>
      label.label.toLowerCase().includes(query),
    );
  }, [inputValue]);

  useEffect(() => {
    if (!isCollapsed && inputValue === "") {
      setOpen(true);
    }
  }, [inputValue, isCollapsed]);

  useEffect(() => {
    setInputValue(annotation);
  }, [annotation]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setHighlightIndex((prev) =>
      filteredLabels.length === 0
        ? 0
        : Math.min(prev, filteredLabels.length - 1),
    );
  }, [filteredLabels, open]);

  useEffect(() => {
    if (!open || filteredLabels.length === 0) {
      return;
    }
    const highlightedValue = filteredLabels[highlightIndex]?.value;
    if (!highlightedValue) {
      return;
    }
    optionRefs.current[highlightedValue]?.scrollIntoView({
      block: "nearest",
    });
  }, [filteredLabels, highlightIndex, open]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    },
    [],
  );

  const commitAndClose = useCallback(
    (value: string) => {
      const trimmedValue = value.trim();
      setInputValue(trimmedValue);
      setAnnotation(trimmedValue);
      setOpen(false);
      setHighlightIndex(0);
      selectRedaction(null, false);
    },
    [selectRedaction, setAnnotation],
  );

  const handleLabelSelect = useCallback(
    (selectedValue: string) => {
      const matchedLabel = redactLabels.find(
        (label) => label.value === selectedValue,
      );
      commitAndClose(matchedLabel?.label ?? selectedValue);
    },
    [commitAndClose],
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
        }
        if (filteredLabels.length === 0) {
          return;
        }
        const delta = e.key === "ArrowDown" ? 1 : -1;
        setHighlightIndex(
          (prev) =>
            (prev + delta + filteredLabels.length) % filteredLabels.length,
        );
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        selectRedaction(null, false);
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (open && filteredLabels[highlightIndex]?.value) {
          handleLabelSelect(filteredLabels[highlightIndex].value);
          return;
        }
        commitAndClose(inputValue);
        return;
      }

      if (e.key === "Tab") {
        setOpen(false);
      }
    },
    [
      commitAndClose,
      filteredLabels,
      handleLabelSelect,
      highlightIndex,
      inputValue,
      open,
      selectRedaction,
    ],
  );

  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (next) {
        setOpen(false);
      }
      return next;
    });
  }, []);

  return (
    <div className="absolute z-[150]">
      <Card className="pointer-events-auto h-fit w-52 max-w-[calc(100vw-2rem)] rounded-md border bg-background p-0 shadow-md">
        <div className="w-full space-y-2 p-1.5">
          <div className="flex w-full items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              Annotation
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6 text-muted-foreground"
                onClick={handleCollapseToggle}
                aria-label={
                  isCollapsed
                    ? "Expand annotation card"
                    : "Collapse annotation card"
                }
              >
                {isCollapsed ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </Button>
            </div>
          </div>
          {isCollapsed ? (
            <p className="max-w-full truncate px-2 text-xs text-muted-foreground">
              {(annotation ?? "").trim().length > 0
                ? `Label: ${annotation}`
                : "Collapsed. Expand to add a label."}
            </p>
          ) : (
            <div className="rounded-md border border-sky-200/80 bg-sky-50/95 px-2.5 py-2 shadow-sm dark:border-sky-800 dark:bg-sky-900/95">
              <div className="mb-1 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Label
              </div>
              <div className="space-y-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverAnchor asChild>
                    <input
                      ref={inputRef}
                      className={cn(
                        "border-input h-8 w-full rounded-md border bg-background px-3 text-sm text-foreground",
                      )}
                      aria-label="Redaction label"
                      placeholder="Search or type label..."
                      value={inputValue}
                      maxLength={MAX_LENGTH}
                      onFocus={() => setOpen(true)}
                      onBlur={() => {
                        if (blurTimeoutRef.current) {
                          clearTimeout(blurTimeoutRef.current);
                        }
                        blurTimeoutRef.current = setTimeout(
                          () => setOpen(false),
                          120,
                        );
                      }}
                      onKeyDown={handleInputKeyDown}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setAnnotation(e.target.value);
                        setOpen(true);
                        setHighlightIndex(0);
                      }}
                    />
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-44 p-0"
                    align="start"
                    side="bottom"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Command
                      shouldFilter={false}
                      value={filteredLabels[highlightIndex]?.value ?? ""}
                    >
                      <CommandList>
                        {filteredLabels.map((label, index) => (
                          <CommandItem
                            key={label.value}
                            ref={(node) => {
                              if (node) {
                                optionRefs.current[label.value] = node;
                              }
                            }}
                            value={label.value}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setHighlightIndex(index)}
                            onSelect={() => handleLabelSelect(label.value)}
                            className="cursor-pointer"
                          >
                            {label.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-col">
                  <Progress
                    className="w-full"
                    value={(inputValue.length / MAX_LENGTH) * 100}
                  />
                  <div className="z-10 flex justify-end text-[11px] text-muted-foreground">
                    {`${inputValue.length}/${MAX_LENGTH}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AnnotationCard;
