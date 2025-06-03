// src/components/layout/app-layout.tsx
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
  Activity,
  Star, // Icon for favorites
  Home, // Icon for Navegação Principal
  SlidersHorizontal, // Icon for Ferramentas
  Cog, // Icon for Configurações group
} from "lucide-react";
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
  SidebarGroup, // Added
  SidebarGroupLabel, // Added
  SidebarGroupContent, // Added
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
import { useAgents } from "@/contexts/AgentsContext"; // Added to get favorited agents
import React from "react"; // Import React for React.useMemo

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  isFavorite?: boolean; // To distinguish favorite agent links
  id?: string; // For favorited agents, to use as key
}

const mainNavItems: NavItem[] = [
  { href: "/agent-builder", icon: Cpu, label: "Agentes" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/agent-monitor", icon: Activity, label: "Monitor" },
];

// Componente interno para o toggle da sidebar, usando o contexto
function SidebarToggle() {
  const { state, toggleSidebar, collapsible, isMobile, mounted } = useSidebar();

  if (!mounted || collapsible === "none") {
    return null;
  }

  const isIconOnlyMode = !isMobile && collapsible === "icon";
  const isCollapsedInIconMode = isIconOnlyMode && state === "collapsed";
  const isExpandedInIconMode = isIconOnlyMode && state === "expanded";

  if (isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isExpandedInIconMode
          ? "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          : isCollapsedInIconMode
          ? "h-12 w-12"
          : "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8",
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
    <SidebarInset className="flex flex-col flex-1 overflow-hidden">
      {mounted && isMobile && (
        <header className="sticky top-0 z-30 flex items-center justify-start border-b bg-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <ChevronsRight className="h-5 w-5" />
          </Button>
        </header>
      )}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </SidebarInset>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { state: sidebarState, isMobile, collapsible, mounted } = useSidebar();
  const { savedAgents } = useAgents(); // Get agents from context

  const isSidebarIconOnly =
    mounted &&
    !isMobile &&
    collapsible === "icon" &&
    sidebarState === "collapsed";

  const favoritedAgentsNavItems: NavItem[] = React.useMemo(() =>
    savedAgents
      .filter((agent) => agent.isFavorite)
      .map((agent) => ({
        id: agent.id, // Add id for key prop
        href: `/agent-builder?agentId=${agent.id}`, // Or a dedicated view page if exists
        icon: Star, // Or agent.icon if available
        label: agent.agentName,
        isFavorite: true,
      })),
    [savedAgents]
  );

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
          <SidebarToggle />
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
            {/* Favoritos Section */}
            {favoritedAgentsNavItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel
                  className={cn(isSidebarIconOnly ? "justify-center" : "")}
                >
                  {isSidebarIconOnly ? <Star className="h-5 w-5" /> : "Favoritos"}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {favoritedAgentsNavItems.map((item) => (
                      <SidebarMenuItem key={item.id || item.label}>
                        <Link href={item.href} passHref>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href} // Consider if active state makes sense for agent links here
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
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            {favoritedAgentsNavItems.length > 0 && !isSidebarIconOnly && <Separator className="my-2 bg-sidebar-border" />}


            {/* Navegação Principal Section */}
            <SidebarGroup>
              <SidebarGroupLabel
                className={cn(isSidebarIconOnly ? "justify-center" : "")}
              >
                {isSidebarIconOnly ? <Home className="h-5 w-5" /> : "Navegação"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => (
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
              </SidebarGroupContent>
            </SidebarGroup>

            {!isSidebarIconOnly && <Separator className="my-2 bg-sidebar-border" />}

            {/* Placeholder for Ferramentas - To be implemented if needed */}
            <SidebarGroup>
              <SidebarGroupLabel className={cn(isSidebarIconOnly ? "justify-center" : "")}>
                {isSidebarIconOnly ? <SlidersHorizontal className="h-5 w-5" /> : "Ferramentas"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                 {/* Add Ferramentas items here if any. For now, it's an empty group. */}
                 {/* Example: <SidebarMenu><SidebarMenuItem>...</SidebarMenuItem></SidebarMenu> */}
                 {!isSidebarIconOnly && (
                    <div className="p-2 text-xs text-sidebar-foreground/70">Em breve</div>
                 )}
              </SidebarGroupContent>
            </SidebarGroup>
            {!isSidebarIconOnly && <Separator className="my-2 bg-sidebar-border" />}

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {/* Configurações Section moved to Footer as a Group */}
          <SidebarGroup>
            <SidebarGroupLabel className={cn(isSidebarIconOnly ? "justify-center" : "")}>
              {isSidebarIconOnly ? <Cog className="h-5 w-5" /> : "Minha Conta"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* The DropdownMenu for account options */}
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
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <MainLayout>{children}</MainLayout>
      <Toaster />
    </>
  );
}
