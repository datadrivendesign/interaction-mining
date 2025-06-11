import * as React from "react";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";

export interface InputRootProps extends React.ComponentProps<"div"> { }

function InputRoot({ children, className, ...props }: InputRootProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
}

function InputIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Slot
      role="presentation"
      className={cn(
        "absolute left-3 top-2 bottom-2 pointer-events-none size-5 [&~input]:pl-11",
        className
      )}
    >
      {children}
    </Slot>
  );
}

// const inputVariants = cva(
//   "flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-950 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:file:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
//   {
//     variants: {
//       variant: {
//         default: "border-input shadow-xs focus-visible:ring-ring",
//         destructive:
//           "border-destructive shadow-xs focus-visible:ring-destructive",
//         ghost: "border-transparent -mx-3 -my-1 focus-visible:ring-ring",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//     },
//   }
// );

// export interface InputProps
//   extends React.ComponentProps<"input">,
//   VariantProps<typeof inputVariants> {
//   ref?: React.ForwardedRef<HTMLInputElement>;
// }

// function Input({ className, type, ref, variant, ...props }: InputProps) {
//   return (
//     <input
//       type={type}
//       className={cn(inputVariants({ variant }), className)}
//       ref={ref}
//       {...props}
//     />
//   );
// }

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-neutral-950 placeholder:text-neutral-500 selection:bg-neutral-900 selection:text-neutral-50 dark:bg-neutral-200/30 border-neutral-200 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:file:text-neutral-50 dark:placeholder:text-neutral-400 dark:selection:bg-neutral-50 dark:selection:text-neutral-900 dark:dark:bg-neutral-800/30 dark:border-neutral-800",
        "focus-visible:border-neutral-950 focus-visible:ring-neutral-950/50 focus-visible:ring-[3px] dark:focus-visible:border-neutral-300 dark:focus-visible:ring-neutral-300/50",
        "aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
        className
      )}
      {...props}
    />
  )
}

export {
  Input, InputIcon, InputRoot,
  // inputVariants
};
