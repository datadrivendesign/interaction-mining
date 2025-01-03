import React, { useState, useEffect, useCallback } from "react";
import * as Sheet from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Search, Eraser, X, TextCursorInput, Grid2x2X } from "lucide-react";
import clsx from "clsx";

import { Screen } from "@prisma/client";

import {
  extractSensitiveFields,
  redactByKeyword,
  redactByPath,
} from "../util/view-hierarchy";
import { RenderedScreen } from "../page";
import { Button } from "@/components/ui/button";
import { uploadViewHierarchy } from "@/lib/aws";

export default function ScreenEditor({
  screen,
  data,
  fetchData,
  defaultView = "keyword",
}: {
  screen: Screen;
  data: any;
  fetchData: () => void;
  defaultView?: "none" | "keyword" | "box";
}) {
  const [view, setView] = useState<any>(defaultView);

  return (
    <>
      <Sheet.Root key={data}>
        <Sheet.Trigger asChild>
          <button className="flex justify-center items-center p-1.5 aspect-square text-neutral-500 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors duration-300">
            <Eraser className="size-5" />
          </button>
        </Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Overlay className="data-[state=open]:backdrop-blur-sm" />
          <Sheet.Content
            className={clsx(
              "fixed z-50 flex justify-center w-full max-w-screen h-full max-h-screen bg-background shadow-lg overflow-hidden transition ease-in-out",
              "data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            )}
          >
            {/* <Sheet.Title asChild>
              <div className="sticky top-0 flex w-full max-w-(--breakpoint-xl) justify-between px-6 pt-6 pb-2 md:px-8 md:pt-8 md:pb-2 bg-white">
                <h1 className="text-2xl text-black font-extrabold tracking-tight">
                  Redact Screen
                </h1>

              </div>
            </Sheet.Title> */}

            <aside className="sticky top-0 hidden md:flex grow-0 xl:grow shrink-0 basis-64 h-full justify-end items-start bg-neutral-100 dark:bg-neutral-900 overflow-y-auto">
              <div className="flex flex-col w-64 px-2 py-6 md:py-8 gap-4 justify-start items-start">
                <Sheet.Close className="inline-flex justify-center items-center ml-2 aspect-square rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </Sheet.Close>
                <VisuallyHidden.Root>
                  <Sheet.Title>Screen Editor</Sheet.Title>
                </VisuallyHidden.Root>
                <div className="flex flex-col w-full">
                  <h1 className="text-sm text-black dark:text-white font-medium ml-2 mb-2">
                    Redaction
                  </h1>
                  <button
                    className={`flex w-full justify-start p-2 ${
                      view === "keyword"
                        ? "bg-neutral-200 dark:bg-neutral-800"
                        : "bg-transparent"
                    } hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 rounded-lg outline-hidden focus:outline-hidden`}
                    onClick={() => setView("keyword")}
                  >
                    <span className="inline-flex items-center text-sm text-black dark:text-white">
                      <TextCursorInput size={16} className="mr-2" />
                      Keyword
                    </span>
                  </button>
                  <button
                    className={`flex w-full justify-start p-2 ${
                      view === "box"
                        ? "bg-neutral-200 dark:bg-neutral-800"
                        : "bg-transparent"
                    } hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 rounded-lg outline-hidden focus:outline-hidden`}
                    onClick={() => setView("box")}
                  >
                    <span className="inline-flex items-center text-sm text-black dark:text-white">
                      <Grid2x2X size={16} className="mr-2" />
                      Bounding Box
                    </span>
                  </button>
                </div>
              </div>
            </aside>
            <div className="flex flex-col grow shrink md:shrink-0 basis-auto md:basis-[32rem] lg:basis-[48rem] xl:basis-[64rem] h-full pb-6 md:pb-8 overflow-y-auto">
              {view === "keyword" && (
                <KeywordRedactionView data={data} fetchData={fetchData} />
              )}
              {view === "box" && (
                <BoxRedactionView
                  data={data}
                  fetchData={fetchData}
                  screen={screen}
                />
              )}
            </div>
          </Sheet.Content>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  );
}

function KeywordRedactionView({
  data,
  fetchData,
}: {
  data: any;
  fetchData: () => void;
}) {
  const [sensitiveFields, setSensitiveFields] = useState<any>([]);
  // const sensitiveFields = useMemo(() => {
  //   if (data) {
  //     return extractSensitiveFields(data);
  //   }
  //   return [];
  // }, [data]);
  const [search, setSearch] = useState("");
  const [filteredFieldList, setFilteredFieldList] = useState(sensitiveFields);

  useEffect(() => {
    if (data) {
      setSensitiveFields(extractSensitiveFields(data));
    }
  }, [data]);

  useEffect(() => {
    setFilteredFieldList(sensitiveFields);
  }, [sensitiveFields]);

  useEffect(() => {
    if (search === "") {
      setFilteredFieldList(sensitiveFields);
    } else {
      const filtered = sensitiveFields.filter((field: any) =>
        field.value.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredFieldList(filtered);
    }
  }, [search, sensitiveFields]);

  const handleSave = useCallback((id: string, data: any) => {
    uploadViewHierarchy(id, data);
  }, []);

  const handleRedact = useCallback(
    (poth: string) => {
      try {
        const result = redactByPath(data, poth);
        // const result = redactByKeyword(data, poth);

        // Update the data with the redacted fields
        console.log(result);
        const newSensitiveFields = extractSensitiveFields(result);
        setSensitiveFields(newSensitiveFields);

        // Save the redacted data
        handleSave(data.id, result);

        // Update the view with the redacted fields
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [data]
  );

  return (
    <>
      <div className="sticky top-0 flex flex-col w-full md:max-w-[32rem] lg:max-w-[48rem] xl:max-w-[64rem] px-6 pt-6 md:px-8 md:pt-8 pb-4 gap-2 bg-white">
        <h2 className="text-2xl text-black font-extrabold tracking-tight">
          Redact Metadata by Keyword
        </h2>
        <div className="flex justify-between">
          <span className="inline-flex w-full max-w-xs items-center px-2 py-1 ring-1 ring-inset ring-neutral-200 has-focus:ring-2 has-focus:ring-blue-500 rounded-lg transition-all duration-75">
            <Search size={16} className="text-neutral-400 mr-2" />
            <input
              className="text-base text-neutral-700 placeholder:text-neutral-400 placeholder:tracking-tight focus:outline-hidden"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </span>
          {/* <Button onClick={handleSave}>Save</Button> */}
        </div>
      </div>
      <ul className="flex flex-col w-full md:max-w-[32rem] lg:max-w-[48rem] xl:max-w-[64rem] h-full px-2 pb-6 md:px-4 md:pb-8">
        {filteredFieldList.map((view: any, index: number) => {
          return (
            <KeywordItem
              key={index}
              view={view}
              searchTerm={search}
              handleRedact={() => handleRedact(view.path)}
            />
          );
        })}
      </ul>
    </>
  );
}

const KeywordItem = ({
  view,
  searchTerm,
  handleRedact,
  ...props
}: {
  view: any;
  searchTerm: string;
  handleRedact?: () => void;
} & React.HTMLAttributes<HTMLSpanElement>) => {
  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight) return text;

    // Escape special characters in the search term for regex
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="underline text-black">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <li
      className="group flex w-full justify-between p-4 bg-white hover:bg-neutral-100 rounded-lg cursor-pointer"
      {...props}
    >
      <div className="flex flex-col w-full">
        <span className="text-base font-medium text-black truncate break-all">
          {getHighlightedText(view.value, searchTerm)}
        </span>
        <span
          title={view.path}
          className="text-sm font-medium text-neutral-500 truncate break-all"
        >
          {view.path}
        </span>
      </div>
      <div className="flex gap-4">
        <button className="hidden group-hover:block" onClick={handleRedact}>
          <X size={24} className="text-neutral-400 hover:text-red-500" />
        </button>
      </div>
    </li>
  );
};

function BoxRedactionView({
  data,
  screen,
  fetchData,
}: {
  data: any;
  screen: Screen;
  fetchData: () => void;
}) {
  return (
    <>
      <div className="sticky top-0 flex flex-col w-full md:max-w-[32rem] lg:max-w-[48rem] xl:max-w-[64rem] h-full max-h-screen px-6 pt-6 md:px-8 md:pt-8 pb-4 gap-2 bg-white">
        <h2 className="text-2xl text-black font-extrabold tracking-tight">
          Redact by Bounding Box
        </h2>
        <div className="flex flex-col w-64">
          <RenderedScreen screen={screen} hierarchyData={data} showRedaction />
        </div>
      </div>
    </>
  );
}
