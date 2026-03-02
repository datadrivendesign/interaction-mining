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
} from "../util";
import { GestureContext } from "./gesture-menu";
import { useNavigation } from "../repair-screen";
import { TargetSlotCombobox } from "./target-slot-combobox";

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
      // Track if target and goal slots have been touched for form validation
      const [targetTouched, setTargetTouched] = useState(false);
      const [goalTouched, setGoalTouched] = useState(false);
      const hasInitializedTypeRef = useRef(false);
      const previousGestureTypeRef = useRef<ScreenGesture["type"]>(
        gesture.type,
      );

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
      const isTargetInvalid =
        hasTargetSlot &&
        (slotValues.target?.trim().length ?? 0) <= MIN_SLOT_LENGTH;
      const isGoalInvalid =
        hasGoalSlot && (slotValues.goal?.trim().length ?? 0) <= MIN_SLOT_LENGTH;
      const MIN_CHARS_REQUIRED = MIN_SLOT_LENGTH + 1;
      const shouldShowTargetError =
        hasTargetSlot && targetTouched && isTargetInvalid;
      const shouldShowGoalError = hasGoalSlot && goalTouched && isGoalInvalid;
      const shouldShowTemplateLengthError =
        shouldShowTargetError || shouldShowGoalError;

      // Decide whether to show the textarea or the template inputs
      useImperativeHandle(
        ref,
        () => ({
          focusDescription: () => {
            if (isFreeformGestureType(gesture.type)) {
              textareaRef.current?.focus();
            } else {
              firstSlotInputRef.current?.focus();
            }
          },
        }),
        [gesture.type],
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
          setLegacyTemplateHint(false);
          previousGestureTypeRef.current = gesture.type;
          return;
        }

        // If the gesture type is freeform, we need to handle the case where the user changes the type from a template to a freeform
        if (isFreeformGestureType(gesture.type)) {
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
          const defaults = getGestureTemplateDefaultSlots(gesture.type);
          setSlotValues(defaults);
          setLegacyTemplateHint(false);
          setTargetTouched(false);
          setGoalTouched(false);
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
          setSlotValues(nextValues);
          if (slot.key === "target") setTargetTouched(true);
          if (slot.key === "goal") setGoalTouched(true);
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
          if (isTargetInvalid || isGoalInvalid) return;
          handleNext();
        },
        [handleNext, isGoalInvalid, isTargetInvalid],
      );

      return (
        <div className="w-full">
          {isFreeformGestureType(gesture.type) || !activeTemplate ? (
            <Textarea
              ref={textareaRef}
              className="text-sm w-full h-full bg-background!"
              placeholder="Describe this gesture in your own words."
              maxLength={GESTURE_DESCRIPTION_MAX_LENGTH}
              value={gesture.description ?? ""}
              onKeyDown={handleEnter}
              onChange={(e) => handleFreeformChange(e.target.value)}
            />
          ) : (
            <div className="rounded-md border bg-background p-2 space-y-2">
              <div className="text-xs text-muted-foreground">
                Fill in the missing fields.
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {activeTemplate.fixedParts.map((fixedPart, index) => {
                  const slot = activeTemplate.slots[index];
                  return (
                    <React.Fragment key={`${fixedPart}-${index}`}>
                      {fixedPart ? (
                        <span className="text-xs font-semibold tracking-wide text-foreground/90 whitespace-pre">
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
                          />
                        ) : (
                          <input
                            ref={index === 0 ? firstSlotInputRef : undefined}
                            className="h-7 min-w-24 max-w-40 rounded border bg-background px-2 text-xs"
                            aria-label={slot.label}
                            placeholder={slot.placeholder}
                            value={slotValues[slot.key] ?? ""}
                            onBlur={() => {
                              if (slot.key === "goal") setGoalTouched(true);
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
              {legacyTemplateHint ? (
                <p className="text-[11px] text-amber-600">
                  Existing text was moved into goal. Complete missing fields.
                </p>
              ) : null}
            </div>
          )}
          <div className="w-full flex flex-col">
            <Progress
              className="w-full"
              value={(annotateLen / GESTURE_DESCRIPTION_MAX_LENGTH) * 100}
            />
            <div className="text-sm flex justify-end text-muted-foreground z-10">
              {`${annotateLen}/${GESTURE_DESCRIPTION_MAX_LENGTH}`}
            </div>
          </div>
        </div>
      );
    },
  );
