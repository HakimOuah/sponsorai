import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B3D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF6B3D] text-[#0B0D12] shadow-[0_16px_42px_rgba(255,107,61,0.12)] hover:-translate-y-0.5 hover:bg-[#FF865F] hover:shadow-[0_0_28px_rgba(255,107,61,0.24)]",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-white/[0.12] bg-white/[0.035] text-[#C8CEFF] hover:border-[#FF6B3D]/35 hover:bg-white/[0.065]",
        secondary: "bg-[#2A1B18] text-[#C8CEFF] hover:bg-[#35231D]",
        ghost: "text-[#D5D7DF] hover:bg-white/[0.06] hover:text-[#F6F4EF]",
        link: "text-[#FF6B3D] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
