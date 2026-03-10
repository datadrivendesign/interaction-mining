"use client";

import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import Kbd from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { redactLabels, requiresCustomInput } from "@/lib/utils/redact-labels";
import { RedactCanvasContext } from "./redact-screen-canvas";

interface AnnotationCardProps {
  redactionId: string;
  annotation: string;
  setAnnotation: (value: string) => void;
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({
  redactionId,
  annotation,
  setAnnotation,
}) => {
  const annotateRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [labelValue, setLabelValue] = useState(annotation);
  const [customInput, setCustomInput] = useState(annotation);
  const maxLength = 30;
  const { selectRedaction } = useContext(RedactCanvasContext);
  const previousRedactionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isCollapsed && labelValue === "") {
      setOpen(true);
    }
  }, [isCollapsed, labelValue, setOpen]);

  useEffect(() => {
    setLabelValue(annotation);
    setCustomInput(annotation);
  }, [annotation]);

  useEffect(() => {
    if (previousRedactionIdRef.current === redactionId) {
      return;
    }
    const hasExistingLabel = (annotation ?? "").trim().length > 0;
    // Default to minimized for already-annotated redactions to reduce occlusion.
    setIsCollapsed(hasExistingLabel);
    previousRedactionIdRef.current = redactionId;
  }, [annotation, redactionId]);

  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (next) {
        setOpen(false);
      }
      return next;
    });
  }, []);

  const handleLabelSelect = useCallback(
    (selectedValue: string) => {
      // Focus the textarea if it requires custom input
      if (requiresCustomInput(selectedValue)) {
        setTimeout(() => annotateRef.current?.focus(), 100);
      } else {
        setAnnotation(selectedValue);
        selectRedaction(null, false);
      }
      setLabelValue(selectedValue);
      setOpen(false);
    },
    [selectRedaction, setAnnotation, setLabelValue, setOpen],
  );

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        selectRedaction(null, false);
      }
    },
    [selectRedaction],
  );

  const handleTextareaChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCustomInput(value);
      setAnnotation(value);
    },
    [setAnnotation, setCustomInput],
  );

  return (
    <div className="absolute z-[150]">
      <Card className="flex flex-col items-start gap-2 p-3 shadow-lg max-w-80">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-semibold">Annotation</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
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
        {isCollapsed ? (
          <p className="max-w-56 truncate text-xs text-muted-foreground">
            {(annotation ?? "").trim().length > 0
              ? `Label: ${annotation}`
              : "Collapsed. Expand to add a label."}
          </p>
        ) : (
          <>
            <div className="text-sm font-semibold flex flex-col gap-1">
              <div className="flex w-full justify-start items-center gap-1 text-sm">
                <span>Multi-Select:</span>
                Hold{" "}
                <Kbd className="text-muted-foreground rounded-sm">Shift</Kbd> +
                Click
              </div>
              <div className="flex w-full justify-start items-center gap-1 text-sm">
                <span>Copy/Paste:</span>
                <Kbd className="text-muted-foreground rounded-sm">
                  Ctrl+C
                </Kbd>{" "}
                and
                <Kbd className="text-muted-foreground rounded-sm">Ctrl+V</Kbd>
              </div>
              <div className="flex w-full justify-start items-center gap-1 text-sm">
                <span>Delete:</span>
                <Kbd className="text-muted-foreground rounded-sm">
                  Backspace
                </Kbd>
              </div>
              <div className="flex w-full justify-start items-center gap-1 text-sm">
                <span>Close:</span>
                <Kbd className="text-muted-foreground rounded-sm">Esc</Kbd>
              </div>
            </div>
            <div className="flex flex-row items-center justify-stretch gap-2">
              <Label className="text-sm font-semibold">Label</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-between">
                    {labelValue === "" ? "Empty label..." : labelValue}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-50 p-0"
                  align="start"
                  side="bottom"
                >
                  <Command>
                    <CommandList>
                      {redactLabels.map((label) => (
                        <CommandItem
                          key={label.value}
                          value={label.value}
                          onSelect={() => handleLabelSelect(label.value)}
                        >
                          {label.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {requiresCustomInput(labelValue) && (
              <div className="w-full">
                <Textarea
                  placeholder="Give 1-2 word label for redaction..."
                  maxLength={maxLength}
                  ref={annotateRef}
                  value={customInput}
                  onChange={handleTextareaChange}
                  onKeyDown={handleEnter}
                  className="w-45"
                />
                <div className="w-45 flex flex-col">
                  <Progress
                    className="w-full"
                    value={(customInput.length / maxLength) * 100}
                  />
                  <div className="text-sm flex justify-end text-muted-foreground z-10">
                    {`${customInput.length}/${maxLength}`}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default AnnotationCard;
