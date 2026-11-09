"use client";

import Image from "next/image";
import {
  Dispatch,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ScreenGesture } from "@prisma/client";
import { Check, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  findGestureOption,
  gestureOptions,
  normalizeGestureType,
} from "@/lib/utils/gesture-options";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";
import { redactLabels } from "@/lib/utils/redact-labels";
import { cn } from "@/lib/utils";
import { Redaction } from "../../../edit/components/types";
import {
  composeGestureTemplateDescription,
  GESTURE_DESCRIPTION_MAX_LENGTH,
  getGestureTemplate,
  getGestureTemplateDefaultSlots,
  GestureTemplateSlotKey,
  getScreenAnnotationIssue,
  isFreeformGestureType,
  MIN_SLOT_LENGTH,
  parseGestureTemplateDescription,
  SCREEN_ANNOTATION_ISSUE_ACTIONS,
} from "../../../edit/components/repair-screen/util/gesture-description-template";
import { GestureContext } from "../../../edit/components/repair-screen/components/gesture-menu";
import { GestureSelection } from "../../../edit/components/repair-screen/components/gesture-selection";
import { TargetSlotCombobox } from "../../../edit/components/repair-screen/components/target-slot-combobox";
import { isRedactionLabelled } from "../../../edit/util/redaction-completeness";
import { ScreenDescription } from "./screen-description";
import { FixTab, FixTarget, isScreenFixUnchanged } from "./use-screen-fixes";

/** Boxes smaller than this (fraction of the screen) are treated as a click. */
const MIN_BOX_FRACTION = 0.01;
/**
 * Width of the side panel; the screenshot takes the rest. Keep in step with
 * the image's md:max-w (panel + 4rem of padding and margin = 30rem).
 */
const PANEL_WIDTH_REM = 26;

/** Example notes for a box, the same list the edit page offers. */
const BOX_NOTE_EXAMPLES = redactLabels
  .filter((label) => !label.requiresCustomInput)
  .map((label) => label.value);

const SLOT_COLOR: Record<GestureTemplateSlotKey, { tab: string; box: string }> =
  {
    target: {
      tab: "bg-blue-600 dark:bg-blue-500",
      box: "border-blue-600 dark:border-blue-500",
    },
    goal: {
      tab: "bg-teal-700 dark:bg-teal-600",
      box: "border-teal-700 dark:border-teal-600",
    },
    destination: {
      tab: "bg-teal-700 dark:bg-teal-600",
      box: "border-teal-700 dark:border-teal-600",
    },
  };

type Point = { x: number; y: number };
type Slots = Record<GestureTemplateSlotKey, string>;
/** Ways out of the open screen, which unsaved changes must confirm. */
type Exit = { kind: "close" } | { kind: "navigate"; screenId: string };

const EMPTY_GESTURE: ScreenGesture = {
  type: null,
  x: null,
  y: null,
  scrollDeltaX: null,
  scrollDeltaY: null,
  description: null,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Keys typed here belong to the field, not to screen navigation. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest(
    'input, textarea, select, [contenteditable="true"], [role="tab"], [role="listbox"], [role="option"], [cmdk-root]',
  );
}

/** Slot values for a gesture, keeping an old free-text description in "why". */
function initialSlots(gesture?: ScreenGesture): Slots {
  const slots = getGestureTemplateDefaultSlots(gesture?.type ?? null);
  if (!gesture?.type || !gesture.description) return slots;
  const parsed = parseGestureTemplateDescription(
    gesture.type,
    gesture.description,
  );
  if (parsed) return parsed;
  // Saved before templates (or under another type): same as the edit page.
  return { ...slots, goal: gesture.description };
}

/** Moves typed slot text over to a new gesture type's slots. */
function remapSlots(prev: Slots, nextType: string | null): Slots {
  const next = getGestureTemplateDefaultSlots(nextType);
  const template = nextType ? getGestureTemplate(nextType) : null;
  template?.slots.forEach((slot) => {
    next[slot.key] =
      prev[slot.key] ||
      (slot.key === "destination" ? prev.goal : "") ||
      (slot.key === "goal" ? prev.destination : "");
  });
  return next;
}

type ScreenViewerDialogProps = {
  target: FixTarget | null;
  /** Staff can fix; everyone else only looks. */
  canEdit: boolean;
  /** 1-based position the screen has (or will have, if new). */
  screenNumber: number;
  screenCount: number;
  isLastScreen: boolean;
  /** Where the screen sits in the video (iOS), e.g. "12.4 s". */
  timeLabel?: string;
  gesture?: ScreenGesture;
  redactions: Redaction[];
  /** Reviewer notes on this screen; a screen with notes cannot be removed. */
  noteCount: number;
  /** Neighbours for the arrows; null at either end or for a new screen. */
  previousScreenId: string | null;
  nextScreenId: string | null;
  onNavigate: (screenId: string, mode: FixTab) => void;
  isSaving: boolean;
  onSave: (
    gesture: ScreenGesture | null,
    redactions: Redaction[],
  ) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onClose: () => void;
};

/**
 * One screen at full height, with arrows to the screens either side. Staff
 * can switch to Gesture or Redaction to fix the screen; Save writes a new
 * draft straight away. Leaving with unsaved changes asks first.
 */
export function ScreenViewerDialog(props: ScreenViewerDialogProps) {
  const { target, isSaving, onClose, previousScreenId, nextScreenId } = props;
  // The open form decides whether an exit needs confirming.
  const requestExitRef = useRef<((exit: Exit) => void) | null>(null);
  const requestExit = (exit: Exit) => {
    if (requestExitRef.current) requestExitRef.current(exit);
    else if (exit.kind === "close") onClose();
  };

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open && !isSaving) requestExit({ kind: "close" });
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] w-fit max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)] md:flex-row"
        onKeyDown={(event) => {
          if (event.key === "Escape") return; // the dialog handles it
          // Page hotkeys stay off while the dialog is open.
          event.stopPropagation();
          if (isSaving || isTypingTarget(event.target)) return;
          const screenId =
            event.key === "ArrowLeft"
              ? previousScreenId
              : event.key === "ArrowRight"
                ? nextScreenId
                : null;
          if (screenId) {
            event.preventDefault();
            requestExit({ kind: "navigate", screenId });
          }
        }}
      >
        {target && (
          <ScreenViewerForm
            // Fresh state for every screen opened.
            key={`${target.screen.id}:${target.isNew}`}
            {...props}
            target={target}
            requestExitRef={requestExitRef}
            requestExit={requestExit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScreenViewerForm({
  target,
  canEdit,
  screenNumber,
  screenCount,
  isLastScreen,
  timeLabel,
  gesture: savedGesture,
  redactions: savedRedactions,
  noteCount,
  previousScreenId,
  nextScreenId,
  onNavigate,
  isSaving,
  onSave,
  onRemove,
  onClose,
  requestExitRef,
  requestExit,
}: ScreenViewerDialogProps & {
  target: FixTarget;
  requestExitRef: MutableRefObject<((exit: Exit) => void) | null>;
  requestExit: (exit: Exit) => void;
}) {
  const { screen, isNew } = target;
  const [mode, setMode] = useState<FixTab>(canEdit ? target.tab : "view");
  const isEditing = canEdit && mode !== "view";

  // Set once the person changes something, so a screen that only looks
  // different after loading (an old description) does not count as unsaved.
  const [touched, setTouched] = useState(false);
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  // ---- Redaction boxes -------------------------------------------------
  const [boxes, setBoxesState] = useState<Redaction[]>(savedRedactions);
  const setBoxes: Dispatch<SetStateAction<Redaction[]>> = (value) => {
    setTouched(true);
    setBoxesState(value);
  };
  const [seeUnderBoxes, setSeeUnderBoxes] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);
  const noteInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusBoxId, setFocusBoxId] = useState<string | null>(null);
  useEffect(() => {
    if (!focusBoxId) return;
    noteInputRefs.current[focusBoxId]?.focus();
    setFocusBoxId(null);
  }, [focusBoxId]);
  const setBoxNote = (boxId: string, annotation: string) =>
    setBoxes((prev) =>
      prev.map((box) => (box.id === boxId ? { ...box, annotation } : box)),
    );

  // ---- Gesture ---------------------------------------------------------
  // One ScreenGesture, the shape the edit page's gesture picker works on.
  const [gesture, setGestureState] = useState<ScreenGesture>(
    savedGesture ?? EMPTY_GESTURE,
  );
  // The picker adjusts the gesture when it mounts; only later calls are the
  // person's. Stable, so the picker's effect does not re-run every render.
  const setGestureFromPicker = useCallback<
    Dispatch<SetStateAction<ScreenGesture>>
  >((value) => {
    if (isMountedRef.current) setTouched(true);
    setGestureState(value);
  }, []);
  const setGesture: Dispatch<SetStateAction<ScreenGesture>> = (value) => {
    setTouched(true);
    setGestureState(value);
  };
  // The last screen usually has no gesture; the picker shows on request.
  const [showPicker, setShowPicker] = useState(
    !!savedGesture?.type || !isLastScreen,
  );
  const isDrag = normalizeGestureType(gesture.type) === GESTURE_TYPES.DRAG;
  const hasStart = gesture.x !== null && gesture.y !== null;
  const hasEnd = gesture.scrollDeltaX !== null && gesture.scrollDeltaY !== null;
  const gestureContextValue = useMemo(
    () => ({
      gesture,
      setGesture: setGestureFromPicker,
      gestureOptions,
      canvasSize: { width: 0, height: 0 },
    }),
    [gesture, setGestureFromPicker],
  );

  // ---- Description -----------------------------------------------------
  const [slots, setSlots] = useState<Slots>(() => initialSlots(savedGesture));
  const [freeform, setFreeform] = useState(savedGesture?.description ?? "");
  const firstSlotRef = useRef<HTMLInputElement>(null);
  // When the picker changes the type, carry typed text to the new slots.
  const previousTypeRef = useRef(gesture.type);
  useEffect(() => {
    if (previousTypeRef.current === gesture.type) return;
    previousTypeRef.current = gesture.type;
    setSlots((prev) => remapSlots(prev, gesture.type));
  }, [gesture.type]);

  const legacyDescription =
    savedGesture?.type &&
    savedGesture.description &&
    !isFreeformGestureType(savedGesture.type) &&
    !parseGestureTemplateDescription(
      savedGesture.type,
      savedGesture.description,
    )
      ? savedGesture.description
      : null;
  const template = gesture.type ? getGestureTemplate(gesture.type) : null;
  const isFreeform = !!gesture.type && isFreeformGestureType(gesture.type);
  const description = !gesture.type
    ? ""
    : isFreeform
      ? freeform.trim()
      : composeGestureTemplateDescription(gesture.type, slots);
  const nextGesture: ScreenGesture | null = gesture.type
    ? { ...gesture, description }
    : null;
  const trimmedBoxes = boxes.map((box) => ({
    ...box,
    annotation: box.annotation.trim(),
  }));

  const isDirty =
    canEdit &&
    (isNew
      ? !!gesture.type || boxes.length > 0
      : touched &&
        !isScreenFixUnchanged(
          { gesture: savedGesture, redactions: savedRedactions },
          { gesture: nextGesture, redactions: trimmedBoxes },
        ));

  // ---- Leaving the screen ----------------------------------------------
  const [pendingExit, setPendingExit] = useState<Exit | null>(null);
  const performExit = (exit: Exit) => {
    if (exit.kind === "close") onClose();
    else onNavigate(exit.screenId, mode);
  };
  // Read by the dialog for Esc, the X, the overlay and the arrow keys.
  useEffect(() => {
    requestExitRef.current = (exit) => {
      if (isDirty) setPendingExit(exit);
      else performExit(exit);
    };
    return () => {
      requestExitRef.current = null;
    };
  });

  // ---- Canvas ----------------------------------------------------------
  const canvasRef = useRef<HTMLDivElement>(null);
  const pointFromEvent = (event: ReactPointerEvent): Point | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    };
  };

  const handleCanvasPointerDown = (event: ReactPointerEvent) => {
    if (!isEditing) return;
    const point = pointFromEvent(event);
    if (!point) return;
    if (mode === "redaction") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDrawStart(point);
      setDrawCurrent(point);
      setSelectedBoxId(null);
      return;
    }
    if (!gesture.type) return;
    // Same rule as the edit page: for a drag, the first click is the start,
    // the second the end, and a third starts over.
    setGesture((prev) => {
      if (normalizeGestureType(prev.type) === GESTURE_TYPES.DRAG) {
        const prevHasStart = prev.x !== null && prev.y !== null;
        const prevHasEnd =
          prev.scrollDeltaX !== null && prev.scrollDeltaY !== null;
        if (!prevHasStart || prevHasEnd) {
          return {
            ...prev,
            x: point.x,
            y: point.y,
            scrollDeltaX: null,
            scrollDeltaY: null,
          };
        }
        return {
          ...prev,
          scrollDeltaX: point.x - (prev.x ?? point.x),
          scrollDeltaY: point.y - (prev.y ?? point.y),
        };
      }
      return { ...prev, x: point.x, y: point.y };
    });
  };
  const handleCanvasPointerMove = (event: ReactPointerEvent) => {
    if (!drawStart) return;
    const point = pointFromEvent(event);
    if (point) setDrawCurrent(point);
  };
  const handleCanvasPointerUp = () => {
    if (!drawStart || !drawCurrent) return;
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);
    setDrawStart(null);
    setDrawCurrent(null);
    if (width < MIN_BOX_FRACTION || height < MIN_BOX_FRACTION) return;
    const box: Redaction = {
      id: `${Date.now()}`,
      x,
      y,
      width,
      height,
      annotation: "",
    };
    setBoxes((prev) => [...prev, box]);
    setSelectedBoxId(box.id);
    setFocusBoxId(box.id);
  };
  const draftBox =
    drawStart && drawCurrent
      ? {
          x: Math.min(drawStart.x, drawCurrent.x),
          y: Math.min(drawStart.y, drawCurrent.y),
          width: Math.abs(drawCurrent.x - drawStart.x),
          height: Math.abs(drawCurrent.y - drawStart.y),
        }
      : null;
  const dragEnd: Point | null =
    isDrag && hasStart && hasEnd
      ? {
          x: gesture.x! + gesture.scrollDeltaX!,
          y: gesture.y! + gesture.scrollDeltaY!,
        }
      : null;

  // ---- Save rules ------------------------------------------------------
  const unlabelledCount = boxes.filter(
    (box) => !isRedactionLabelled(box),
  ).length;
  let blockedReason: string | null = null;
  if (unlabelledCount > 0) {
    blockedReason = `Add a note to ${
      unlabelledCount === 1 ? "the new box" : `${unlabelledCount} boxes`
    } (what it covers).`;
  } else if (nextGesture) {
    const issue = getScreenAnnotationIssue(nextGesture);
    if (issue) {
      blockedReason = `To save, ${SCREEN_ANNOTATION_ISSUE_ACTIONS[issue]}.`;
    }
  } else if (!isLastScreen) {
    blockedReason =
      "Every screen before the last needs a gesture. To drop this step, remove the screen.";
  }

  const handleSave = async () => {
    if (blockedReason || isSaving) return false;
    return onSave(nextGesture, trimmedBoxes);
  };

  const [confirmRemove, setConfirmRemove] = useState(false);
  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    await onRemove();
  };
  const removeDisabledReason =
    screenCount <= 1
      ? "A capture needs at least one screen."
      : noteCount > 0
        ? "Delete this screen's notes first."
        : null;

  const placeHint = !gesture.type
    ? null
    : isDrag
      ? !hasStart || hasEnd
        ? hasEnd
          ? "Done. Click again to start the drag over."
          : "Click where the drag started."
        : "Now click where the drag ended."
      : hasStart
        ? "Done. Click again to move it."
        : "Click the element that was touched.";
  const isPlaced = isDrag ? hasStart && hasEnd : hasStart;
  const boxFill = seeUnderBoxes ? "bg-black/25" : "bg-black/80";

  return (
    <>
      {/* Screenshot, with arrows to the screens either side */}
      <div className="relative flex min-h-0 min-w-0 items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-900">
        <div
          ref={canvasRef}
          className={cn(
            "relative touch-none select-none",
            isEditing && (mode === "redaction" || gesture.type)
              ? "cursor-crosshair"
              : "cursor-default",
          )}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={() => {
            setDrawStart(null);
            setDrawCurrent(null);
          }}
        >
          <Image
            src={screen.src}
            alt={`Screen ${screenNumber}`}
            width={0}
            height={0}
            sizes="70vw"
            draggable={false}
            className="block h-auto max-h-[calc(100vh-4rem)] w-auto max-w-[calc(100vw-4rem)] rounded-lg border border-neutral-300 md:max-w-[calc(100vw-30rem)] dark:border-neutral-700"
          />
          {boxes.map((box, index) => (
            <div
              key={box.id}
              className={cn(
                "absolute border-2",
                box.id === selectedBoxId
                  ? "border-blue-500"
                  : "border-yellow-500",
                boxFill,
                mode === "redaction" && isEditing && "cursor-pointer",
              )}
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
              }}
              title={box.annotation || undefined}
              onPointerDown={(event) => {
                if (mode !== "redaction" || !isEditing) return;
                event.stopPropagation();
                setSelectedBoxId(box.id);
                setFocusBoxId(box.id);
              }}
            >
              <span className="absolute top-0 left-0 bg-yellow-500 px-1 text-[10px] font-bold text-black">
                {index + 1}
              </span>
            </div>
          ))}
          {draftBox && (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-blue-500 bg-blue-500/20"
              style={{
                left: `${draftBox.x * 100}%`,
                top: `${draftBox.y * 100}%`,
                width: `${draftBox.width * 100}%`,
                height: `${draftBox.height * 100}%`,
              }}
            />
          )}
          {gesture.type && hasStart && (
            <GestureMarks
              type={gesture.type}
              start={{ x: gesture.x!, y: gesture.y! }}
              end={dragEnd}
            />
          )}
        </div>

        {!isNew && (
          <>
            <ScreenArrow
              side="left"
              disabled={!previousScreenId || isSaving}
              onClick={() =>
                previousScreenId &&
                requestExit({ kind: "navigate", screenId: previousScreenId })
              }
            />
            <ScreenArrow
              side="right"
              disabled={!nextScreenId || isSaving}
              onClick={() =>
                nextScreenId &&
                requestExit({ kind: "navigate", screenId: nextScreenId })
              }
            />
          </>
        )}
      </div>

      {/* Side panel */}
      <aside
        className="flex min-h-0 flex-col border-t border-neutral-200 md:border-t-0 md:border-l dark:border-neutral-800"
        style={{ width: `min(${PANEL_WIDTH_REM}rem, calc(100vw - 2rem))` }}
      >
        <header className="flex flex-col gap-3 border-b border-neutral-200 p-4 pr-12 dark:border-neutral-800">
          <DialogTitle className="text-base">
            {isNew
              ? `New screen ${screenNumber}`
              : `Screen ${screenNumber} of ${screenCount}`}
            {timeLabel && (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                {timeLabel}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            The screen at full size. Use the left and right arrows to move
            between screens.
            {canEdit &&
              " Switch to Gesture or Redaction to fix it, then save the fix as a new draft."}
          </DialogDescription>
          {canEdit && (
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as FixTab)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="view">View</TabsTrigger>
                <TabsTrigger value="gesture">Gesture</TabsTrigger>
                <TabsTrigger value="redaction">
                  Redaction{boxes.length > 0 ? ` (${boxes.length})` : ""}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          {mode === "view" && (
            <ViewPanel
              gesture={nextGesture}
              isLastScreen={isLastScreen}
              boxes={boxes}
              seeUnderBoxes={seeUnderBoxes}
              onSeeUnderBoxesChange={setSeeUnderBoxes}
              canEdit={canEdit}
            />
          )}

          {mode === "gesture" && !showPicker && (
            <section className="flex flex-col gap-2">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                This is the last screen. It shows the result, so it usually has
                no gesture.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setShowPicker(true)}
              >
                Add a gesture anyway
              </Button>
            </section>
          )}

          {mode === "gesture" && showPicker && (
            <>
              <Step number={1} title="Gesture type" done={!!gesture.type}>
                <div className="flex items-center gap-2">
                  <GestureContext.Provider value={gestureContextValue}>
                    <GestureSelection
                      focusDescriptionField={() =>
                        setTimeout(() => firstSlotRef.current?.focus(), 0)
                      }
                      openAbove={false}
                    />
                  </GestureContext.Provider>
                  {gesture.type && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      onClick={() => setGesture(EMPTY_GESTURE)}
                    >
                      <Trash2 className="size-3.5" />
                      Erase gesture
                    </Button>
                  )}
                </div>
              </Step>

              <Step
                number={2}
                title="Put it on the screen"
                done={!!gesture.type && isPlaced}
                disabled={!gesture.type}
              >
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  {placeHint ?? "Choose a gesture type first."}
                </p>
              </Step>

              <Step
                number={3}
                title="Describe it"
                done={!!nextGesture && !getScreenAnnotationIssue(nextGesture)}
                disabled={!gesture.type}
              >
                {!gesture.type ? (
                  <p className="text-sm text-neutral-500">
                    Choose a gesture type first.
                  </p>
                ) : isFreeform ? (
                  <>
                    <label
                      className="text-sm font-medium"
                      htmlFor="fix-freeform"
                    >
                      What was done, then why
                    </label>
                    <Textarea
                      id="fix-freeform"
                      value={freeform}
                      maxLength={GESTURE_DESCRIPTION_MAX_LENGTH}
                      onChange={(event) => {
                        setTouched(true);
                        setFreeform(event.target.value);
                      }}
                      placeholder="Pinch the photo with three fingers to share it"
                    />
                  </>
                ) : template ? (
                  <>
                    {template.slots.map((slot) => {
                      const value = slots[slot.key];
                      const tooShort =
                        value.trim().length > 0 &&
                        value.trim().length <= MIN_SLOT_LENGTH;
                      const setSlot = (next: string) => {
                        setTouched(true);
                        setSlots((prev) => ({ ...prev, [slot.key]: next }));
                      };
                      // The label is a tab on the input's top edge, in the
                      // input's border color, so the two read as one control.
                      const inputClass = cn(
                        "h-9 w-full max-w-none min-w-0 rounded-md rounded-tl-none border-2 bg-background px-2 text-sm",
                        SLOT_COLOR[slot.key].box,
                      );
                      return (
                        <div key={slot.key} className="flex flex-col">
                          <span
                            className={cn(
                              "self-start rounded-t-md px-2 py-0.5 text-xs font-semibold text-white",
                              SLOT_COLOR[slot.key].tab,
                            )}
                          >
                            {slot.label}
                          </span>
                          {slot.key === "target" ? (
                            <TargetSlotCombobox
                              value={value}
                              onChange={setSlot}
                              onTouched={() => {}}
                              slot={slot}
                              inputRef={firstSlotRef}
                              showError={tooShort}
                              className={inputClass}
                            />
                          ) : (
                            <Input
                              value={value}
                              aria-label={slot.label}
                              placeholder={slot.placeholder}
                              aria-invalid={tooShort}
                              onChange={(event) => setSlot(event.target.value)}
                              className={inputClass}
                            />
                          )}
                          {tooShort && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Use at least {MIN_SLOT_LENGTH + 1} letters.
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
                      <p className="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                        Reads as
                      </p>
                      <ScreenDescription
                        gesture={nextGesture}
                        isLastScreen={isLastScreen}
                        className="text-sm leading-relaxed"
                      />
                      <p className="mt-1 text-right text-[11px] text-neutral-500">
                        {description.length}/{GESTURE_DESCRIPTION_MAX_LENGTH}
                      </p>
                    </div>
                    {legacyDescription && (
                      <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        Old description, from before the template:{" "}
                        <span className="italic">“{legacyDescription}”</span>.
                        It was copied into the second box. Split it into the
                        parts above.
                      </p>
                    )}
                  </>
                ) : null}
              </Step>
            </>
          )}

          {mode === "redaction" && (
            <section className="flex flex-col gap-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Drag on the screen to cover private information. Use one box per
                item. Click a box to select it.
              </p>
              {boxes.length > 0 && (
                <SeeUnderBoxesToggle
                  checked={seeUnderBoxes}
                  onChange={setSeeUnderBoxes}
                />
              )}
              {boxes.length === 0 ? (
                <p className="text-sm text-neutral-500 italic">
                  No boxes on this screen.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {boxes.map((box, index) => {
                    const isSelected = box.id === selectedBoxId;
                    return (
                      <li
                        key={box.id}
                        className={cn(
                          "flex flex-col gap-2 rounded-md border p-2",
                          isSelected
                            ? "border-blue-500"
                            : "border-neutral-200 dark:border-neutral-800",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 shrink-0 text-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <Input
                            ref={(node) => {
                              noteInputRefs.current[box.id] = node;
                            }}
                            value={box.annotation}
                            placeholder="What it covers"
                            aria-label={`Note for box ${index + 1}`}
                            aria-invalid={!isRedactionLabelled(box)}
                            onFocus={() => setSelectedBoxId(box.id)}
                            onChange={(event) =>
                              setBoxNote(box.id, event.target.value)
                            }
                            className="h-8 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete box ${index + 1}`}
                            onClick={() => {
                              setBoxes((prev) =>
                                prev.filter((b) => b.id !== box.id),
                              );
                              if (isSelected) setSelectedBoxId(null);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        {isSelected && (
                          <div className="flex flex-wrap gap-1 pl-8">
                            {BOX_NOTE_EXAMPLES.map((example) => (
                              <button
                                key={example}
                                type="button"
                                // Keep focus in the note field.
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => setBoxNote(box.id, example)}
                                className={cn(
                                  "cursor-pointer rounded-full border px-2 py-0.5 text-xs transition-colors",
                                  box.annotation === example
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
                                )}
                              >
                                {example}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        <footer className="flex flex-col gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
          {pendingExit ? (
            <>
              <p className="text-sm font-medium">
                Save your changes to screen {screenNumber}?
              </p>
              {blockedReason && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {blockedReason}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400"
                  disabled={isSaving}
                  onClick={() => {
                    setPendingExit(null);
                    performExit(pendingExit);
                  }}
                >
                  Discard
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => setPendingExit(null)}
                >
                  Keep editing
                </Button>
                <Button
                  size="sm"
                  disabled={isSaving || !!blockedReason}
                  onClick={async () => {
                    const exit = pendingExit;
                    if (await handleSave()) performExit(exit);
                  }}
                >
                  {isSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          ) : !canEdit || (mode === "view" && !isDirty) ? (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <p
                className={cn(
                  "text-xs",
                  blockedReason
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-neutral-500",
                )}
              >
                {blockedReason ?? "Saving makes a new draft right away."}
              </p>
              <div className="flex items-center gap-2">
                {!isNew && mode !== "view" && (
                  <Button
                    variant={confirmRemove ? "destructive" : "ghost"}
                    size="sm"
                    className={cn(
                      !confirmRemove && "text-red-600 dark:text-red-400",
                    )}
                    disabled={isSaving || !!removeDisabledReason}
                    title={removeDisabledReason ?? undefined}
                    onClick={() => void handleRemove()}
                    onBlur={() => setConfirmRemove(false)}
                  >
                    {confirmRemove ? "Click again to remove" : "Remove screen"}
                  </Button>
                )}
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={onClose}
                >
                  {isDirty ? "Discard changes" : "Close"}
                </Button>
                <Button
                  size="sm"
                  disabled={isSaving || !!blockedReason}
                  onClick={() => void handleSave()}
                >
                  {isSaving ? "Saving…" : isNew ? "Add screen" : "Save fix"}
                </Button>
              </div>
            </>
          )}
        </footer>
      </aside>
    </>
  );
}

/** What the screen shows now: its description, gesture type and boxes. */
function ViewPanel({
  gesture,
  isLastScreen,
  boxes,
  seeUnderBoxes,
  onSeeUnderBoxesChange,
  canEdit,
}: {
  gesture: ScreenGesture | null;
  isLastScreen: boolean;
  boxes: Redaction[];
  seeUnderBoxes: boolean;
  onSeeUnderBoxesChange: (checked: boolean) => void;
  canEdit: boolean;
}) {
  return (
    <>
      <section className="flex flex-col gap-1">
        <h3 className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Description
        </h3>
        <ScreenDescription
          gesture={gesture}
          isLastScreen={isLastScreen}
          className="text-sm leading-relaxed"
        />
        {gesture?.type && (
          <p className="text-xs text-neutral-500">
            Gesture: {findGestureOption(gesture.type)?.label ?? gesture.type}
          </p>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Redaction boxes ({boxes.length})
        </h3>
        {boxes.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">None</p>
        ) : (
          <>
            <ol className="flex flex-col gap-0.5 text-sm">
              {boxes.map((box, index) => (
                <li key={box.id}>
                  <span className="mr-1.5 font-bold">{index + 1}.</span>
                  {box.annotation.trim() || (
                    <span className="text-red-600 italic">No note</span>
                  )}
                </li>
              ))}
            </ol>
            <SeeUnderBoxesToggle
              checked={seeUnderBoxes}
              onChange={onSeeUnderBoxesChange}
            />
          </>
        )}
      </section>
      {canEdit && (
        <p className="text-xs text-neutral-500">
          To fix this screen, open the Gesture or Redaction tab.
        </p>
      )}
    </>
  );
}

function SeeUnderBoxesToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-neutral-600 select-none dark:text-neutral-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      See under boxes
    </label>
  );
}

function ScreenArrow({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={side === "left" ? "Previous screen" : "Next screen"}
      title={side === "left" ? "Previous screen (←)" : "Next screen (→)"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full shadow-md",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" />
    </Button>
  );
}

/** A numbered step in the Gesture panel, ticked when done. */
function Step({
  number,
  title,
  done,
  disabled = false,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-2", disabled && "opacity-60")}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[11px]",
            done
              ? "bg-green-600 text-white"
              : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
          )}
        >
          {done ? <Check className="size-3" strokeWidth={3} /> : number}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** The gesture marker (and drag arrow) on the canvas. */
function GestureMarks({
  type,
  start,
  end,
}: {
  type: string;
  start: Point;
  end: Point | null;
}) {
  return (
    <>
      {end && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1={start.x * 100}
            y1={start.y * 100}
            x2={end.x * 100}
            y2={end.y * 100}
            stroke="rgba(37,99,235,0.9)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {end && (
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
          style={{ left: `${end.x * 100}%`, top: `${end.y * 100}%` }}
        />
      )}
      <span
        className="pointer-events-none absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-300 opacity-90 ring-2 ring-yellow-600/70"
        style={{ left: `${start.x * 100}%`, top: `${start.y * 100}%` }}
      >
        {findGestureOption(type)?.icon}
      </span>
    </>
  );
}
