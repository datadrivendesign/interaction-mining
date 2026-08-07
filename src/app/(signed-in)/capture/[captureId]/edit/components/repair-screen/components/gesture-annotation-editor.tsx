"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScreenGesture } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  composeGestureTemplateDescription,
  GESTURE_DESCRIPTION_MAX_LENGTH,
  getGestureTemplate,
  getGestureTemplateDefaultSlots,
  GestureTemplateSlot,
  GestureTemplateSlotKey,
  isFreeformGestureType,
  parseGestureTemplateDescription,
  MIN_SLOT_LENGTH,
  hasCompleteDragPoints,
} from "../util";
import { GestureContext } from "./gesture-menu";
import { useNavigation } from "../repair-screen";
import { TargetSlotCombobox } from "./target-slot-combobox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";

export interface GestureAnnotationEditorHandle {
  focusDescription: () => void;
}

export const GestureAnnotationEditor =
  React.forwardRef<GestureAnnotationEditorHandle>(
    function GestureAnnotationEditor(_, ref) {
      const { gesture, setGesture } = useContext(GestureContext);
      const { handleNext } = useNavigation();
      const firstSlotInputRef = useRef<HTMLInputElement>(null);
      const textareaRef = useRef<HTMLTextAreaElement>(null);

      const [annotateLen, setAnnotateLen] = useState(
        () => (gesture.description ?? "").length,
      );
      const [slotValues, setSlotValues] = useState<
        Record<GestureTemplateSlotKey, string>
      >(() => getGestureTemplateDefaultSlots(gesture.type));
      const [legacyTemplateHint, setLegacyTemplateHint] = useState(false);
      const [isCollapsed, setIsCollapsed] = useState(false);
      // Track if slots have been touched for form validation
      const [targetTouched, setTargetTouched] = useState(false);
      const [goalTouched, setGoalTouched] = useState(false);
      const [destinationTouched, setDestinationTouched] = useState(false);
      const hasInitializedTypeRef = useRef(false);
      const previousGestureTypeRef = useRef<ScreenGesture["type"]>(
        gesture.type,
      );
      const localTemplateDescriptionRef = useRef<string | null>(null);

      const activeTemplate = useMemo(
        () => getGestureTemplate(gesture.type),
        [gesture.type],
      );
      const hasTargetSlot = useMemo(
        () => !!activeTemplate?.slots.some((slot) => slot.key === "target"),
        [activeTemplate],
      );
      const hasGoalSlot = useMemo(
        () => !!activeTemplate?.slots.some((slot) => slot.key === "goal"),
        [activeTemplate],
      );
      const hasDestinationSlot = useMemo(
        () =>
          !!activeTemplate?.slots.some((slot) => slot.key === "destination"),
        [activeTemplate],
      );
      const isTargetInvalid =
        hasTargetSlot &&
        (slotValues.target?.trim().length ?? 0) <= MIN_SLOT_LENGTH;
      const isGoalInvalid =
        hasGoalSlot && (slotValues.goal?.trim().length ?? 0) <= MIN_SLOT_LENGTH;
      const isDestinationInvalid =
        hasDestinationSlot &&
        (slotValues.destination?.trim().length ?? 0) <= MIN_SLOT_LENGTH;
      const MIN_CHARS_REQUIRED = MIN_SLOT_LENGTH + 1;
      const shouldShowTargetError =
        hasTargetSlot && targetTouched && isTargetInvalid;
      const shouldShowGoalError = hasGoalSlot && goalTouched && isGoalInvalid;
      const shouldShowDestinationError =
        hasDestinationSlot && destinationTouched && isDestinationInvalid;
      const shouldShowTemplateLengthError =
        shouldShowTargetError ||
        shouldShowGoalError ||
        shouldShowDestinationError;
      const shouldShowDragPointError =
        gesture.type === GESTURE_TYPES.DRAG && !hasCompleteDragPoints(gesture);

      // Decide whether to show the textarea or the template inputs
      const focusDescriptionField = useCallback(() => {
        if (isFreeformGestureType(gesture.type)) {
          textareaRef.current?.focus();
          return;
        }
        firstSlotInputRef.current?.focus();
      }, [gesture.type]);

      useImperativeHandle(
        ref,
        () => ({
          focusDescription: () => {
            if (isCollapsed) {
              setIsCollapsed(false);
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  focusDescriptionField();
                });
              });
              return;
            }
            focusDescriptionField();
          },
        }),
        [focusDescriptionField, isCollapsed],
      );

      // Update the length of the description as the user types
      useEffect(() => {
        setAnnotateLen((gesture.description ?? "").length);
      }, [gesture.description]);

      // Sync slotValues with gesture.type / gesture.description when the type changes
      useEffect(() => {
        const previousType = previousGestureTypeRef.current;
        const typeChanged = previousType !== gesture.type;

        if (!gesture.type) {
          localTemplateDescriptionRef.current = null;
          setLegacyTemplateHint(false);
          previousGestureTypeRef.current = gesture.type;
          return;
        }

        // If the gesture type is freeform, we need to handle the case where the user changes the type from a template to a freeform
        if (isFreeformGestureType(gesture.type)) {
          localTemplateDescriptionRef.current = null;
          if (
            typeChanged &&
            hasInitializedTypeRef.current &&
            previousType &&
            !isFreeformGestureType(previousType)
          ) {
            const previousParsed = parseGestureTemplateDescription(
              previousType,
              gesture.description ?? "",
            );
            const previousTemplate = getGestureTemplate(previousType);
            if (
              previousParsed &&
              previousTemplate &&
              previousTemplate.slots.some(
                (slot) => (previousParsed[slot.key] ?? "").trim().length === 0,
              )
            ) {
              setGesture((prev) => ({ ...prev, description: "" }));
            }
          }
          setLegacyTemplateHint(false);
          previousGestureTypeRef.current = gesture.type;
          hasInitializedTypeRef.current = true;
          return;
        }

        // If the gesture type is a template, we need to handle the case where the user changes the type from a template to a template
        if (typeChanged && hasInitializedTypeRef.current) {
          localTemplateDescriptionRef.current = null;
          const defaults = getGestureTemplateDefaultSlots(gesture.type);
          setSlotValues(defaults);
          setLegacyTemplateHint(false);
          setTargetTouched(false);
          setGoalTouched(false);
          setDestinationTouched(false);
          const templated = composeGestureTemplateDescription(
            gesture.type,
            defaults,
          );
          if (templated !== gesture.description) {
            setGesture((prev) => ({ ...prev, description: templated }));
          }
          previousGestureTypeRef.current = gesture.type;
          return;
        }

        if (
          hasInitializedTypeRef.current &&
          !typeChanged &&
          localTemplateDescriptionRef.current === (gesture.description ?? "")
        ) {
          localTemplateDescriptionRef.current = null;
          previousGestureTypeRef.current = gesture.type;
          return;
        }

        // If the gesture type is a template, we need to handle the case where the user changes the type from a freeform to a template
        const parsed = parseGestureTemplateDescription(
          gesture.type,
          gesture.description ?? "",
        );
        if (parsed) {
          setSlotValues(parsed);
          setLegacyTemplateHint(false);
          setTargetTouched(false);
          setGoalTouched(false);
          setDestinationTouched(false);
          const normalized = composeGestureTemplateDescription(
            gesture.type,
            parsed,
          );
          if (normalized !== gesture.description) {
            setGesture((prev) => ({ ...prev, description: normalized }));
          }
          hasInitializedTypeRef.current = true;
          previousGestureTypeRef.current = gesture.type;
          return;
        }

        // If the gesture type is a template, we need to handle the case where the legacy text is present and parse it into the goal slot
        const defaults = getGestureTemplateDefaultSlots(gesture.type);
        const legacyText = (gesture.description ?? "").trim();
        if (legacyText.length > 0) {
          defaults.goal = legacyText;
          setLegacyTemplateHint(true);
        } else {
          setLegacyTemplateHint(false);
        }
        setSlotValues(defaults);
        setTargetTouched(false);
        setGoalTouched(false);
        setDestinationTouched(false);
        const templated = composeGestureTemplateDescription(
          gesture.type,
          defaults,
        );
        if (templated !== gesture.description) {
          setGesture((prev) => ({ ...prev, description: templated }));
        }
        hasInitializedTypeRef.current = true;
        previousGestureTypeRef.current = gesture.type;
      }, [gesture.type, gesture.description, setGesture]);

      // Handle the enter key press for the freeform description
      const handleEnter = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleNext();
          }
        },
        [handleNext],
      );

      // Handle the change of the freeform description
      const handleFreeformChange = useCallback(
        (value: string) => {
          setGesture((prev) => ({ ...prev, description: value }));
        },
        [setGesture],
      );

      // Handle the change of the slot value
      const handleSlotChange = useCallback(
        (slot: GestureTemplateSlot, value: string) => {
          if (!gesture.type || !activeTemplate) return;
          const nextValues = { ...slotValues, [slot.key]: value };
          const nextDescription = composeGestureTemplateDescription(
            gesture.type,
            nextValues,
          );
          if (nextDescription.length > GESTURE_DESCRIPTION_MAX_LENGTH) return;
          localTemplateDescriptionRef.current = nextDescription;
          setSlotValues(nextValues);
          if (slot.key === "target") setTargetTouched(true);
          if (slot.key === "goal") setGoalTouched(true);
          if (slot.key === "destination") setDestinationTouched(true);
          setGesture((prev) => ({ ...prev, description: nextDescription }));
        },
        [activeTemplate, gesture.type, setGesture, slotValues],
      );

      // Handle the enter key press for the template inputs
      const handleTemplateEnter = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key !== "Enter" || e.shiftKey) return;
          e.preventDefault();
          if (isTargetInvalid) setTargetTouched(true);
          if (isGoalInvalid) setGoalTouched(true);
          if (isDestinationInvalid) setDestinationTouched(true);
          if (shouldShowDragPointError) return;
          if (isTargetInvalid || isGoalInvalid || isDestinationInvalid) return;
          handleNext();
        },
        [
          handleNext,
          isDestinationInvalid,
          isGoalInvalid,
          isTargetInvalid,
          shouldShowDragPointError,
        ],
      );

      return (
        <div className="relative z-[150] w-full rounded-xl border bg-background p-3 text-foreground shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Annotation
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-6 text-muted-foreground"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label={
                isCollapsed
                  ? "Expand annotation editor"
                  : "Collapse annotation editor"
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
            <p className="truncate text-xs text-muted-foreground">
              {(gesture.description ?? "").trim().length > 0
                ? gesture.description
                : "Collapsed. Expand to edit annotation."}
            </p>
          ) : (
            <>
              {isFreeformGestureType(gesture.type) || !activeTemplate ? (
                <Textarea
                  ref={textareaRef}
                  className="h-full w-full text-sm"
                  placeholder="Describe this gesture in your own words."
                  maxLength={GESTURE_DESCRIPTION_MAX_LENGTH}
                  value={gesture.description ?? ""}
                  onKeyDown={handleEnter}
                  onChange={(e) => handleFreeformChange(e.target.value)}
                />
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Fill in the missing fields.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTemplate.fixedParts.map((fixedPart, index) => {
                      const slot = activeTemplate.slots[index];
                      return (
                        <React.Fragment key={`${fixedPart}-${index}`}>
                          {fixedPart ? (
                            <span className="text-xs font-semibold tracking-wide whitespace-pre text-foreground">
                              {fixedPart}
                            </span>
                          ) : null}
                          {slot ? (
                            slot.key === "target" ? (
                              <TargetSlotCombobox
                                value={slotValues.target ?? ""}
                                onChange={(v) => handleSlotChange(slot, v)}
                                onTouched={() => setTargetTouched(true)}
                                slot={slot}
                                inputRef={
                                  index === 0 ? firstSlotInputRef : undefined
                                }
                                showError={shouldShowTargetError}
                                onEnter={handleNext}
                                isGoalInvalid={isGoalInvalid}
                                onGoalTouched={() => setGoalTouched(true)}
                                isDestinationInvalid={isDestinationInvalid}
                                onDestinationTouched={() =>
                                  setDestinationTouched(true)
                                }
                              />
                            ) : (
                              <input
                                ref={
                                  index === 0 ? firstSlotInputRef : undefined
                                }
                                className={cn(
                                  "border-input h-7 max-w-40 min-w-24 rounded border bg-background px-2 text-xs text-foreground",
                                  slot.key === "destination" &&
                                    shouldShowDestinationError
                                    ? "border-red-500"
                                    : "",
                                )}
                                aria-label={slot.label}
                                placeholder={slot.placeholder}
                                value={slotValues[slot.key] ?? ""}
                                onBlur={() => {
                                  if (slot.key === "goal") setGoalTouched(true);
                                  if (slot.key === "destination")
                                    setDestinationTouched(true);
                                }}
                                onKeyDown={handleTemplateEnter}
                                onChange={(e) =>
                                  handleSlotChange(slot, e.target.value)
                                }
                              />
                            )
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {shouldShowTemplateLengthError ? (
                    <p className="text-[11px] text-red-500">
                      All template fields must be at least {MIN_CHARS_REQUIRED}{" "}
                      characters.
                    </p>
                  ) : null}
                  {shouldShowDragPointError ? (
                    <p className="text-[11px] text-red-500">
                      Drag requires both a start point and an end point on the
                      screen.
                    </p>
                  ) : null}
                  {legacyTemplateHint ? (
                    <p className="text-[11px] text-amber-600">
                      Existing text was moved into goal. Complete missing
                      fields.
                    </p>
                  ) : null}
                </div>
              )}
              <div className="mt-2 flex w-full flex-col">
                <Progress
                  className="w-full"
                  value={(annotateLen / GESTURE_DESCRIPTION_MAX_LENGTH) * 100}
                />
                <div className="z-10 flex justify-end text-sm text-muted-foreground">
                  {`${annotateLen}/${GESTURE_DESCRIPTION_MAX_LENGTH}`}
                </div>
              </div>
            </>
          )}
        </div>
      );
    },
  );
