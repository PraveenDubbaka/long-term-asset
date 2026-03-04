import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

export interface ExpandableIconButtonProps extends Omit<ButtonProps, "size"> {
  icon: React.ReactNode;
  label: string;
  size?: "default" | "sm";
}

const ExpandableIconButton = React.forwardRef<HTMLButtonElement, ExpandableIconButtonProps>(
  ({ icon, label, className, size = "default", ...props }, ref) => {
    const h    = size === "sm" ? "h-8" : "h-9";
    const minW = size === "sm" ? "min-w-8" : "min-w-9";

    return (
      <Button
        ref={ref}
        size="sm"
        className={cn(
          h, minW,
          "!gap-0 px-0 group/expand overflow-hidden items-center justify-center",
          "transition-[padding,gap] duration-200 ease-in-out",
          "hover:px-3 hover:!gap-2",
          className,
        )}
        {...props}
      >
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
        <span className="grid grid-cols-[0fr] group-hover/expand:grid-cols-[1fr] transition-[grid-template-columns,opacity] duration-200 ease-in-out overflow-hidden">
          <span className="overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 group-hover/expand:opacity-100 transition-opacity duration-200 ease-in-out">
            {label}
          </span>
        </span>
      </Button>
    );
  }
);
ExpandableIconButton.displayName = "ExpandableIconButton";

export { ExpandableIconButton };
