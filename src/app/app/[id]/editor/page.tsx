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

import { Screen, Trace } from "@prisma/client";
import { getTrace, updateTrace } from "@/lib/actions";
import { deleteScreens, splitTrace } from "./actions";
import { prettyTime } from "@/lib/utils/date";

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
    [traceData.id]
  );

  useEffect(() => {
    if (traceId) {
      fetchTrace().then((res) => {
        setTitleState({ ...titleState, value: res?.name || "" });
        setDescriptionState({
          ...descriptionState,
          value: res?.description || "",
        });
      });
    }
  }, [traceId]);

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
  }, [traceData, traceId, selected]);

  // const handleDelete = useCallback(async () => {
  //   if (!selected.length)
  // })

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
                          value={titleState.value || "Untitled Trace"}
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
                      Images
                    </h2>
                    <div className="flex gap-2">
                      <button
                        disabled={selected.length > 0 ? false : true}
                        className={classNames(
                          "inline-flex items-center gap-1 px-3 py-0 rounded-xl font-semibold tracking-tight leading-none transition-colors duration-100",
                          selected.length === 0
                            ? "text-neutral-500 bg-neutral-100 cursor-not-allowed"
                            : "text-black bg-neutral-100"
                        )}
                        onClick={handleSplit}
                      >
                        Split trace with selected...
                      </button>
                      <button
                        disabled={selected.length > 0 ? false : true}
                        className={classNames(
                          "inline-flex items-center gap-1 px-3 py-0 rounded-xl  font-semibold tracking-tight leading-none transition-colors duration-100",
                          selected.length === 0
                            ? "text-white bg-red-400 cursor-not-allowed"
                            : "text-white bg-red-500 "
                        )}
                      >
                        Delete screens
                      </button>
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
  const [hierarchyData, setHierarchyData] = useState(null);

  // Refs for the image and canvas elements
  const imgContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

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
    fetchTrace();
  }, [fetchTrace, screen]);

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

        boxes.push({ x, y, width, height });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => traverse(child));
      }
    }
    traverse(hierarchyData);
    return { boxes, rootBounds };
  }, [hierarchyData]);

  const drawBoundingBoxes = useCallback(() => {
    const imgContainer = imgContainerRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;

    if (!imgContainer || !canvas || !img || boxes.length === 0 || !rootBounds)
      return;

    const imgWidth = img.clientWidth;
    const imgHeight = img.clientHeight;
    const rootWidth = rootBounds.width;
    const rootHeight = rootBounds.height;

    // Set canvas size to match image size
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    canvas.style.width = `${imgWidth}px`;
    canvas.style.height = `${imgHeight}px`;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factors
    const scaleX = imgWidth / rootWidth;
    const scaleY = imgHeight / rootHeight;

    // Draw bounding boxes
    boxes.forEach((box: any) => {
      const x = (box.x - rootBounds.x) * scaleX;
      const y = (box.y - rootBounds.y) * scaleY;
      const width = box.width * scaleX;
      const height = box.height * scaleY;

      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
    });
  }, [boxes, rootBounds]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const resizeObserver = new ResizeObserver(() => {
      drawBoundingBoxes();
    });

    resizeObserver.observe(img);

    // Cleanup
    return () => {
      resizeObserver.unobserve(img);
    };
  }, [drawBoundingBoxes]);

  // Initial drawing when the image loads
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      drawBoundingBoxes();
    } else {
      img.onload = () => {
        drawBoundingBoxes();
      };
    }

    // Cleanup
    return () => {
      if (img) img.onload = null;
    };
  }, [drawBoundingBoxes]);

  return (
    <>
      <figure className="group relative flex flex-col shrink-0 w-64 border border-neutral-500/10 rounded-lg shadow-sm overflow-clip">
        <div
          className={classNames(
            "absolute z-10 top-2 left-2 flex gap-2 transition-opacity duration-100",
            isSelected() ? "opacity-100" : "group-hover:opacity-100 opacity-0"
          )}
        >
          <button className="flex size-7 justify-center items-center aspect-square text-red-500 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors duration-300">
            <input
              type="checkbox"
              checked={isSelected()}
              onChange={toggleSelected}
            />
          </button>
          <button
            className="flex justify-center items-center p-1 aspect-square text-red-500 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors duration-300"
            onClick={handleDeleteOne}
          >
            <Trash2 className="size-5" />
          </button>
        </div>
        {/* Image container */}
        <div ref={imgContainerRef} style={{ position: "relative" }}>
          <Image
            ref={imgRef}
            src={screen?.src}
            alt={`screen-${screen?.id}`}
            className="object-contain w-full h-auto"
            width={0}
            height={0}
            sizes="100vw"
          />
          {/* Canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute z-0 left-0 top-0 pointer-events-none"
          />
        </div>
      </figure>
    </>
  );
}

// function ScreenItem({ screen }: { screen: Screen }) {
//   const { selected, setSelected, fetchTrace } = useContext(EditorContext);

//   // Check if the current screen is selected
//   const isSelected = useCallback(() => {
//     return selected.some((s) => s.id === screen.id);
//   }, [selected, screen.id]);

//   // Toggle the selection state of the current screen
//   const toggleSelected = () => {
//     if (isSelected()) {
//       // Remove the screen from the selected list
//       setSelected(selected.filter((s) => s.id !== screen.id));
//     } else {
//       // Add the screen to the selected list
//       setSelected([...selected, screen]);
//     }
//   };

//   const handleDeleteOne = useCallback(async () => {
//     deleteScreens([screen]);
//     fetchTrace();
//   }, [fetchTrace, screen]);

//   return (
//     <>
//       <figure className="group relative flex flex-col shrink-0 w-64 border border-neutral-500/10 rounded-lg shadow-sm overflow-clip">
//         <div
//           className={classNames(
//             "absolute top-2 left-2 flex gap-2 transition-opacity duration-100",
//             isSelected() ? "opacity-100" : "group-hover:opacity-100 opacity-0"
//           )}
//         >
//           <button className="flex size-7 justify-center items-center aspect-square text-red-500 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors duration-300">
//             <input
//               type="checkbox"
//               checked={isSelected()}
//               onChange={toggleSelected}
//             />
//           </button>
//           <button
//             className="flex justify-center items-center p-1 aspect-square text-red-500 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors duration-300"
//             onClick={handleDeleteOne}
//           >
//             <Trash2 className="size-5" />
//           </button>
//         </div>
//         <Image
//           src={screen?.src}
//           alt={`screen-${screen?.id}`}
//           className="object-contain w-full h-auto"
//           width={0}
//           height={0}
//           sizes="100vw"
//         />
//       </figure>
//     </>
//   );
// }
