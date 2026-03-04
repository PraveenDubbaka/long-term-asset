import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { error?: boolean; size?: "default" | "lg" | "xl" }>(
  ({ className, type, error, size = "default", ...props }, ref) => {
    const sizeClasses = {
      default: "h-9 px-3 py-2 text-sm",
      lg:      "h-12 px-4 py-3 text-base",
      xl:      "h-14 px-5 py-4 text-base",
    };
    return (
      <input
        type={type}
        className={cn(
          "input-double-border flex w-full rounded-[10px] transition-all duration-200",
          sizeClasses[size as keyof typeof sizeClasses],
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "bg-white text-foreground placeholder:text-muted-foreground/70",
          "border border-[#dcdfe4]",
          "dark:border-[hsl(220_15%_30%)] dark:bg-card",
          "hover:border-[hsl(210_25%_75%)]",
          "disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
          error && "border-destructive hover:border-destructive",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
