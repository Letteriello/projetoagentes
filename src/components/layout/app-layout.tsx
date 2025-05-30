"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  MessageSquare,
  KeyRound,
  Settings,
  UserCircle,
  ChevronsLeft,
  ChevronsRight,
  // Home, // Unused
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/agent-builder", icon: Cpu, label: "Agentes" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
];

// Componente interno para o toggle da sidebar, usando o contexto
function SidebarToggle() {
  const { state, toggleSidebar, collapsible, isMobile, mounted } = useSidebar();

  if (!mounted || collapsible === "none") {
    // Hide toggle if not collapsible or not mounted
    return null;
  }

  // Determine if it's in icon-only collapsed mode for desktop
  // isMobile check is important here to ensure this logic applies to desktop icon mode
  const isIconOnlyMode = !isMobile && collapsible === "icon";
  const isCollapsedInIconMode = isIconOnlyMode && state === "collapsed";
  const isExpandedInIconMode = isIconOnlyMode && state === "expanded";

  // For mobile offcanvas, the toggle is usually in the MainLayout header
  // So, this toggle is primarily for desktop icon mode or if we decide to use it for offcanvas too.
  // Let's assume this toggle is for desktop icon mode and general collapsibility.
  // If mobile, and collapsible is 'offcanvas', the toggle might be handled by a different button in MainLayout.
  // For now, if it's mobile, and collapsible is 'icon' (which defaults to 'offcanvas' for mobile in provider),
  // this specific button might not be the primary toggle.
  // The useSidebar hook handles isMobile and sets collapsible to 'offcanvas' for mobile.

  // If it's mobile, the sidebar is a sheet, and this button might not be needed here,
  // as the sheet has its own close mechanism and is opened by a MainLayout button.
  // Let's only render this for non-mobile scenarios where it's collapsible.
  if (isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        // Positioning when sidebar is expanded (icon mode)
        isExpandedInIconMode
          ? "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          : // Centered styling when sidebar is collapsed (icon mode)
            isCollapsedInIconMode
            ? "h-12 w-12"
            : // Default for other collapsible modes or if not icon mode (should not happen if collapsible === 'none' is handled)
              "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8",
      )}
      onClick={toggleSidebar}
      aria-label={
        state === "expanded" ? "Colapsar sidebar" : "Expandir sidebar"
      }
    >
      {state === "expanded" ? (
        <ChevronsLeft className="h-5 w-5" />
      ) : (
        <ChevronsRight className="h-6 w-6" />
      )}
    </Button>
  );
}

function MainLayout({ children }: { children: ReactNode }) {
  const { toggleSidebar, isMobile, mounted } = useSidebar();

  return (
    <SidebarInset>
      {mounted && isMobile && (
        <header className="sticky top-0 z-30 flex items-center justify-start border-b bg-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            {/* For mobile, it's usually about opening the sheet, so ChevronsRight might be more appropriate */}
            <ChevronsRight className="h-5 w-5" />
          </Button>
        </header>
      )}
      {children}
    </SidebarInset>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  // useSidebar é chamado aqui para que `isSidebarIconOnly` possa ser usado pelos filhos diretos
  const { state: sidebarState, isMobile, collapsible, mounted } = useSidebar();

  const isSidebarIconOnly =
    mounted &&
    !isMobile &&
    collapsible === "icon" &&
    sidebarState === "collapsed";

  return (
    <>
      <Sidebar
        className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        collapsible="icon"
      >
        <SidebarHeader
          className={cn(
            "flex items-center justify-center relative",
            isSidebarIconOnly ? "h-14 py-2" : "h-16 p-4",
          )}
        >
          <SidebarToggle /> {/* SidebarToggle now calculates its own needs */}
          {!isSidebarIconOnly && (
            <Link
              href="/agent-builder"
              className="hover:text-sidebar-primary/90 transition-colors"
            >
              <span className="aida-logo-text">Aida</span>
            </Link>
          )}
        </SidebarHeader>
        <SidebarContent className="flex-1">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn(
                      isSidebarIconOnly ? "justify-center" : "justify-start",
                    )}
                    tooltip={{
                      children: item.label,
                      side: "right",
                      className: "bg-popover text-popover-foreground",
                    }}
                  >
                    <div>
                      <item.icon
                        className={cn(
                          "flex-shrink-0 size-5",
                          isSidebarIconOnly ? "" : "mr-2",
                        )}
                      />
                      {!isSidebarIconOnly && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Separator className="my-2 bg-sidebar-border" />
          <SidebarMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className={cn(
                    isSidebarIconOnly
                      ? "justify-center w-full"
                      : "justify-start w-full",
                  )}
                  tooltip={{
                    children: "Minha Conta",
                    side: "right",
                    className: "bg-popover text-popover-foreground",
                  }}
                  aria-label="Opções da conta"
                >
                  <UserCircle
                    className={cn(
                      "flex-shrink-0 size-5",
                      isSidebarIconOnly ? "" : "mr-2",
                    )}
                  />
                  {!isSidebarIconOnly && (
                    <span className="truncate">Minha Conta</span>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                className="w-56 bg-popover text-popover-foreground"
              >
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile" passHref>
                  <DropdownMenuItem>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/api-key-vault" passHref>
                  <DropdownMenuItem>
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Chaves API</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={() =>
                    toast({
                      title: "Em breve!",
                      description: "Página de configurações.",
                    })
                  }
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <MainLayout>{children}</MainLayout>
      <Toaster />
    </>
  );
}
