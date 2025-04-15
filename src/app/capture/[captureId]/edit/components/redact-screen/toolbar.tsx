import { Eraser, MousePointer2, Pencil } from "lucide-react";

export default function Toolbar({
  mode,
  setMode,
}: {
  mode: string;
  setMode: React.Dispatch<React.SetStateAction<"pencil" | "eraser" | "select">>;
}) {
  return (
    <aside className="absolute z-10 left-4 flex flex-col justify-center items-center bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg shadow-lg">
      <button
        onClick={() => setMode("select")}
        className={`p-2 rounded ${
          mode === "select"
            ? "bg-blue-500 text-white"
            : "text-neutral-500 dark:text-neutral-400"
        }`}
      >
        <MousePointer2 className="size-5" />
      </button>
      <button
        onClick={() => setMode("pencil")}
        className={`p-2 rounded ${
          mode === "pencil"
            ? "bg-blue-500 text-white"
            : "text-neutral-500 dark:text-neutral-400"
        }`}
      >
        <Pencil className="size-5" />
      </button>
      <button
        onClick={() => setMode("eraser")}
        className={`p-2 rounded ${
          mode === "eraser"
            ? "bg-blue-500 text-white"
            : "text-neutral-500 dark:text-neutral-400"
        }`}
      >
        <Eraser className="size-5" />
      </button>
    </aside>
  );
}
