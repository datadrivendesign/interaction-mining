export default function Platform() {
  return (
    <section
      id="platform"
      className="grid w-full max-w-screen-lg grid-cols-3 items-start justify-center gap-4 px-4 md:gap-6 md:px-6"
    >
      <div className="col-span-3 flex h-full w-full rounded-3xl bg-gradient-to-br from-muted-background to-dimmed-background p-px">
        <div className="flex h-full w-full flex-col gap-6 overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-dimmed-background to-background p-6 md:flex-row">
          <div className="flex basis-3/5 flex-col">
            <h2 className="sr-only text-3xl font-semibold tracking-tight text-foreground">
              Built on trust.
            </h2>
            <p className="mb-4 w-full text-3xl font-medium tracking-tight text-muted-foreground">
              <span className="font-semibold tracking-tight text-foreground">
                Built on trust.
              </span>{" "}
              Contributors collect, clean, and annotate their own interaction
              data before sharing it.
            </p>
            <p className="inline-flex w-full max-w-md items-center text-3xl font-medium tracking-tight text-muted-foreground">
              Let&lsquo;s try{" "}
              <span className="mx-2 cursor-pointer rounded-full px-3 py-1 text-foreground ring ring-neutral-200 dark:ring-neutral-800">
                repairing
              </span>{" "}
              your trace.
            </p>
          </div>
          <div className="flex aspect-video basis-2/5 items-center justify-center rounded-2xl bg-muted-background p-6">
            <span className="text-6xl font-black tracking-tight text-foreground">
              SICK INTERACTIVE DEMO HERE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
