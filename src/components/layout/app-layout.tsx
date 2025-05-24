
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Cpu, MessageSquare, KeyRound, Settings, LayoutGrid, PanelLeft } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: LayoutGrid, label: 'Início' },
  { href: '/agent-builder', icon: Cpu, label: 'Construtor de Agentes' },
  { href: '/chat', icon: MessageSquare, label: 'Chat com Agentes' },
  { href: '/api-key-vault', icon: KeyRound, label: 'Cofre de Chaves API' },
];

function MainLayout({ children }: { children: ReactNode }) {
  const { toggleSidebar } = useSidebar();
  // headerHeightClass logic can be simplified or managed with CSS variables if complex.
  // For now, a fixed height is used as an example.
  const headerHeightClass = "h-16";

  return (
    <SidebarInset>
      <header className={`sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-sm md:px-6 ${headerHeightClass}`}>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <PanelLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          {/* Page title or other header elements can go here */}
        </div>
      </header>
      <main className="flex-1 flex-col overflow-auto p-4 md:p-6">
        {children}
      </main>
    </SidebarInset>
  );
}


export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // Call usePathname directly in AppLayout

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary hover:text-sidebar-primary/90 transition-colors">
            <AppLogo className="h-7 w-7" />
            <span>AgentVerse</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href} // pathname is now defined in this scope
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
                    tooltip={{ children: "Configurações", side: "right", className: "bg-popover text-popover-foreground"}}
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
