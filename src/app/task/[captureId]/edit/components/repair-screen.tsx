"use client";
import React, {
  useCallback,
  useState,
} from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, CircleAlert, Film } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { TraceWithAppsScreens as Trace } from "@/lib/actions";
import { Screen } from "@prisma/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function RepairScreen({
  data
}: {
  data: Trace
}) {
  const [focusViewValue, setFocusViewValue] = useState<{
    current: Screen | null;
    next: Screen | null;
  }>({
    current: null,
    next: null,
  });

  const handleFocusView = useCallback((index: number) => {
    setFocusViewValue({
      current: data.screens[index],
      next: data.screens[index + 1] ?? null,
    });
  }, [data.screens]);

  return (
    <div className="w-full h-[calc(100dvh-var(--nav-height))]">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75}>
          {focusViewValue.current ? (
            <FocusView
              screen={focusViewValue.current}
              nextScreen={focusViewValue.next}
            />
          ) : (
            <div className="flex justify-center items-center w-full h-full">
              <span className="text-3xl lg:text-4xl text-neutral-500 dark:text-neutral-400 font-semibold">Select a screen from the filmstrip.</span>
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={25} maxSize={50}>
          <Filmstrip
            data={data}
            handleFocusView={handleFocusView}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function Filmstrip({ data, handleFocusView }: { data: Trace, handleFocusView: (index: number) => void }) {
  return (
    <ul className="flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
      {data.screens?.map((screen, index) => (
        <FilmstripItem
          key={screen.id}
          index={index}
          isBroken={screen.gesture === null}
          onClick={() => handleFocusView(index)}
        >
          <Image
            key={screen.id}
            src={screen.src}
            alt="gallery"
            draggable={false}
            className="h-full w-auto object-contain"
            width={0}
            height={0}
            sizes="100vw"
            onClick={() => handleFocusView(index)}
          />
        </FilmstripItem>
      ))}
    </ul>
  )
}

function FilmstripItem({
  index = 0,
  children,
  isBroken = false,
  ...props
}: {
  index?: number;
  children?: React.ReactNode;
  isBroken?: boolean;
} & React.HTMLAttributes<HTMLLIElement>) {
  return (
    <>
      <li
        className="cursor-pointer min-w-fit h-full"
        data-index={index}
        {...props}
      >
        <div className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain">
          {(isBroken) && (
            <div className="absolute z-10 flex w-full h-full justify-center items-center rounded-sm ring-2 ring-inset ring-red-400">
              <CircleAlert className="size-6 text-red-400" />
            </div>
          )}
          <div className={cn("relative min-w-fit h-full transition-all duration-200 ease-in-out select-none", isBroken ? "grayscale brightness-50" : "grayscale-0 brightness-100")}>
            {children}
          </div>
        </div>
      </li>
    </>
  );
}

function FocusView({ screen, nextScreen }: {
  screen: Screen;
  nextScreen: Screen | null;
}) {
  return (
    <>
      <div className="flex justify-center w-full h-full p-8 overflow-hidden">
        <div className="flex justify-center w-full h-full gap-8">
          <Image
            src={screen.src}
            alt="gallery"
            draggable={false}
            className="w-auto h-full rounded-lg"
            width={0}
            height={0}
            sizes="100vw"
          />
        </div>
      </div>
    </>
  )
}

const gestureOptions = [
  {
    value: "Press",
    label: "Press",
  },
  {
    value: "Long press",
    label: "Long press",
  },
  {
    value: "Scroll",
    label: "Scroll"
  },
  {
    value: "Swipe",
    label: "Swipe",
  },
  {
    value: "Pinch",
    label: "Pinch",
  }
]

function GestureSelection() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-50 justify-between"
        >
          {value
            ? gestureOptions.find((gesture) => gesture.value === value)?.label
            : "Select gesture..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0">
        <Command>
          <CommandInput placeholder="Search gesture..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {gestureOptions.map((gesture) => (
                <CommandItem
                  key={gesture.value}
                  value={gesture.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === gesture.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {gesture.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}