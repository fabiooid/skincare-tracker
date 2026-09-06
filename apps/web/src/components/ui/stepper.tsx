import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Stepper({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="stepper"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

const stepperStepVariants = cva(
  "grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-medium",
  {
    variants: {
      state: {
        complete: "border-transparent bg-primary text-primary-foreground",
        current: "border-primary text-foreground",
        upcoming: "border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "upcoming",
    },
  }
)

function StepperStep({
  className,
  state = "upcoming",
  step,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof stepperStepVariants> & { step?: number }) {
  return (
    <li
      data-slot="stepper-step"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className={cn(stepperStepVariants({ state }), className)}
      {...props}
    >
      {children ??
        (state === "complete" ? (
          <Check className="size-[11px] stroke-3" />
        ) : (
          step
        ))}
    </li>
  )
}

function StepperSeparator({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="stepper-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("h-px flex-1 bg-border", className)}
      {...props}
    />
  )
}

export { Stepper, StepperStep, StepperSeparator, stepperStepVariants }
