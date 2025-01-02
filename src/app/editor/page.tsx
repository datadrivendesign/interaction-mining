"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import classNames from "classnames";
import { Pencil, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import EditorDialog, { EditorDialogButton } from "./component/editor-dialog";
import ScreenEditor from "./component/screen-editor";

import { Screen } from "@prisma/client";
import { TraceWithAppsScreens as Trace } from "@/lib/actions/trace";
import { getTrace, updateTrace } from "@/lib/actions";
import { deleteScreens, splitTrace } from "./actions";
import { prettyTime } from "@/lib/utils/date";
import { fetchImageAsBase64 } from "./util/image";

const EditorContext = createContext<{
  selected: Screen[];
  setSelected: (value: Screen[]) => void;
  fetchTrace: () => Promise<Trace>;
}>({
  selected: [],
  setSelected: () => {},
  fetchTrace: async () => ({}) as Trace,
});

export default function Page() {
  const searchParams = useSearchParams();
  const traceId = searchParams.get("trace");

  const [traceData, setTraceData] = useState<Trace>({} as Trace);
  const [selected, setSelected] = useState<Screen[]>([]);

  const [titleState, setTitleState] = useState<{
    mode: "display" | "edit";
    value: string;
  }>({
    mode: "display",
    value: traceData.name || "",
  });

  const [descriptionState, setDescriptionState] = useState<{
    mode: "display" | "edit";
    value: string;
  }>({
    mode: "display",
    value: traceData.description || "",
  });

  const fetchTrace = useCallback(async () => {
    if (traceId) {
      const trace = await getTrace(traceId);
      if (trace) {
        setTraceData(trace);
        return trace;
      }
    }
    // If no trace is found, throw an error or return a default Trace object
    throw new Error("Trace not found");
  }, [traceId]);

  const handleSave = useCallback(
    async ({
      name,
      description,
    }: {
      name?: string;
      description?: string;
    } = {}) => {
      // Provide a default empty object
      // Filter out undefined values from the updates
      const updatedTrace = {
        ...(name && { name }),
        ...(description && { description }),
      };

      // If there are no updates to apply, exit early
      if (!Object.keys(updatedTrace).length) {
        alert("No changes to save.");
        return;
      }

      try {
        // Update the trace with the provided changes
        await updateTrace(traceData.id, updatedTrace);

        // Fetch the latest trace data and update state
        const res = await fetchTrace();
        setTitleState((prev) => ({ ...prev, value: res?.name || "" }));
        setDescriptionState((prev) => ({
          ...prev,
          value: res?.description || "",
        }));
      } catch (error) {
        console.error("Failed to update trace:", error);
        alert("An error occurred while saving the trace. Please try again.");
      }
    },
    [traceData.id, fetchTrace]
  );

  useEffect(() => {
    if (traceId) {
      fetchTrace().then((res) => {
        // setTitleState({ ...titleState, value: res?.name || "" });
        setTitleState((value) => ({ ...value, value: res?.name || "" }));
        // setDescriptionState({
        //   ...descriptionState,
        //   value: res?.description || "",
        // });
        setDescriptionState((value) => ({
          ...value,
          value: res?.description || "",
        }));
      });
    }
  }, [traceId, fetchTrace]);

  const handleSplit = useCallback(async () => {
    if (!selected.length) {
      alert("No screens selected to split.");
      return;
    }

    try {
      // Sort the selected screens by the `created` field
      const sortedScreens = [...selected].sort(
        (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
      );

      // Call the `splitTrace` function to create a new trace and update screens
      const newTrace = await splitTrace(
        sortedScreens,
        traceData.appId,
        traceData.worker
      );

      if (traceId) {
        fetchTrace();
      }

      // Open the newly created trace in a new tab
      window.open(`/app/${traceData.appId}?trace=${newTrace.id}`, "_blank");
    } catch (error) {
      console.error("Failed to split trace:", error);
      alert("An error occurred while splitting the trace. Please try again.");
    }
  }, [traceData, traceId, selected, fetchTrace]);

  const handleDelete = useCallback(async () => {
    if (!selected.length) {
      alert("No screens selected to delete.");
      return;
    }

    try {
      await deleteScreens(selected);
      fetchTrace();
      // Clear the selected screens after deletion
      setSelected([]);
    } catch (error) {
      console.error("Failed to delete screens:", error);
      alert("An error occurred while deleting the screens. Please try again.");
    }
  }, [selected, fetchTrace]);

  return (
    <>
      <EditorContext.Provider
        value={{
          selected,
          setSelected,
          fetchTrace,
        }}
      >
        <main className="relative flex flex-col grow items-center justify-between">
          <section className="relative flex flex-col grow w-full">
            <div className="flex w-full max-w-screen-2xl self-center items-center mb-4 px-4 md:px-16">
              <div className="flex flex-col grow w-full h-full">
                <span className="inline-flex items-center gap-2">
                  {titleState.mode === "display" && (
                    <>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {traceData?.name || "Untitled Trace"}
                      </h1>
                      <button
                        onClick={() =>
                          setTitleState({ ...titleState, mode: "edit" })
                        }
                      >
                        <Pencil className="size-4 text-neutral-500" />
                      </button>
                    </>
                  )}
                  {titleState.mode === "edit" && (
                    <>
                      <span className="inline-flex w-full md:w-auto items-center px-2 py-1 ring-1 ring-inset ring-neutral-200 has-[:focus]:ring-2 has-[:focus]:ring-blue-500 rounded-lg transition-all duration-75 ">
                        <input
                          className="text-base text-neutral-700 placeholder:text-neutral-400 placeholder:tracking-tight focus:outline-none"
                          placeholder="Trace title"
                          value={titleState.value}
                          onChange={(e) =>
                            setTitleState({
                              ...titleState,
                              value: e.target.value,
                            })
                          }
                        />
                      </span>
                      <button
                        onClick={() => {
                          setTitleState({ ...titleState, mode: "display" });
                          handleSave({ name: titleState.value });
                        }}
                      >
                        <Save className="size-4 text-neutral-500" />
                      </button>
                    </>
                  )}
                </span>

                <span className="text-sm text-neutral-500 mb-2">
                  Created on{" "}
                  {prettyTime(traceData?.created, {
                    format: "LLLL dd, yyyy",
                  })}
                  {" at "}
                  {prettyTime(traceData?.created, {
                    format: "hh:mm a",
                  })}
                </span>
                <section className="block w-full mb-4">
                  <span className="inline-flex items-center gap-2">
                    <h2 className="text-xl text-black font-bold tracking-tight">
                      Description
                    </h2>
                    {descriptionState.mode === "display" && (
                      <button
                        onClick={() =>
                          setDescriptionState({
                            ...descriptionState,
                            mode: "edit",
                          })
                        }
                      >
                        <Pencil className="size-4 text-neutral-500" />
                      </button>
                    )}

                    {descriptionState.mode === "edit" && (
                      <button
                        onClick={() => {
                          setDescriptionState({
                            ...descriptionState,
                            mode: "display",
                          });
                          handleSave({ description: descriptionState.value });
                        }}
                      >
                        <Save className="size-4 text-neutral-500" />
                      </button>
                    )}
                  </span>
                  {descriptionState.mode === "display" && (
                    <p className="text-sm text-neutral-500">
                      {traceData?.description}
                    </p>
                  )}
                  {descriptionState.mode === "edit" && (
                    <span className="inline-flex w-full items-center px-2 py-1 ring-1 ring-inset ring-neutral-200 has-[:focus]:ring-2 has-[:focus]:ring-blue-500 rounded-lg transition-all duration-75 ">
                      <textarea
                        className="w-full text-base text-neutral-700 placeholder:text-neutral-400 placeholder:tracking-tight focus:outline-none"
                        placeholder="Trace description"
                        value={descriptionState.value || ""}
                        onChange={(e) =>
                          setDescriptionState({
                            ...descriptionState,
                            value: e.target.value,
                          })
                        }
                      />
                    </span>
                  )}
                </section>
                <section className="block w-full mb-4">
                  <div className="flex w-full justify-between mb-2">
                    <h2 className="text-xl text-black font-bold tracking-tight mb-2">
                      Screens
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={selected.length > 0 ? false : true}
                        onClick={handleSplit}
                      >
                        Split trace with selected...
                      </Button>
                      <EditorDialog
                        title="Are you sure?"
                        description="Do you really want to delete these screens? This cannot be undone."
                        label={
                          <Button
                            variant="destructive"
                            disabled={selected.length > 0 ? false : true}
                          >
                            Delete screens
                          </Button>
                        }
                      >
                        <div className="flex justify-end w-full gap-2 pt-2">
                          <EditorDialogButton>
                            <Button variant="secondary">Cancel</Button>
                          </EditorDialogButton>
                          <EditorDialogButton>
                            <Button
                              variant="destructive"
                              onClick={handleDelete}
                            >
                              Delete
                            </Button>
                          </EditorDialogButton>
                        </div>
                      </EditorDialog>
                    </div>
                  </div>
                  <div className="flex w-full overflow-x-scroll touch-pan-x pb-3">
                    <div className="flex min-w-full gap-2">
                      {traceData?.screens?.map(
                        (screen: Screen, index: number) => (
                          <ScreenItem
                            key={screen.id}
                            screen={screen}
                          ></ScreenItem>
                        )
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </main>
      </EditorContext.Provider>
    </>
  );
}

function ScreenItem({ screen }: { screen: Screen }) {
  const { selected, setSelected, fetchTrace } = useContext(EditorContext);
  const [hierarchyData, setHierarchyData] = useState<any>(null);

  // Fetch the hierarchy data from screen.vh
  useEffect(() => {
    if (screen.vh) {
      // Fetch the JSON data from the URL
      fetch(screen.vh)
        .then((response) => response.json())
        .then((data) => {
          // If the data is a stringified JSON, parse it
          if (typeof data === "string") {
            setHierarchyData(JSON.parse(data));
          } else {
            setHierarchyData(data);
          }
        })
        .catch((error) => {
          console.error("Error fetching hierarchy data:", error);
        });
    }
  }, [screen.vh]);

  // Check if the current screen is selected
  const isSelected = useCallback(() => {
    return selected.some((s) => s.id === screen.id);
  }, [selected, screen.id]);
  // Toggle the selection state of the current screen
  const toggleSelected = () => {
    if (isSelected()) {
      setSelected(selected.filter((s) => s.id !== screen.id));
    } else {
      setSelected([...selected, screen]);
    }
  };

  const handleDeleteOne = useCallback(async () => {
    deleteScreens([screen]);

    // Fetch the latest trace data after
    fetchTrace();
  }, [fetchTrace, screen]);

  return (
    <>
      <figure className="group relative flex flex-col shrink-0 w-64 border border-neutral-500/10 rounded-lg shadow-sm overflow-clip">
        <div
          className={classNames(
            "absolute z-10 top-2 left-2 flex gap-2 transition-opacity duration-100",
            isSelected() ? "opacity-100" : "group-hover:opacity-100 opacity-0"
          )}
        >
          <button className="flex size-8 justify-center items-center aspect-square text-red-500 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors duration-300">
            <input
              type="checkbox"
              checked={isSelected()}
              onChange={toggleSelected}
            />
          </button>
          <ScreenEditor
            screen={screen}
            data={hierarchyData}
            fetchData={fetchTrace}
          />
          <EditorDialog
            title="Are you sure?"
            description="Do you really want to delete this screen? This cannot be undone."
            label={
              <button className="flex justify-center items-center p-1.5 aspect-square text-red-500 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors duration-300">
                <Trash2 className="size-5" />
              </button>
            }
          >
            <div className="flex justify-end w-full gap-2 pt-2">
              <EditorDialogButton>
                <Button variant="secondary">Cancel</Button>
              </EditorDialogButton>
              <EditorDialogButton>
                <Button variant="destructive" onClick={handleDeleteOne}>
                  Delete
                </Button>
              </EditorDialogButton>
            </div>
          </EditorDialog>
        </div>
        <RenderedScreen
          screen={screen}
          hierarchyData={hierarchyData}
        />
      </figure>
    </>
  );
}

function BoundingBox({
  x,
  y,
  width,
  height,
  id,
  onClick,
  onHover,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  onClick: () => void;
  onHover: () => void;
}) {
  const [redacted, setRedacted] = useState(false);
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={redacted ? "black" : "transparent"}
      stroke="red"
      strokeWidth="1"
      onClick={()=> setRedacted(!redacted)}
      onMouseOver={onHover}
      style={{ pointerEvents: "auto" }}
    />
  );
}

// Main RenderedScreen component
export function RenderedScreen({
  screen,
  hierarchyData,
  showRedaction = false,
}: {
  screen: Screen;
  hierarchyData?: any;
  showRedaction?: boolean;
}) {
  const [image, setImage] = useState<string>("");
  // Refs for the image and SVG elements
  const imgContainerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Extract bounding boxes from hierarchy data
  const { boxes, rootBounds } = useMemo(() => {
    if (!hierarchyData) return { boxes: [], rootBounds: null };

    const boxes: any = [];
    let rootBounds: any = null;

    function traverse(node: any) {
      if (node.bounds_in_screen) {
        const [left, top, right, bottom] = node.bounds_in_screen
          .split(" ")
          .map(Number);
        const width = right - left;
        const height = bottom - top;
        const x = left;
        const y = top;

        // If rootBounds is not set, this is the root node
        if (!rootBounds) {
          rootBounds = { x, y, width, height };
        }

        boxes.push({
          x,
          y,
          width,
          height,
          id: node.id || Math.random().toString(),
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => traverse(child));
      }
    }
    traverse(hierarchyData);
    return { boxes, rootBounds };
  }, [hierarchyData]);

  useEffect(() => {
    const img = imgRef.current;
    const svg = svgRef.current;
    if (!img || !svg) return;

    // // Convert image to blob URL from image URL
    // fetchImageAsBase64(screen.src).then((data) => {
    //   setImage(data);
    // }).catch(console.error);

    // Use ResizeObserver to synchronize SVG dimensions with image dimensions
    const resizeObserver = new ResizeObserver(() => {
      svg.style.width = `${img.clientWidth}px`;
      svg.style.height = `${img.clientHeight}px`;
    });

    resizeObserver.observe(img);

    // Cleanup observer
    return () => {
      resizeObserver.unobserve(img);
    };
  }, []);

  if (!rootBounds) {
    return null; // Render nothing if rootBounds is not available
  }

  return (
    <>
      {/* Image container */}
      <div ref={imgContainerRef} style={{ position: "relative" }}>
        <Image
          ref={imgRef}
          src={screen.src}
          alt={`screen-${screen?.id}`}
          className="object-cover w-full h-auto" // Ensures consistent scaling with SVG
          width={0}
          height={0}
          sizes="100vw"
        />
        {/* SVG overlay for bounding boxes */}
        {showRedaction && (
          <svg
            ref={svgRef}
            viewBox={`${rootBounds.x} ${rootBounds.y} ${rootBounds.width} ${rootBounds.height}`}
            preserveAspectRatio="xMinYMin meet"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            {boxes.map((box: any, index: number) => (
              <BoundingBox
                key={box.id + index}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                id={box.id}
                onClick={() => console.log(`Clicked box ${box.id}`)}
                onHover={() => console.log(`Hovered over box ${box.id}`)}
              />
            ))}
          </svg>
        )}
      </div>
    </>
  );
}
