"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext, useWatch } from "react-hook-form";
import { TraceFormData } from "../../types";
import { Progress } from "@/components/ui/progress";
import mergeRefs from "@/lib/utils/merge-refs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { iosOptions, iphoneOptions } from "@/lib/utils/ios-options";

export function SaveTracePanel({
  os,
  taskDescription,
}: {
  os: string;
  taskDescription: string;
}) {
  return (
    <div className="flex flex-col w-full grow justify-start">
      {os === "ios" && (
        <div className="flex flex-row gap-2 mb-5">
          <VersionSelect
            label="iPhone Version"
            formKey="iPhoneVersion"
            options={iphoneOptions}
            placeholder="Select iPhone version"
          />
          <VersionSelect
            label="iOS Version"
            formKey="iOSVersion"
            options={iosOptions}
            placeholder="Select iOS version"
          />
        </div>
      )}

      <DescriptionField taskDescription={taskDescription} />
    </div>
  );
}

function VersionSelect({
  label,
  formKey,
  options,
  placeholder,
}: {
  label: string;
  formKey: "iOSVersion" | "iPhoneVersion";
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const value = useWatch({
    name: formKey,
  });

  return (
    <div className="flex flex-col">
      <Label htmlFor={formKey} className="mb-2">
        {label}
      </Label>
      <Select
        onValueChange={(value) => {
          setValue(formKey, value);
        }}
        value={value || ""}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DescriptionField({ taskDescription }: { taskDescription: string }) {
  const { register, setValue, getValues } = useFormContext<TraceFormData>();
  const { onChange, ref, onBlur, name } = register("description");
  const descriptionValue = useWatch({
    name: "description",
  });
  const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [descriptionLen, setDescriptionLen] = useState(0);
  const [hasInitializedPrefill, setHasInitializedPrefill] = useState(false);

  useEffect(() => {
    const value = descriptionValue ?? "";
    setDescriptionLen(value.length);
  }, [descriptionValue, taskDescription]);

  useEffect(() => {
    if (hasInitializedPrefill) {
      return;
    }
    const existing = (getValues("description") ?? "").trim();
    if (existing.length > 0) {
      setHasInitializedPrefill(true);
      return;
    }
    if (!taskDescription) {
      setHasInitializedPrefill(true);
      return;
    }
    setValue("description", taskDescription);
    setDescriptionLen(taskDescription.length);
    setHasInitializedPrefill(true);
  }, [getValues, hasInitializedPrefill, setValue, taskDescription]);

  return (
    <>
      <Label htmlFor="description" className="mb-2">
        Interaction Summary
      </Label>
      <Textarea
        id="description"
        onBlur={onBlur}
        name={name}
        maxLength={75}
        onChange={(e) => {
          onChange(e);
          setDescriptionLen(e.target.value.length);
        }}
        ref={
          mergeRefs(
            ref,
            descriptionTextAreaRef,
          ) as React.MutableRefObject<HTMLTextAreaElement | null>
        }
        placeholder="Briefly summarize the interaction flow in these screens, do not include private information."
      />
      {taskDescription ? (
        <div className="mt-2 mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Prefilled from your task - edit freely.
          </p>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-neutral-300 bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-200 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            onClick={() => {
              setValue("description", taskDescription);
              setDescriptionLen(taskDescription.length);
            }}
          >
            Reuse task description
          </button>
        </div>
      ) : null}
      {descriptionTextAreaRef.current && (
        <div className="w-full flex flex-col">
          <Progress
            className="w-full"
            value={
              (descriptionLen / descriptionTextAreaRef.current.maxLength) * 100
            }
          />
          <div className="text-sm flex justify-end text-muted-foreground z-10">
            {`${descriptionLen}/${descriptionTextAreaRef.current.maxLength}`}
          </div>
        </div>
      )}
    </>
  );
}
