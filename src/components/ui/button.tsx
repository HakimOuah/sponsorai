import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3EF2A0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020403] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#F8FAF7] text-[#020403] shadow-[0_16px_42px_rgba(62,242,160,0.08)] hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(62,242,160,0.22)]",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-white/[0.12] bg-white/[0.035] text-[#DDFBEA] hover:border-[#3EF2A0]/35 hover:bg-white/[0.065]",
        secondary: "bg-[#003F32] text-[#DDFBEA] hover:bg-[#004C3B]",
        ghost: "text-[#D8DEDA] hover:bg-white/[0.06] hover:text-[#F8FAF7]",
        link: "text-[#3EF2A0] underline-offset-4 hover:underline",
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
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
