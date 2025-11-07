
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { Home } from 'lucide-react';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_WIDTH_ICON = "2.75rem" 

type SidebarContext = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  state: "expanded" | "collapsed" | "closed"
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {

    const [open, setOpen] = React.useState(false);
    const [state, setState] = React.useState<"expanded" | "collapsed" | "closed">("collapsed");

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        open,
        setOpen,
        toggleSidebar: () => setOpen(prev => !prev),
        state,
      }),
      [open, state]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
          <div
            style={
              {
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
  }
>(
  (
    {
      side = "left",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
        <div
            ref={ref}
            data-sidebar="sidebar"
            className={cn(
                "group/sidebar text-sidebar-foreground fixed inset-y-0 z-30 flex",
                side === "left" ? "left-0" : "right-0",
                "w-[var(--sidebar-width-icon)]"
            )}
            data-state="collapsed"
        >
            <div
                className="flex h-full w-full flex-col items-center bg-sidebar"
            >
                {children}
            </div>
        </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <Home />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-2 p-2",
        "items-center",
        className
      )}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2",
        "items-center",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"


const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      tooltip,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    
    const [icon, ...otherChildren] = React.Children.toArray(children)

    const buttonContent = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(
          "relative group/button h-7 w-7 rounded-md bg-transparent transition-colors flex items-center justify-center",
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          className
        )}
        {...props}
      >
        <div 
          className={cn(
            'icon-glow-wrapper',
            isActive && 'active'
          )}
        >
          {icon}
        </div>
      </Comp>
    );

    if (!tooltip) {
      return buttonContent;
    }

    const tooltipContent = typeof tooltip === "string" ? { children: tooltip } : tooltip;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={12}
          {...tooltipContent}
        />
      </Tooltip>
    );
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarMenuButton,
  useSidebar,
  SidebarTrigger,
}
