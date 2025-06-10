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

const inputVariants = cva(
  "flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-950 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:file:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
  {
    variants: {
      variant: {
        default: "border-input shadow-xs focus-visible:ring-ring",
        destructive:
          "border-destructive shadow-xs focus-visible:ring-destructive",
        ghost: "border-transparent -mx-3 -my-1 focus-visible:ring-ring",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.ComponentProps<"input">,
  VariantProps<typeof inputVariants> {
  ref?: React.ForwardedRef<HTMLInputElement>;
}

function Input({ className, type, ref, variant, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  );
}

export { Input, InputIcon, InputRoot, inputVariants };
