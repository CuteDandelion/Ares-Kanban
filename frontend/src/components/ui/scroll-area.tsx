import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref as any} className={cn("relative overflow-hidden", className)}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      <ScrollAreaPrimitive.ScrollArea className={cn("h-full w-full", className)}>
        {children}
      </ScrollAreaPrimitive.ScrollArea>
      <ScrollAreaPrimitive.Scrollbar className="flex select-none touch-none transition-colors w-2 hover:bg-slate-100/50 data-[orientation=vertical]:h-2.5 data-[orientation=vertical]:w-full" />
    </ScrollAreaPrimitive.Viewport>
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

export { ScrollArea }
