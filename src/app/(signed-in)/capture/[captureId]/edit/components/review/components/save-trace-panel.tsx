"use client";

import { useRef, useState } from "react";
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

export function SaveTracePanel({ os }: { os: string }) {
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

      <DescriptionField />
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

function DescriptionField() {
  const { register } = useFormContext<TraceFormData>();
  const { onChange, ref, onBlur, name } = register("description");
  const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [descriptionLen, setDescriptionLen] = useState(0);

  return (
    <>
      <Label htmlFor="description" className="mb-2">
        Trace Description
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
            descriptionTextAreaRef
          ) as React.MutableRefObject<HTMLTextAreaElement | null>
        }
        placeholder="In your own words, describe in one sentence the OVERALL task shown in these screens."
      />
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
