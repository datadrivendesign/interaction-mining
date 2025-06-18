export default function Platform() {
  return (
    <section
      id="platform"
      className="grid grid-cols-3 w-full max-w-screen-lg px-4 md:px-6 gap-4 md:gap-6 justify-center items-start"
    >
      <div className="flex col-span-3 w-full h-full p-px bg-gradient-to-br from-muted-background to-dimmed-background rounded-3xl">
        <div className="flex flex-col md:flex-row w-full h-full p-6 gap-6 bg-gradient-to-br from-dimmed-background to-background rounded-[calc(1.5rem-1px)] overflow-hidden">
          <div className="flex flex-col basis-3/5">
            <h2 className="text-foreground text-3xl font-semibold tracking-tight sr-only">
              Built on trust.
            </h2>
            <p className="w-full text-3xl text-muted-foreground font-medium tracking-tight mb-4">
              <span className="text-foreground font-semibold tracking-tight">
                Built on trust.
              </span>{" "}
              Contributors collect, clean, and annotate their own interaction data before sharing it.
            </p>
            <p className="inline-flex items-center w-full max-w-md text-3xl text-muted-foreground font-medium tracking-tight">
              Let&lsquo;s try{" "}<span className="px-3 py-1 mx-2 rounded-full ring ring-neutral-200 dark:ring-neutral-800 text-foreground cursor-pointer">repairing</span>{" "}your trace.
            </p>
          </div>
          <div className="flex justify-center items-center basis-2/5 aspect-video p-6 bg-muted-background rounded-2xl">
            <span className="text-foreground text-6xl font-black tracking-tight">
              SICK INTERACTIVE DEMO HERE
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}