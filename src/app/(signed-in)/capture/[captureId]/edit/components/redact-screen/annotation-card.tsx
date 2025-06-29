"use client";

import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  TabSelect,
  TabSelectList,
  TabSelectTrigger,
} from "@/components/ui/tab-select";

interface AnnotationCardProps {
  annotation: string;
  onChange: (value: string) => void;
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({
  annotation,
  onChange,
}) => {
  const annotateTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    annotateTextareaRef.current?.focus();
  }, []);

  return (
    <div className="absolute">
      <Card className="flex flex-col items-start p-4 shadow-lg">
        <Label className="text-sm font-semibold mb-2">Redact type</Label>
        <TabSelect className="mb-4" defaultValue="black">
          <TabSelectList>
            <TabSelectTrigger value="black">Black</TabSelectTrigger>
            <TabSelectTrigger value="blur">Blur</TabSelectTrigger>
          </TabSelectList>
        </TabSelect>
        <Label className="text-sm font-semibold mb-2">Note</Label>
        <Textarea
          placeholder="Describe what you redacted in one to two words..."
          defaultValue={annotation}
          ref={annotateTextareaRef}
          onChange={(e) => onChange(e.target.value)}
          className="w-64"
        />
      </Card>
    </div>
  );
};

export default AnnotationCard;
