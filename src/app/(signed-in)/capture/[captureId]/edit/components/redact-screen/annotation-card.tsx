"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  TabSelect,
  TabSelectList,
  TabSelectTrigger,
} from "@/components/ui/tab-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Command, CommandInput, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import Kbd from "@/components/ui/kbd";

interface AnnotationCardProps {
  annotation: string;
  onChange: (value: string) => void;
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({
  annotation,
  onChange,
}) => {
  const annotateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(annotation);

  useEffect(() => {
    annotateTextareaRef.current?.focus();
  }, []);

  return (
    <div className="absolute">
      <Card className="flex flex-col items-start p-4 shadow-lg">
        {/* <div className="flex flex-col gap-2">
          <Label htmlFor="redact-method" className="text-sm font-semibold">
            Redact Method
          </Label>
          <TabSelect id="redact-method" defaultValue="black">
            <TabSelectList>
              <TabSelectTrigger value="black">Black</TabSelectTrigger>
            </TabSelectList>
          </TabSelect>
        </div> */}
        <p className="text-sm font-semibold flex flex-col gap-1">
            <div className="flex w-full justify-start items-center gap-2 text-sm">
              <span>Copy:</span>
              <Kbd className="text-muted-foreground rounded-sm">Ctrl+C</Kbd>/<Kbd className="text-muted-foreground rounded-sm">Cmd+C</Kbd>
            </div>
            <div className="flex w-full justify-start items-center gap-2 text-sm">
              <span>Paste:</span>
              <Kbd className="text-muted-foreground rounded-sm">Ctrl+V</Kbd>/<Kbd className="text-muted-foreground rounded-sm">Cmd+V</Kbd>
            </div>
        </p>
        <div className="flex flex-row items-center justify-stretch gap-2">
          <Label className="text-sm font-semibold">Label</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-40 justify-between">
                {value === "" ? "Empty label..." : value}
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-50 p-0"
              align="start"
              side="bottom"
            >
              <Command>
                {/* <CommandInput placeholder="Search labels..." /> */}
                <CommandList>
                  <CommandItem
                    value="Profile Picture"
                    onSelect={() => {
                      onChange("Profile Picture");
                      setValue("Profile Picture");
                      setOpen(false);
                    }}
                  >
                    Profile Picture
                  </CommandItem>
                  <CommandItem
                    value="Name"
                    onSelect={() => {
                      onChange("Name");
                      setValue("Name");
                      setOpen(false);
                    }}
                  >
                    Name
                  </CommandItem>
                  <CommandItem
                    value="Email"
                    onSelect={() => {
                      onChange("Email");
                      setValue("Email");
                      setOpen(false);
                    }}
                  >
                    Email
                  </CommandItem>
                  <CommandItem
                    value="Location"
                    onSelect={() => {
                      onChange("Location");
                      setValue("Location");
                      setOpen(false);
                    }}
                  >
                    Location
                  </CommandItem>
                  <CommandItem
                    value="Phone"
                    onSelect={() => {
                      onChange("Phone");
                      setValue("Phone");
                      setOpen(false);
                    }}
                  >
                    Phone
                  </CommandItem>
                  <CommandItem
                    value="Other"
                    onSelect={() => {
                      onChange("");
                      setValue("Other");
                      setOpen(false);
                    }}
                  >
                    Other
                  </CommandItem>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {value === "Other" && <Textarea
          placeholder="Give 1-2 word label for redaction..."
          maxLength={30}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          className="w-45"
        />}
      </Card>
    </div>
  );
};

export default AnnotationCard;
