import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate, ...props }, ref) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const [rippleKey, setRippleKey] = React.useState(0);

  const handleMouseDown = () => {
    setIsPressed(true);
    setRippleKey(prev => prev + 1);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // Determine the checked state for indeterminate support
  const checkedState = indeterminate ? "indeterminate" : props.checked;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* State layer - circular overlay for hover/focus/pressed states */}
      <div
        className={cn(
          "absolute inset-0 -m-2 rounded-full transition-all duration-200",
          // Hover state: 8% opacity
          "group-hover:bg-primary/[0.08]",
          // Pressed state: 12% opacity
          isPressed && "bg-primary/[0.12]"
        )}
      />

      {/* Ripple effect container */}
      <div className="absolute inset-0 -m-2 rounded-full overflow-hidden pointer-events-none">
        {isPressed && (
          <span
            key={rippleKey}
            className="absolute inset-0 animate-m3-ripple bg-primary/[0.12] rounded-full"
          />
        )}
      </div>

      <CheckboxPrimitive.Root
        ref={ref}
        checked={checkedState}
        className={cn(
          "group peer relative h-[18px] w-[18px] shrink-0 rounded-[2px] border-2 transition-all duration-200 ease-out",
          // Unchecked state
          "border-on-surface-variant bg-transparent",
          // Checked state
          "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-on-primary",
          // Indeterminate state
          "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-on-primary",
          // Focus state - uses focus-visible for keyboard navigation
          "focus-visible:outline-none",
          // Disabled state - 38% opacity per M3 spec
          "disabled:cursor-not-allowed disabled:opacity-[0.38]",
          // Error state support
          "data-[error=true]:border-destructive data-[error=true]:data-[state=checked]:bg-destructive data-[error=true]:data-[state=checked]:border-destructive",
          className
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn(
            "flex items-center justify-center text-current",
            // Checkmark animation
            "data-[state=checked]:animate-m3-checkmark-in",
            "data-[state=indeterminate]:animate-m3-checkmark-in"
          )}
        >
          {indeterminate ? (
            <Minus className="h-3 w-3 stroke-[3]" />
          ) : (
            <Check className="h-3 w-3 stroke-[3]" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </div>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
