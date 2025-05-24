
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, MessageSquare, KeyRound, Settings, LayoutGrid, PanelLeft } from 'lucide-react';
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

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: LayoutGrid, label: 'Início' },
  { href: '/agent-builder', icon: Cpu, label: 'Agentes' }, // Alterado
  { href: '/chat', icon: MessageSquare, label: 'Chat' }, // Alterado
  { href: '/api-key-vault', icon: KeyRound, label: 'Chaves API' }, // Alterado
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

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4 flex items-center justify-center h-16">
          <Link href="/" className="hover:text-sidebar-primary/90 transition-colors">
            <span className="aida-logo-text">Aida</span>
          </Link>
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
                      <span className="truncate">{item.label}</span>
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
            <SidebarMenuItem>
              <SidebarMenuButton
                className="justify-start"
                tooltip={{ children: "Configurações", side: "right", className: "bg-popover text-popover-foreground" }}
              >
                <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <MainLayout>
        {children}
      </MainLayout>
    </SidebarProvider>
  );
}
