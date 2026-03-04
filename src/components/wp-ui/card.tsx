import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-card text-card-foreground transition-all duration-200 border border-border shadow-[0_2px_8px_hsl(213_40%_20%/0.06)]",
        interactive && ["cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_hsl(213_40%_20%/0.12)]"],
        className,
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const StyledCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { hover?: boolean; glow?: boolean }>(
  ({ className, hover = false, glow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-card text-card-foreground transition-all duration-200 border border-border shadow-[0_2px_8px_hsl(213_40%_20%/0.06)] rounded-md",
        hover && ["hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_hsl(213_40%_20%/0.12)]"],
        glow && "shadow-[0_0_30px_hsl(207_71%_38%/0.1)]",
        className,
      )}
      {...props}
    />
  )
);
StyledCard.displayName = "StyledCard";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-2 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, StyledCard, CardHeader, CardTitle, CardContent };
