
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, MessageSquare, KeyRound, Settings, LayoutGrid, PanelLeft, UserCircle, PanelLeftClose, PanelRightOpen, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  SidebarProvider,
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

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

// Removido "Início"
const navItems: NavItem[] = [
  { href: '/agents', icon: Cpu, label: 'Agentes' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  // "Chaves API" foi movido para o menu "Minha Conta"
];

function MainLayout({ children }: { children: ReactNode }) {
  const { toggleSidebar, isMobile } = useSidebar();
  const renderMobileToggle = isMobile === true;

  return (
    <SidebarInset>
      {renderMobileToggle && (
        <header
          className="sticky top-0 z-30 flex items-center justify-start border-b bg-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden"
        >
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle Sidebar">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </header>
      )}
      {children}
    </SidebarInset>
  );
}

function SidebarToggle() {
  const { toggleSidebar, state, isMobile, open } = useSidebar();
  
  if (isMobile) {
    return null; // O toggle móvel está no MainLayout header
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute right-2 top-1/2 -translate-y-1/2 group-data-[collapsible=icon]:hidden"
      onClick={toggleSidebar}
      aria-label="Toggle Sidebar"
    >
      {state === 'expanded' ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
    </Button>
  );
}


export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { state: sidebarState, isMobile, collapsible } = useSidebar(); // Adicionado para controlar visibilidade do texto

  const isSidebarIconOnly = !isMobile && sidebarState === 'collapsed' && collapsible === 'icon';

  return (
    <SidebarProvider defaultOpen>
      <Sidebar 
        className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        collapsible="icon" // Habilitar modo ícone
      >
        <SidebarHeader className="p-4 flex items-center justify-center h-16 relative">
          <Link href="/agents" className="hover:text-sidebar-primary/90 transition-colors flex items-center gap-2">
            {/* Ícone pode ser adicionado aqui se desejado no futuro, por enquanto, apenas o texto */}
            {!isSidebarIconOnly && <span className="aida-logo-text">Aida</span>}
          </Link>
          {!isMobile && <SidebarToggle />} 
        </SidebarHeader>
        <SidebarContent className="flex-1">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="justify-start"
                    tooltip={{ children: item.label, side: "right", className: "bg-popover text-popover-foreground" }}
                  >
                    <a>
                      <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
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
                  className="justify-start w-full"
                  tooltip={{ children: "Minha Conta", side: "right", className: "bg-popover text-popover-foreground" }}
                  aria-label="Opções da conta"
                >
                  <UserCircle className="mr-2 h-4 w-4 flex-shrink-0" />
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
    </SidebarProvider>
  );
}
