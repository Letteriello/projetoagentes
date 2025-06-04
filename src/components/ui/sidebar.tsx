"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { ChevronsLeft, ChevronsRight, PanelLeft } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SIDEBAR_COOKIE_NAME, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_WIDTH, SIDEBAR_WIDTH_MOBILE, SIDEBAR_WIDTH_ICON } from "@/lib/constants";

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void; // Aceita apenas booleano, nunca função
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile?: boolean;
  toggleSidebar: () => void;
  collapsible?: "offcanvas" | "icon" | "none";
  side: "left" | "right"; // Added side
  mounted: boolean;
  isPinnedOpen: boolean; // For icon collapsible hover behavior
  setIsPinnedOpen: (pinned: boolean) => void; // For icon collapsible hover behavior
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    collapsible?: "offcanvas" | "icon" | "none";
    side?: "left" | "right"; // Added side prop
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      collapsible: collapsibleProp = "icon",
      side = "left", // Added side prop with default
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    // Initialize with defaultOpen, cookie override happens in useEffect
    const [_open, _setOpen] = React.useState(defaultOpen);
    const [mounted, setMounted] = React.useState(false);
    const [isPinnedOpen, setIsPinnedOpen] = React.useState(false); // State for pinned open

    const collapsible = isMobile ? "offcanvas" : collapsibleProp;

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (
        mounted &&
        typeof window !== "undefined" &&
        openProp === undefined &&
        collapsible !== "none"
      ) {
        const cookieValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
          ?.split("=")[1];
        if (cookieValue) {
          // Only set from cookie if not controlled and collapsible allows it
          _setOpen(cookieValue === "true");
        }
      }
    }, [mounted, openProp, collapsible]);

    const open = openProp ?? _open;
    const setOpen = React.useCallback(
  (value: boolean) => {
    if (setOpenProp) {
      setOpenProp(value);
    } else {
      _setOpen(value);
    }
    if (typeof window !== "undefined" && collapsible !== "none") {
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }
  },
  [setOpenProp, collapsible],
);

    const toggleSidebar = React.useCallback(() => {
      if (isMobile === undefined) return;
      if (isMobile) {
        setOpenMobile((current) => !current);
      } else if (collapsible !== "none") {
        const newOpenState = !open; // Calculate new state based on current `open`
        setOpen(newOpenState);
        if (collapsible === 'icon') {
          setIsPinnedOpen(newOpenState); // Pin if opened, unpin if closed by toggle
        }
      }
    }, [isMobile, setOpen, setOpenMobile, collapsible, open, setIsPinnedOpen]); // Added open and setIsPinnedOpen to dependencies

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === "b" &&
          (event.metaKey || event.ctrlKey) &&
          collapsible !== "none"
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar, collapsible]);

    const state =
      collapsible === "none" || (mounted && open) ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContextValue>(
      () => ({
        state,
        open: collapsible === "none" || (mounted && open), // Use `open` state here
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        collapsible,
        side, // Added side
        mounted,
        isPinnedOpen,
        setIsPinnedOpen,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        collapsible,
        side, // Added side to dependencies
        mounted,
        isPinnedOpen,
        setIsPinnedOpen,
      ],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full",
              collapsible === "offcanvas" &&
                state === "expanded" &&
                "has-[[data-variant=sidebar][data-state=expanded]]:bg-background/60",
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none"; // Prop to override context if needed, or just read from context
  }
>(
  (
    {
      side = "left",
      variant: variantProp, // Use variantProp to avoid conflict with local variant variable
      className,
      children,
      collapsible: collapsibleOverride, // Allow overriding context's collapsible
      ...props
    },
    ref,
  ) => {
    const context = useSidebar();
    const { isMobile, state, open, setOpen, openMobile, setOpenMobile, mounted, isPinnedOpen, setIsPinnedOpen } = context;
    const collapsible = collapsibleOverride || context.collapsible; // Prefer override, then context
    const variant = variantProp || "sidebar"; // Default to sidebar if not provided
    
    // Estado para controlar a expansão automática por hover (isHovering local ao Sidebar)
    const [isHoveringLocal, setIsHoveringLocal] = React.useState(false);

    const handleMouseEnter = React.useCallback(() => {
  if (
    !isMobile &&
    collapsible === 'icon' &&
    !isPinnedOpen &&
    !isHoveringLocal
  ) {
    if (!isHoveringLocal) setIsHoveringLocal(true);
if (!open) setOpen(true);
  }
}, [isMobile, collapsible, isPinnedOpen, isHoveringLocal, setOpen]);
    
    const handleMouseLeave = React.useCallback(() => {
  if (
    !isMobile &&
    collapsible === 'icon' &&
    !isPinnedOpen &&
    isHoveringLocal
  ) {
    setIsHoveringLocal((prev) => {
      if (prev) return false;
      return prev;
    });
    if (open) setOpen(false);
  }
}, [isMobile, collapsible, isPinnedOpen, isHoveringLocal, setOpen]);

    if (!mounted) {
      return null; // Defer rendering until client-mounted to avoid hydration issues
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[var(--sidebar-width-mobile,18rem)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    // Desktop sidebar rendering
    let sidebarVisualWidthClass = "w-[var(--sidebar-width)]";
    let spacerActualWidthClass = "w-[var(--sidebar-width)]";

    if (collapsible === "icon" && state === "collapsed") {
      sidebarVisualWidthClass = "w-[var(--sidebar-width-icon)]";
      spacerActualWidthClass = "w-[var(--sidebar-width-icon)]";
    } else if (collapsible === "offcanvas" && state === "collapsed") {
      sidebarVisualWidthClass = "w-[var(--sidebar-width)]"; // It's still this width, just off-screen
      spacerActualWidthClass = "w-0"; // Spacer takes no space
    }
    // Default is expanded or collapsible='none', full width for both.

    return (
      <div
        ref={ref}
        className={cn(
          "group peer hidden md:block text-sidebar-foreground", // This div is part of the flex layout in AppLayout
          className,
        )}
        data-state={state}
        data-collapsible={collapsible || "none"}
        data-variant={variant}
        data-side="left"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Spacer div to occupy space in the document flow */}
        <div
          className={cn(
            "relative h-svh bg-transparent transition-[width] duration-200 ease-linear",
            spacerActualWidthClass,
            variant === "inset" && (side === "left" ? "ml-2" : "mr-2"),
          )}
        />
        {/* Actual fixed sidebar content */}
        <div
          className={cn(
            "fixed inset-y-0 z-40 flex h-svh flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[left,right,width] duration-200 ease-linear",
            side === "left" ? "left-0" : "right-0",
            sidebarVisualWidthClass,
            (variant === "inset" || variant === "floating") &&
              "my-2 rounded-lg border border-sidebar-border shadow",
            variant === "inset" && (side === "left" ? "left-2" : "right-2"),
            variant === "floating" && (side === "left" ? "left-2" : "right-2"),
            collapsible === "offcanvas" &&
              state === "collapsed" &&
              (side === "left"
                ? "!-left-[var(--sidebar-width)] opacity-0 pointer-events-none"
                : "!-right-[var(--sidebar-width)] opacity-0 pointer-events-none"),
          )}
          data-sidebar="sidebar"
          data-tour="sidebar"
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar, side, state, collapsible } = useSidebar();

  if (
    collapsible === "offcanvas" ||
    collapsible === "none" ||
    (collapsible === "icon" && state === "collapsed")
  ) {
    return null;
  }

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        side === "left" ? "cursor-w-resize" : "cursor-e-resize",
        className,
      )}
      {...props}
    />
  );
});
SidebarRail.displayName = "SidebarRail";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, children, ...props }, ref) => {
  const { mounted } = useSidebar();

  // Render a basic div that will occupy space correctly on server and client initial render.
  // The flex layout managed by AppLayout and Sidebar's spacer div will handle positioning.
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background", // Ensure flex-1 is here to take up remaining space
        className,
      )}
      style={style} // Pass through any other styles from parent
      {...props}
    >
      {children}
    </div>
  );
});
SidebarInset.displayName = "SidebarInset";

export const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-sidebar-foreground/5 shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        "flex flex-col",
        isIconOnly ? "items-center py-2" : "p-2", // Adjusted padding for icon-only
        className,
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-2",
        isIconOnly ? "py-2 items-center" : "p-2",
        className,
      )}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

export const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
        isIconOnly ? "py-2 items-center" : "p-2",
        className,
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        isIconOnly && "-mt-8 opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 after:md:hidden",
        isIconOnly && "hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm p-2", className)}
    {...props}
  />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";
  return (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn(
        "flex min-w-0 flex-col",
        isIconOnly ? "gap-2 items-center" : "w-full gap-2", // Centraliza o UL em si quando iconOnly
        className,
      )}
      {...props}
    />
  );
});
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)} // w-full é removido para que o pai (ul) controle a largura
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button relative flex items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 active:animate-press-down [&_[data-lucide]]:group-hover/sidebarbutton:animate-jiggle",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-12 text-sm",
        sm: "h-9 text-xs",
        lg: "h-12 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    React.ComponentProps<typeof Slot> & {
      asChild?: boolean;
      isActive?: boolean;
      tooltip?: string | React.ComponentProps<typeof TooltipContent>;
    } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className: classNameProp,
      children,
      ...props
    },
    ref,
  ) => {
    // Sempre renderiza um <button> real dentro do TooltipTrigger para evitar ciclo de refs
    const Comp = "button";
    const {
      isMobile,
      state,
      collapsible,
      mounted: clientMounted,
    } = useSidebar();

    const isIconOnly =
      clientMounted &&
      !isMobile &&
      collapsible === "icon" &&
      state === "collapsed";

    const finalClassName = cn(
      sidebarMenuButtonVariants({ variant, size }),
      "group/sidebarbutton", // Added group for hover effect on icon
      // Aplica o brilho somente se montado no cliente e ativo
      clientMounted &&
        isActive &&
        "sidebar-item-active-glow bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      isIconOnly && "!h-12 !w-12 !p-0 justify-center", // Garante tamanho e centralização para modo ícone
      classNameProp,
    );

    // Só passa o ref para o DOM real se não for Slot
    const domRef = asChild ? undefined : ref;
    const buttonElement = (
      <Comp
        ref={domRef}
        data-sidebar="menu-button"
        data-size={size}
        // data-active é aplicado somente no cliente para evitar mismatch
        {...(clientMounted && isActive && { "data-active": "true" })}
        className={finalClassName}
        {...props}
      >
        {children}
      </Comp>
    );

    // Temporariamente desabilitado tooltips para resolver o ciclo de refs
    // O tooltip era usado apenas no estado isIconOnly
    return buttonElement;
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-[calc((theme(spacing.12)_-_theme(spacing.5))_/_2)]",
        "peer-data-[size=lg]/menu-button:top-2.5",
        isIconOnly && "hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

export const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";
  return (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-[calc((theme(spacing.12)_-_theme(spacing.5))_/_2)]",
        "peer-data-[size=lg]/menu-button:top-2.5",
        isIconOnly && "hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuBadge.displayName = "SidebarMenuBadge";

export const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

export const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";
  return (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        isIconOnly && "hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSub.displayName = "SidebarMenuSub";

export const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  const { state, collapsible, isMobile, mounted } = useSidebar();
  const isIconOnly =
    mounted && !isMobile && collapsible === "icon" && state === "collapsed";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive ? "true" : undefined}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "group/sidebarsubbutton active:animate-press-down [&_[data-lucide]]:group-hover/sidebarsubbutton:animate-jiggle", // Added group and animations
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        isIconOnly && "hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
  SidebarProvider,
};
