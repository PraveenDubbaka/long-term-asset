import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0 relative overflow-hidden cursor-pointer select-none rounded-[10px]",
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:scale-[1.02] hover:shadow-[0_8px_25px_hsl(213_40%_20%/0.15)]",
          "active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-primary-foreground/0 hover:before:bg-primary-foreground/[0.08]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:scale-[1.02] hover:shadow-[0_8px_25px_hsl(0_50%_30%/0.2)]",
          "active:scale-[0.98]",
        ].join(" "),
        outline: [
          "border border-border bg-background text-primary",
          "hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/[0.05]",
          "active:scale-[0.98] active:bg-primary/[0.12]",
        ].join(" "),
        secondary: [
          "bg-muted text-secondary-foreground border border-border",
          "hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),
        ghost: [
          "text-primary",
          "hover:bg-primary/[0.08] hover:scale-[1.02]",
          "active:bg-primary/[0.12] active:scale-[0.98]",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
        elevated: [
          "bg-surface-container-low text-primary shadow-elevation-1",
          "hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-elevation-3",
          "active:scale-[0.98] active:translate-y-0",
        ].join(" "),
        tonal: [
          "bg-secondary-container text-on-secondary-container",
          "hover:scale-[1.02]",
          "active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4",
        sm:      "h-8 px-3",
        lg:      "h-11 px-6",
        icon:    "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
