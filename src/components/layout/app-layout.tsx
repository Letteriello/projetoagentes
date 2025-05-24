
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, MessageSquare, KeyRound, Settings, UserCircle, ChevronsLeft, ChevronsRight, Home } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/agent-builder', icon: Cpu, label: 'Agentes' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
];

// Componente interno para o toggle da sidebar, usando o contexto
function SidebarToggle() {
  const { state, toggleSidebar, collapsible, isMobile, mounted } = useSidebar();

  if (!mounted || isMobile || collapsible === 'none') {
    return null;
  }

  const isIconOnly = collapsible === 'icon' && state === 'collapsed';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isIconOnly 
          ? "h-12 w-12" // Tamanho 48x48px no modo ícone
          : "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" // Posicionamento e tamanho no modo expandido
      )}
      onClick={toggleSidebar}
      aria-label={state === 'expanded' ? "Colapsar sidebar" : "Expandir sidebar"}
    >
      {state === 'expanded' ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-6 w-6" />}
    </Button>
  );
}


function MainLayout({ children }: { children: ReactNode }) {
  const { toggleSidebar, isMobile, mounted } = useSidebar();

  return (
    <SidebarInset>
      {mounted && isMobile && (
        <header
          className="sticky top-0 z-30 flex items-center justify-start border-b bg-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden"
        >
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle Sidebar">
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
  const { state: sidebarState, isMobile, collapsible, mounted } = useSidebar();

  const isSidebarIconOnly = mounted && !isMobile && collapsible === 'icon' && sidebarState === 'collapsed';

  return (
    <>
      <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground" collapsible="icon">
        <SidebarHeader className={cn(
          "flex items-center relative",
          isSidebarIconOnly ? "h-14 justify-center py-2" : "h-16 justify-center p-4" 
        )}>
          <SidebarToggle />
          {!isSidebarIconOnly && (
            <Link href="/agent-builder" className="hover:text-sidebar-primary/90 transition-colors">
              <span className="aida-logo-text">Aida</span>
            </Link>
          )}
        </SidebarHeader>
        <SidebarContent className="flex-1">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn( // A centralização do botão em modo ícone é feita pelo SidebarMenuButton
                      // isSidebarIconOnly ? "justify-center" : "justify-start"
                    )}
                    tooltip={{ children: item.label, side: "right", className: "bg-popover text-popover-foreground" }}
                  >
                    <a>
                      <item.icon className={cn(
                        "flex-shrink-0 size-5", // Ícone sempre size-5 (20px)
                        isSidebarIconOnly ? "" : "mr-2" 
                      )} />
                      {!isSidebarIconOnly && <span className="truncate">{item.label}</span>}
                    </a>
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
                    // isSidebarIconOnly ? "justify-center" : "justify-start w-full"
                  )}
                  tooltip={{ children: "Minha Conta", side: "right", className: "bg-popover text-popover-foreground" }}
                  aria-label="Opções da conta"
                >
                  <UserCircle className={cn(
                     "flex-shrink-0 size-5",  // Ícone sempre size-5 (20px)
                     isSidebarIconOnly ? "" : "mr-2" 
                  )} />
                  {!isSidebarIconOnly && <span className="truncate">Minha Conta</span>}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56 bg-popover text-popover-foreground">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast({ title: "Em breve!", description: "Página de perfil."})}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <Link href="/api-key-vault" passHref legacyBehavior>
                  <DropdownMenuItem>
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Chaves API</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={() => toast({ title: "Em breve!", description: "Página de configurações."})}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <MainLayout>
        {children}
      </MainLayout>
    </>
  );
}

