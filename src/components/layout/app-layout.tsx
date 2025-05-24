
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, MessageSquare, KeyRound, Settings, UserCircle, ChevronsLeft, ChevronsRight, Home } from 'lucide-react'; // PanelLeft foi removido pois SidebarToggle o substitui
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar, // Import useSidebar
  SidebarProvider
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

// Removido "Início" e ajustado href de "Agentes"
const navItems: NavItem[] = [
  { href: '/agent-builder', icon: Cpu, label: 'Agentes' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  // "Cofre de Chaves API" foi movido para o menu "Minha Conta"
];

// Componente interno para o toggle da sidebar, usando o contexto
function SidebarToggle() {
  const { state, toggleSidebar, collapsible, isMobile, mounted } = useSidebar();

  if (!mounted || isMobile || collapsible === 'none') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
         // Posicionamento condicional para centralizar no modo ícone
        (collapsible === 'icon' && state === 'collapsed')
          ? "relative" // Deixa o flex do pai centralizar
          : "absolute right-2 top-1/2 -translate-y-1/2" 
      )}
      onClick={toggleSidebar}
      aria-label={state === 'expanded' ? "Colapsar sidebar" : "Expandir sidebar"}
    >
      {state === 'expanded' ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
    </Button>
  );
}


function MainLayout({ children }: { children: ReactNode }) {
  const { toggleSidebar, isMobile, mounted } = useSidebar();

  return (
    <SidebarInset>
      {/* Header móvel simplificado, apenas com botão de toggle da sidebar */}
      {mounted && isMobile && (
        <header
          className="sticky top-0 z-30 flex items-center justify-start border-b bg-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden"
        >
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle Sidebar">
            <ChevronsRight className="h-5 w-5" /> {/* Ou outro ícone como PanelLeft */}
          </Button>
        </header>
      )}
      {/* Conteúdo principal da página */}
      {children}
    </SidebarInset>
  );
}


export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  // Hooks do useSidebar agora são chamados dentro dos componentes que os utilizam diretamente (SidebarToggle, ou aqui para isSidebarIconOnly)
  const { state: sidebarState, isMobile, collapsible, mounted } = useSidebar();

  // Determina se a sidebar está no modo "apenas ícone"
  // Adicionado 'mounted' para garantir que isMobile e collapsible já foram determinados
  const isSidebarIconOnly = mounted && !isMobile && collapsible === 'icon' && sidebarState === 'collapsed';

  return (
    <>
      <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground" collapsible="icon">
        <SidebarHeader className="p-4 flex items-center justify-center h-16 relative">
          {/* O SidebarToggle agora é um componente que usa o contexto */}
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
                    className={cn(
                      "justify-start", 
                       isSidebarIconOnly && "justify-center" 
                    )}
                    tooltip={{ children: item.label, side: "right", className: "bg-popover text-popover-foreground" }}
                  >
                    <a>
                      <item.icon className={cn(
                        "flex-shrink-0",
                        isSidebarIconOnly ? "size-5" : "size-5 mr-2" // Tamanho consistente
                      )} />
                      {!isSidebarIconOnly && <span className="truncate">{item.label}</span>}
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <Separator className="my-2 bg-sidebar-border" />
          <SidebarMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className={cn(
                    "justify-start w-full",
                     isSidebarIconOnly && "justify-center" 
                  )}
                  tooltip={{ children: "Minha Conta", side: "right", className: "bg-popover text-popover-foreground" }}
                  aria-label="Opções da conta"
                >
                  <UserCircle className={cn(
                     "flex-shrink-0",
                     isSidebarIconOnly ? "size-5" : "size-5 mr-2" // Tamanho consistente
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
