import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* One accent (morinda red, salmon on ink). Square, as the brand draws them:
   radius 0 on buttons, cards and photographs. Labels are sentence case — the
   letterspaced caps belong to eyebrows. Press feedback is scale(.975). */
const buttonVariants = cva(
    "pressable inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-medium tracking-[.01em] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary: "bg-bt-red text-white hover:bg-bt-red-bright hover:text-white",
                secondary: "bg-ink text-white hover:bg-ink/88 hover:text-white",
                outline: "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--bt-ink)] hover:bg-ink hover:text-white",
                ghost: "bg-transparent text-ink-2 hover:text-ink hover:bg-ink/5",
                inverse: "bg-salmon text-ink hover:bg-white hover:text-ink",
                inverseGhost: "bg-transparent text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.4)] hover:bg-white hover:text-ink",
            },
            size: {
                sm: "h-9 px-4 text-[15px]",
                md: "h-11 px-5 text-base",
                lg: "h-13 px-7 text-[17px]",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: { variant: "primary", size: "md" },
    },
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
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };